from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv
from gemini_service import analyze_text, analyze_image
import logging
import requests
import json
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import httpx
from datetime import datetime, timedelta
from hate_speech_datasets import get_dataset_posts, get_all_dataset_posts, get_filtered_hate_posts, HATE_SPEECH_QUERIES
from io import BytesIO

load_dotenv()

app = FastAPI(title="HateGuard AI Backend")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Simple in-memory cache for Reddit posts (with TTL)
reddit_cache = {}
REDDIT_CACHE_TTL = 600  # 10 minutes cache


class CachedRedditPosts:
    def __init__(self, posts, timestamp):
        self.posts = posts
        self.timestamp = timestamp
    
    def is_expired(self):
        return (datetime.now() - self.timestamp).total_seconds() > REDDIT_CACHE_TTL


async def fetch_reddit_posts_public_json(subreddit: str, limit: int) -> list:
    """
    ⚡ FASTEST: Fetch Reddit posts using public JSON API (no auth needed!)
    Works for any public subreddit
    """
    try:
        logger.info(f"⚡ Fetching Reddit posts from r/{subreddit} using public JSON API (fastest)...")
        
        reddit_url = f"https://www.reddit.com/r/{subreddit}/hot.json"
        
        # Use proper headers that Reddit accepts
        headers = {
            'User-Agent': 'HateGuard/1.0 (by hashing_tokens)',
            'Accept': 'application/json'
        }
        
        # Short timeout - public API is fast
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(reddit_url, headers=headers)
        
        if response.status_code != 200:
            logger.error(f"Reddit public JSON API error: {response.status_code}")
            return None
        
        data = response.json()
        posts_list = []
        
        # Extract posts from the JSON response
        posts_data = data.get('data', {}).get('children', [])
        
        for post_wrapper in posts_data:
            try:
                post = post_wrapper.get('data', {})
                
                # Skip stickied posts, pinned posts, and ads
                if post.get('stickied') or post.get('pinned') or post.get('is_self_promoted'):
                    continue
                
                # Skip deleted/removed posts
                if post.get('removed_by_category') or post.get('author') == '[deleted]':
                    continue
                
                title = post.get('title', '').strip()
                selftext = post.get('selftext', '').strip()
                content = title + ("\n\n" + selftext if selftext else "")
                
                if not content.strip() or len(content.strip()) < 5:  # Skip very short posts
                    continue
                
                posts_list.append({
                    "id": post.get('id', ''),
                    "platform": "Reddit",
                    "author": f"u/{post.get('author', 'deleted')}",
                    "author_avatar": "",
                    "content": content[:500],
                    "image": "",
                    "likes": post.get('score', 0),
                    "comments": post.get('num_comments', 0),
                    "shares": 0,
                    "timestamp": datetime.fromtimestamp(post.get('created_utc', 0)).strftime("%Y-%m-%d %H:%M:%S"),
                    "url": f"https://reddit.com{post.get('permalink', '')}",
                    "source_url": f"https://reddit.com{post.get('permalink', '')}",
                    "subreddit": f"r/{post.get('subreddit', subreddit)}"
                })
                
                if len(posts_list) >= limit:
                    break
            
            except Exception as e:
                logger.warning(f"Error parsing Reddit post: {str(e)}")
                continue
        
        if posts_list:
            logger.info(f"✅ Fetched {len(posts_list)} real Reddit posts from r/{subreddit} via public JSON API")
            return posts_list
        
        logger.warning("No valid posts extracted from Reddit JSON")
        return None
    
    except Exception as e:
        logger.error(f"Reddit public JSON API failed: {str(e)}")
        return None


def get_relative_time(timestamp_str: str) -> str:
    """Convert ISO timestamp to relative time like '1 day ago', '15 hours ago', etc."""
    try:
        # Parse the timestamp
        if isinstance(timestamp_str, str):
            # Handle ISO format with or without Z
            ts_clean = timestamp_str.replace("Z", "+00:00")
            dt = datetime.fromisoformat(ts_clean)
        else:
            return timestamp_str
        
        # Calculate time difference from now
        now = datetime.now(dt.tzinfo) if dt.tzinfo else datetime.now()
        diff = now - dt
        
        # Convert to relative time
        seconds = int(diff.total_seconds())
        
        if seconds < 60:
            return f"{seconds}s ago" if seconds > 1 else "now"
        elif seconds < 3600:
            minutes = seconds // 60
            return f"{minutes}m ago" if minutes > 1 else "1m ago"
        elif seconds < 86400:
            hours = seconds // 3600
            return f"{hours}h ago" if hours > 1 else "1h ago"
        elif seconds < 604800:  # 7 days
            days = seconds // 86400
            return f"{days}d ago" if days > 1 else "1d ago"
        elif seconds < 2592000:  # 30 days
            weeks = seconds // 604800
            return f"{weeks}w ago" if weeks > 1 else "1w ago"
        else:
            months = seconds // 2592000
            return f"{months}mo ago" if months > 1 else "1mo ago"
    except Exception as e:
        logger.warning(f"Error calculating relative time for {timestamp_str}: {str(e)}")
        return timestamp_str


class TextInput(BaseModel):
    text: str


class ImageInput(BaseModel):
    imageBase64: str


class AnalysisResult(BaseModel):
    label: str
    confidence: int
    reason: str
    extracted_text: Optional[str] = None


class RedditPostsRequest(BaseModel):
    subreddit: str
    limit: int = 5


class TwitterRequest(BaseModel):
    query: str = ""
    limit: int = 5


class InstagramRequest(BaseModel):
    query: str = ""
    limit: int = 5


class FacebookRequest(BaseModel):
    query: str = ""
    limit: int = 5


class RedditRequest(BaseModel):
    query: str = ""
    limit: int = 5


class SocialMediaRequest(BaseModel):
    query: str = ""
    limit: int = 10


class HatePostsFilterRequest(BaseModel):
    platform: Optional[str] = None
    category: str = "all_hate"
    limit: int = 10


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/proxy-image")
async def proxy_image(url: str):
    """Proxy images to bypass CORS restrictions from Instagram, etc."""
    try:
        if not url:
            raise HTTPException(status_code=400, detail="URL parameter required")
        
        # Security: only allow certain domains
        if not any(domain in url for domain in ['instagram.com', 'fbcdn.net', 'redditusercontent.com', 'i.redd.it', 'imgur.com', 'scontent']):
            raise HTTPException(status_code=403, detail="Domain not allowed")
        
        # Fetch image with headers
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, follow_redirects=True, headers={'User-Agent': 'Mozilla/5.0'})
        
        if response.status_code == 200:
            return StreamingResponse(BytesIO(response.content), media_type=response.headers.get('content-type', 'image/jpeg'))
        else:
            raise HTTPException(status_code=404, detail="Image not found")
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="Image fetch timeout")
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Image proxy error for {url}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch image: {str(e)}")


@app.post("/api/analyze-text", response_model=AnalysisResult)
async def analyze_text_endpoint(input_data: TextInput):
    try:
        if not input_data.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        result = await analyze_text(input_data.text)
        return result
    except Exception as e:
        error_msg = str(e) if str(e) else "Failed to analyze text with Gemini API"
        logger.error(f"Error analyzing text: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)


@app.post("/api/analyze-image", response_model=AnalysisResult)
async def analyze_image_endpoint(input_data: ImageInput):
    try:
        if not input_data.imageBase64.strip():
            raise HTTPException(status_code=400, detail="Image cannot be empty")
        
        result = await analyze_image(input_data.imageBase64)
        return result
    except Exception as e:
        logger.error(f"Error analyzing image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/twitter/posts")
async def get_twitter_posts(request: TwitterRequest):
    import time
    from datetime import datetime
    
    api_key = os.getenv('TWITTER_API_KEY')
    query = (request.query or "").strip()
    limit = request.limit
    
    if not api_key or api_key == 'your_getxapi_key_here':
        raise HTTPException(status_code=401, detail="Twitter API key not configured. Please set TWITTER_API_KEY in .env")
    
    # Default query if empty
    if not query:
        query = "#trending OR #viral"
    
    try:
        headers = {
            'Authorization': f'Bearer {api_key}',
        }
        
        url = 'https://api.getxapi.com/twitter/tweet/advanced_search'
        params = {
            'q': query,
            'product': 'Latest',
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=15)
        
        # ✅ Rate limit handle - retry once
        if response.status_code == 429:
            logger.warning("GetXAPI rate limit hit — waiting 6 seconds and retrying...")
            time.sleep(6)
            response = requests.get(url, params=params, headers=headers, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            posts = []
            tweets = data.get('tweets', data.get('data', []))
            
            if not tweets:
                raise HTTPException(status_code=404, detail="No tweets found for this search query")
            
            for tweet in tweets[:limit]:
                try:
                    created_utc = 0
                    created_at_str = tweet.get('createdAt', '')
                    if created_at_str:
                        try:
                            dt = datetime.strptime(created_at_str, '%a %b %d %H:%M:%S %z %Y')
                            created_utc = int(dt.timestamp())
                        except:
                            created_utc = int(datetime.now().timestamp())
                    
                    author_info = tweet.get('author', {})
                    author_name = '@' + author_info.get('userName', author_info.get('name', 'twitter_user'))
                    author_avatar = author_info.get('profilePicture', None)
                    
                    text = tweet.get('text', '')
                    image_url = None
                    
                    media = tweet.get('media', [])
                    if isinstance(media, list) and len(media) > 0:
                        image_url = media[0].get('url', media[0].get('media_url', None))
                    
                    # Get the real tweet URL from API response
                    tweet_url = tweet.get('url', tweet.get('twitterUrl', None))
                    if not tweet_url:
                        # Construct URL from tweet data if not provided
                        tweet_id = tweet.get('id', '')
                        user_handle = author_info.get('userName', author_info.get('name', ''))
                        if tweet_id and user_handle:
                            tweet_url = f"https://x.com/{user_handle}/status/{tweet_id}"
                        else:
                            tweet_url = f"https://x.com/search?q={query}"
                    
                    post = {
                        'id': str(tweet.get('id', '')),
                        'title': text[:100],
                        'text': text,
                        'author': author_name,
                        'author_avatar': author_avatar,
                        'subreddit': 'Twitter',
                        'created_utc': created_utc,
                        'url': tweet_url,
                        'image': image_url,
                        'platform': 'Twitter',
                        'score': tweet.get('likeCount', 0),
                        'comments': tweet.get('replyCount', 0)
                    }
                    posts.append(post)
                except Exception as e:
                    logger.warning(f"Error parsing tweet: {str(e)}")
                    continue
            
            if posts:
                logger.info(f"✅ Fetched {len(posts)} tweets from GetXAPI for query: {query}")
                return {'posts': posts}
            else:
                raise HTTPException(status_code=500, detail="Could not parse tweets from API response")
        
        elif response.status_code == 429:
            raise HTTPException(status_code=429, detail="Twitter API rate limit exceeded. Please try again later.")
        else:
            error_msg = response.text[:200] if response.text else f"HTTP {response.status_code}"
            logger.error(f"GetXAPI error: {response.status_code} — {error_msg}")
            raise HTTPException(status_code=response.status_code, detail=f"Twitter API error: {error_msg}")

    except HTTPException:
        raise
    except Exception as api_error:
        logger.error(f"GetXAPI call failed: {str(api_error)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch tweets: {str(api_error)}")


@app.post("/api/instagram/posts")
async def get_instagram_posts(request: SocialMediaRequest):
    try:
        # Use query as username, default to "nasa" if empty or placeholder
        username = request.query or "nasa"
        if username.lower() in ["", "instagram", "trending", "latest"]:
            username = "nasa"
        
        apify_token = os.getenv("APIFY_API_TOKEN")
        if not apify_token:
            raise HTTPException(status_code=500, detail="APIFY_API_TOKEN not configured")
        
        apify_url = "https://api.apify.com/v2/acts/apify~instagram-post-scraper/run-sync-get-dataset-items"
        
        # Optimized for fast fetching
        input_payload = {
            "username": [username],
            "resultsLimit": min(request.limit, 20),  # Cap at 20 for speed
            "dataDetailLevel": "basicData"
        }
        
        # Fast timeout: 40 seconds for Instagram
        async with httpx.AsyncClient(timeout=40.0) as client:
            response = await client.post(
                apify_url,
                params={"token": apify_token},
                json=input_payload
            )
        
        if response.status_code not in [200, 201]:
            error_msg = response.text[:200] if response.text else f"HTTP {response.status_code}"
            logger.error(f"Apify Instagram API error: {response.status_code} - {error_msg}")
            raise HTTPException(status_code=response.status_code, detail=f"Instagram fetch failed: {error_msg}")
        
        dataset_items = response.json()
        
        if not isinstance(dataset_items, list) or len(dataset_items) == 0:
            logger.warning(f"No posts returned from Apify for @{username}")
            raise HTTPException(status_code=404, detail=f"No posts found for {username}")
        
        result = []
        for item in dataset_items[:request.limit]:
            try:
                # Parse timestamp
                timestamp_str = item.get("timestamp", "")
                if timestamp_str:
                    try:
                        dt = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
                        timestamp = dt.strftime("%Y-%m-%d %H:%M:%S")
                    except:
                        timestamp = timestamp_str
                else:
                    timestamp = "N/A"
                
                # Get image
                image = item.get("displayUrl", "")
                if not image and item.get("images"):
                    images = item.get("images", [])
                    image = images[0] if len(images) > 0 else ""
                
                # Get author avatar if available
                author_avatar = item.get("ownerProfilePicUrl") or item.get("profilePicUrl") or ""
                
                result.append({
                    "id": str(item.get("id") or item.get("shortCode") or ""),
                    "platform": "Instagram",
                    "author": item.get("ownerUsername", username),
                    "author_avatar": author_avatar,
                    "content": item.get("caption", "")[:500],
                    "image": image,
                    "likes": item.get("likesCount", 0),
                    "comments": item.get("commentsCount", 0),
                    "shares": 0,
                    "timestamp": timestamp,
                    "url": item.get("url", f"https://www.instagram.com/p/{item.get('shortCode', '')}/"),
                    "source_url": item.get("url", f"https://www.instagram.com/p/{item.get('shortCode', '')}/")
                })
            except Exception as e:
                logger.warning(f"Error parsing Instagram post: {str(e)}")
                continue
        
        if not result:
            logger.warning(f"No posts could be parsed from Apify response")
            raise HTTPException(status_code=404, detail="Failed to parse posts")
        
        logger.info(f"✅ Fetched {len(result)} Instagram posts from @{username}")
        return {"posts": result, "platform": "Instagram", "total": len(result)}
    
    except httpx.TimeoutException:
        logger.error("Apify Instagram request timed out (60s)")
        raise HTTPException(status_code=408, detail="Request timeout - Instagram request took too long")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Instagram fetch failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch Instagram posts: {str(e)}")


@app.post("/api/facebook/posts")
async def get_facebook_posts(request: SocialMediaRequest):
    try:
        # Use query to build page URL, default to Meta page if empty or placeholder
        page_url = request.query or "https://www.facebook.com/meta"
        
        # If query doesn't start with http, construct the URL
        if page_url and not page_url.startswith("http"):
            page_url = f"https://www.facebook.com/{page_url}"
        
        if not page_url:
            page_url = "https://www.facebook.com/meta"
        
        apify_token = os.getenv("APIFY_API_TOKEN")
        if not apify_token:
            raise HTTPException(status_code=500, detail="APIFY_API_TOKEN not configured")
        
        apify_url = "https://api.apify.com/v2/acts/apify~facebook-posts-scraper/run-sync-get-dataset-items"
        
        input_payload = {
            "startUrls": [{"url": page_url}],
            "resultsLimit": min(request.limit, 25)  # Cap at 25 for faster results
        }
        
        # Fast timeout: 60 seconds for Facebook
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                apify_url,
                params={"token": apify_token},
                json=input_payload
            )
        
        if response.status_code not in [200, 201]:
            error_msg = response.text[:200] if response.text else f"HTTP {response.status_code}"
            logger.error(f"Apify Facebook API error: {response.status_code} - {error_msg}")
            raise HTTPException(status_code=response.status_code, detail=f"Apify run failed: {error_msg}")
        
        dataset_items = response.json()
        
        if not isinstance(dataset_items, list) or len(dataset_items) == 0:
            logger.warning(f"No posts returned from Apify for {page_url}")
            raise HTTPException(status_code=404, detail="No posts found")
        
        result = []
        for item in dataset_items[:request.limit]:
            try:
                # Parse timestamp
                timestamp_str = item.get("time") or item.get("timestamp")
                if isinstance(timestamp_str, (int, float)):
                    timestamp = datetime.fromtimestamp(timestamp_str).strftime("%Y-%m-%d %H:%M:%S")
                elif isinstance(timestamp_str, str):
                    try:
                        dt = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
                        timestamp = dt.strftime("%Y-%m-%d %H:%M:%S")
                    except:
                        timestamp = timestamp_str
                else:
                    timestamp = "N/A"
                
                # Get image from media
                image = ""
                if item.get("media") and isinstance(item["media"], list) and len(item["media"]) > 0:
                    media_item = item["media"][0]
                    if isinstance(media_item, dict):
                        image = media_item.get("thumbnail") or media_item.get("url") or ""
                
                # Get author avatar
                author_avatar = item.get("userProfilePicture") or item.get("profilePicture") or ""
                
                # Get author name
                author = ""
                if item.get("user") and isinstance(item["user"], dict):
                    author = item["user"].get("name", "")
                if not author:
                    author = item.get("pageName", "Facebook")
                
                result.append({
                    "id": str(item.get("postId") or item.get("facebookId") or ""),
                    "platform": "Facebook",
                    "author": author,
                    "author_avatar": author_avatar,
                    "content": item.get("text", "")[:500],
                    "image": image,
                    "likes": item.get("likes", 0),
                    "comments": item.get("comments", 0),
                    "shares": item.get("shares", 0),
                    "timestamp": timestamp,
                    "url": item.get("url") or item.get("facebookUrl") or page_url,
                    "source_url": item.get("url") or item.get("facebookUrl") or page_url
                })
            except Exception as e:
                logger.warning(f"Error parsing Facebook post: {str(e)}")
                continue
        
        if not result:
            logger.warning(f"No posts could be parsed from Apify response")
            raise HTTPException(status_code=404, detail="Failed to parse posts")
        
        logger.info(f"✅ Fetched {len(result)} Facebook posts from {page_url}")
        return {"posts": result, "platform": "Facebook", "total": len(result)}
    
    except httpx.TimeoutException:
        logger.error("Apify Facebook request timed out")
        raise HTTPException(status_code=408, detail="Request timeout")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Facebook fetch failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch Facebook posts: {str(e)}")


@app.post("/api/reddit/posts")
async def get_reddit_posts(request: SocialMediaRequest):
    """Fetch Reddit posts using Apify (same as Facebook & Instagram)"""
    try:
        # Use query as subreddit, default to "technology" if empty
        subreddit = request.query or "technology"
        if subreddit.lower() in ["", "reddit", "trending", "latest"]:
            subreddit = "technology"
        
        subreddit = subreddit.lower().replace("r/", "")
        cache_key = f"reddit_{subreddit}"
        
        # Check cache first
        if cache_key in reddit_cache and not reddit_cache[cache_key].is_expired():
            logger.info(f"✅ Using cached Reddit posts for r/{subreddit}")
            posts = reddit_cache[cache_key].posts[:request.limit]
            return {"posts": posts, "platform": "Reddit", "total": len(posts), "cached": True}
        
        apify_token = os.getenv("APIFY_API_TOKEN")
        if not apify_token:
            raise HTTPException(status_code=500, detail="APIFY_API_TOKEN not configured")
        
        reddit_url = f"https://www.reddit.com/r/{subreddit}/"
        
        # Same Apify scraper payload as used for other platforms
        input_payload = {
            "type": "community",
            "startUrls": [{"url": reddit_url}],
            "sort": "hot",
            "maxItems": min(request.limit + 5, 20),
            "proxy": {"useApifyProxy": True}
        }
        
        apify_url = "https://api.apify.com/v2/acts/trudax~reddit-scraper-lite/run-sync-get-dataset-items"
        
        logger.info(f"📡 Fetching Reddit posts from r/{subreddit} using Apify (60s timeout)...")
        
        # 60-second timeout for Apify
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                apify_url,
                params={"token": apify_token},
                json=input_payload
            )
        
        if response.status_code not in [200, 201]:
            error_msg = response.text[:200] if response.text else f"HTTP {response.status_code}"
            logger.error(f"Apify Reddit API error: {response.status_code} - {error_msg}")
            
            # Fallback to cache
            if cache_key in reddit_cache:
                logger.warning("Apify error, using cached posts")
                return {"posts": reddit_cache[cache_key].posts[:request.limit], "platform": "Reddit", "cached": True}
            
            raise HTTPException(status_code=response.status_code, detail=f"Reddit fetch failed: {error_msg}")
        
        dataset_items = response.json()
        
        if not isinstance(dataset_items, list) or len(dataset_items) == 0:
            logger.warning(f"No posts from Apify for r/{subreddit}")
            if cache_key in reddit_cache:
                return {"posts": reddit_cache[cache_key].posts[:request.limit], "platform": "Reddit", "cached": True}
            raise HTTPException(status_code=404, detail=f"No posts found in r/{subreddit}")
        
        result = []
        for item in dataset_items:
            try:
                # Parse timestamp
                timestamp_str = item.get("createdAt")
                if isinstance(timestamp_str, (int, float)):
                    timestamp = datetime.fromtimestamp(timestamp_str).strftime("%Y-%m-%d %H:%M:%S")
                elif isinstance(timestamp_str, str):
                    try:
                        dt = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
                        timestamp = dt.strftime("%Y-%m-%d %H:%M:%S")
                    except:
                        timestamp = timestamp_str
                else:
                    timestamp = "N/A"
                
                # Get post content
                title = (item.get("title") or "").strip()
                body = (item.get("body") or "").strip()
                content = title + ("\n\n" + body if body else "")
                
                if not content.strip():
                    continue
                
                # Get image if available
                image = ""
                if item.get("media") and isinstance(item["media"], dict):
                    image = item["media"].get("url", "")
                
                # Get author info
                author_name = item.get("username") or item.get("author") or "unknown"
                
                result.append({
                    "id": str(item.get("id", "")),
                    "platform": "Reddit",
                    "author": f"u/{author_name}",
                    "author_avatar": "",
                    "content": content[:500],
                    "image": image,
                    "likes": int(item.get("upVotes") or item.get("score") or 0),
                    "comments": int(item.get("numberOfComments") or 0),
                    "shares": 0,
                    "timestamp": timestamp,
                    "url": item.get("url", reddit_url),
                    "source_url": item.get("url", reddit_url),
                    "subreddit": f"r/{item.get('communityName', subreddit)}"
                })
                
                if len(result) >= request.limit:
                    break
            
            except Exception as e:
                logger.warning(f"Error parsing Reddit post: {str(e)}")
                continue
        
        if not result:
            logger.warning("No posts could be parsed from Apify response")
            if cache_key in reddit_cache:
                return {"posts": reddit_cache[cache_key].posts[:request.limit], "platform": "Reddit", "cached": True}
            raise HTTPException(status_code=404, detail="Failed to parse posts")
        
        # Cache results
        reddit_cache[cache_key] = CachedRedditPosts(result, datetime.now())
        logger.info(f"✅ Fetched {len(result)} Reddit posts from r/{subreddit} via Apify")
        
        return {"posts": result[:request.limit], "platform": "Reddit", "total": len(result)}
    
    except httpx.TimeoutException:
        logger.error(f"Apify Reddit timeout (60s) for r/{subreddit}")
        cache_key = f"reddit_{request.query or 'technology'}"
        if cache_key in reddit_cache:
            logger.info("Returning cached posts due to timeout")
            return {"posts": reddit_cache[cache_key].posts[:request.limit], "platform": "Reddit", "cached": True}
        raise HTTPException(status_code=408, detail="Reddit request timeout")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reddit fetch failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch Reddit posts: {str(e)}")


@app.get("/api/hate-speech-queries")
async def get_hate_speech_queries():
    """Get available hate speech search queries for dropdown"""
    return {"queries": HATE_SPEECH_QUERIES}


@app.post("/api/dataset/hate-posts")
async def get_hate_posts_filtered(request: HatePostsFilterRequest):
    """Fetch hate speech posts from dataset with filtering"""
    try:
        result = get_filtered_hate_posts(
            platform=request.platform,
            category=request.category,
            limit=request.limit
        )
        
        posts = result.get("posts", [])
        
        # Add relative time to each post
        for post in posts:
            if "timestamp" in post:
                post["relative_time"] = get_relative_time(post["timestamp"])
            else:
                post["relative_time"] = "N/A"
        
        logger.info(f"✅ Fetched {len(posts)} filtered hate speech posts (platform={request.platform}, category={request.category})")
        return {
            "posts": posts,
            "total": len(posts),
            "source": "dataset",
            "filters": {
                "platform": request.platform or "all",
                "category": request.category,
                "limit": request.limit
            }
        }
    except Exception as e:
        logger.error(f"Filtered hate posts fetch failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch filtered hate posts: {str(e)}")


@app.post("/api/dataset/posts/{platform}")
async def get_dataset_platform_posts(platform: str, request: SocialMediaRequest):
    """Fetch hate speech posts from dataset for a specific platform"""
    try:
        platform_lower = platform.lower()
        posts = get_dataset_posts(platform_lower)
        
        if not posts:
            raise HTTPException(status_code=404, detail=f"No dataset available for platform: {platform}")
        
        # Limit posts
        result = posts[:request.limit] if request.limit else posts
        
        logger.info(f"✅ Fetched {len(result)} hate speech posts from {platform} dataset")
        return {
            "posts": result,
            "platform": platform,
            "total": len(result),
            "source": "dataset"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dataset fetch failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch dataset posts: {str(e)}")


@app.get("/api/dataset/all")
async def get_all_dataset_posts_endpoint():
    """Fetch all hate speech posts from all platforms in dataset"""
    try:
        posts = get_all_dataset_posts()
        logger.info(f"✅ Fetched {len(posts)} total hate speech posts from all datasets")
        return {
            "posts": posts,
            "total": len(posts),
            "source": "dataset",
            "platforms": ["Twitter", "Instagram", "Facebook", "Reddit"]
        }
    except Exception as e:
        logger.error(f"Dataset fetch failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch dataset posts: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
