const BACKEND_API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const blueskFeeds = [
  'timeline',
  'discover',
  'trending'
]

export const fetchBlueskPosts = async (feed = 'timeline', limit = 5) => {
  try {
    const response = await fetch(
      `${BACKEND_API_BASE}/api/bluesky/posts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feed: feed,
          limit: limit
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`)
    }

    const data = await response.json()
    return data.posts || []
  } catch (error) {
    console.error('Error fetching Bluesky posts:', error)
    throw error
  }
}
