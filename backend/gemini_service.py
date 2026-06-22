import asyncio
import aiohttp
import json
import os
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)

# Multiple API keys - jab ek khatam ho to dusri try karega
GEMINI_API_KEYS = [
    os.getenv("GEMINI_API_KEY_1"),
    os.getenv("GEMINI_API_KEY_2"),
    os.getenv("GEMINI_API_KEY_3"),
    os.getenv("GEMINI_API_KEY_4"),
]
GEMINI_API_KEYS = [k for k in GEMINI_API_KEYS if k]

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent"

TEXT_SYSTEM_PROMPT = """You are a hate speech detection AI. Classify the given text into 
exactly one of these 5 categories:

1. HATE_SPEECH — general hate, dehumanization, targeted hostility
2. SECTARIAN — sect-based hatred (e.g. Shia vs Sunni, Protestant 
   vs Catholic)
3. RACIAL_ABUSE — slurs or attacks based on race or ethnicity
4. RELIGIOUS_THREAT — threats targeting a religion or its followers
5. NEUTRAL — safe, normal, informational, or constructive content

Rules:
- If multiple categories apply, pick the most severe one
- Base decision only on the text content, not assumptions
- Confidence must reflect how certain you are (0-100)

Respond ONLY in this exact JSON, nothing else:
{
  "label": "HATE_SPEECH" or "SECTARIAN" or "RACIAL_ABUSE" 
            or "RELIGIOUS_THREAT" or "NEUTRAL",
  "confidence": number 0-100,
  "reason": "one sentence explanation in English"
}"""

IMAGE_SYSTEM_PROMPT = """First extract all visible text from this image exactly as written.
Then classify the extracted text using the hate speech detection rules.

You are a hate speech detection AI. Classify the extracted text into 
exactly one of these 5 categories:

1. HATE_SPEECH — general hate, dehumanization, targeted hostility
2. SECTARIAN — sect-based hatred (e.g. Shia vs Sunni, Protestant 
   vs Catholic)
3. RACIAL_ABUSE — slurs or attacks based on race or ethnicity
4. RELIGIOUS_THREAT — threats targeting a religion or its followers
5. NEUTRAL — safe, normal, informational, or constructive content

Rules:
- If multiple categories apply, pick the most severe one
- Base decision only on the text content, not assumptions
- Confidence must reflect how certain you are (0-100)

Respond ONLY in this exact JSON, nothing else:
{
  "extracted_text": "all text found in image",
  "label": "HATE_SPEECH" or "SECTARIAN" or "RACIAL_ABUSE" 
            or "RELIGIOUS_THREAT" or "NEUTRAL",
  "confidence": number 0-100,
  "reason": "one sentence explanation in English"
}"""


async def call_gemini_api(prompt: str, system_prompt: str, image_data: str = None):
    if not GEMINI_API_KEYS:
        raise Exception("Koi bhi GEMINI_API_KEY set nahi .env mein")

    last_error = None

    for i, api_key in enumerate(GEMINI_API_KEYS):
        try:
            parts = []
            if image_data:
                parts.append({"inlineData": {"mimeType": "image/jpeg", "data": image_data}})
                parts.append({"text": prompt})
            else:
                parts.append({"text": prompt})

            payload = {
                "contents": [{"parts": parts}],
                "systemInstruction": {"parts": [{"text": system_prompt}]},
                "generationConfig": {"temperature": 0.1, "maxOutputTokens": 500}
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{GEMINI_API_URL}?key={api_key}",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:

                    if response.status in (429, 403):
                        error_text = await response.text()
                        logger.warning(f"Key {i+1} quota khatam ({response.status}), agla try kar raha hun...")
                        last_error = f"Key {i+1} failed: {response.status}"
                        continue

                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"Gemini API error: {response.status} - {error_text}")

                    data = await response.json()

                    if "candidates" not in data or len(data["candidates"]) == 0:
                        raise Exception("No candidates returned from Gemini API")

                    text_content = data["candidates"][0]["content"]["parts"][0].get("text", "")
                    text_content = text_content.replace("```json", "").replace("```", "").strip()
                    result = json.loads(text_content)

                    logger.info(f"Key {i+1} ne kaam kiya!")
                    return result

        except Exception as e:
            if any(x in str(e) for x in ["429", "403", "quota", "RESOURCE_EXHAUSTED"]):
                logger.warning(f"Key {i+1} issue: {str(e)}, agla try kar raha hun...")
                last_error = str(e)
                continue
            logger.error(f"Key {i+1} detailed error: {type(e).__name__}: {str(e)}")
            raise

    raise Exception(f"Sab API keys khatam ho gayi! Last error: {last_error}")


async def analyze_text(text: str):
    try:
        result = await call_gemini_api(
            prompt=f"Analyze this text: {text}",
            system_prompt=TEXT_SYSTEM_PROMPT
        )
        return {
            "label": result.get("label", "NEUTRAL"),
            "confidence": int(result.get("confidence", 50)),
            "reason": result.get("reason", "Analysis complete"),
            "extracted_text": None
        }
    except Exception as e:
        logger.error(f"Error in analyze_text: {str(e)}")
        raise


async def analyze_image(image_base64: str):
    try:
        result = await call_gemini_api(
            prompt="Analyze this image for hate speech content",
            system_prompt=IMAGE_SYSTEM_PROMPT,
            image_data=image_base64
        )
        return {
            "label": result.get("label", "NEUTRAL"),
            "confidence": int(result.get("confidence", 50)),
            "reason": result.get("reason", "Analysis complete"),
            "extracted_text": result.get("extracted_text", "No text found in image")
        }
    except Exception as e:
        logger.error(f"Error in analyze_image: {str(e)}")
        raise