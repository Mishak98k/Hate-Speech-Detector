# API Reference

## Base URLs
- **Backend**: `http://localhost:8000`
- **Frontend**: `http://localhost:3000`

## Health Check

### GET /health
Check if the backend server is running.

**Response (200 OK)**
```json
{
  "status": "healthy"
}
```

---

## Text Analysis

### POST /api/analyze-text
Analyze text for hate speech content.

**Request**
```json
{
  "text": "The text content to analyze"
}
```

**Response (200 OK)**
```json
{
  "label": "HATE_SPEECH|SECTARIAN|RACIAL_ABUSE|RELIGIOUS_THREAT|NEUTRAL",
  "confidence": 85,
  "reason": "This text contains hate speech targeting a specific group.",
  "extracted_text": null
}
```

**Error Responses**
- `400 Bad Request`: Text is empty
- `500 Internal Server Error`: API processing failed

**Example Request**
```bash
curl -X POST http://localhost:8000/api/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Sample text to analyze"}'
```

---

## Image Analysis

### POST /api/analyze-image
Analyze image for hate speech content. Gemini Vision extracts text from the image and classifies it.

**Request**
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response (200 OK)**
```json
{
  "label": "HATE_SPEECH|SECTARIAN|RACIAL_ABUSE|RELIGIOUS_THREAT|NEUTRAL",
  "confidence": 92,
  "reason": "The extracted text contains hate speech.",
  "extracted_text": "All the text found in the image as written"
}
```

**Error Responses**
- `400 Bad Request`: Image data is empty
- `500 Internal Server Error`: Image processing failed

**Supported Image Formats**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

**Maximum Image Size**: 5 MB

**Example Request (JavaScript)**
```javascript
const file = document.querySelector('input[type="file"]').files[0]
const reader = new FileReader()
reader.onload = async (e) => {
  const base64 = e.target.result.split(',')[1]
  const response = await fetch('http://localhost:8000/api/analyze-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64 })
  })
  const result = await response.json()
  console.log(result)
}
reader.readAsDataURL(file)
```

---

## Classification Labels

### HATE_SPEECH (🔴)
- **Description**: General hate, dehumanization, targeted hostility
- **Badge Color**: Red (#A32D2D)
- **Background**: Light Red (#FCEBEB)
- **Confidence Range**: Typically 60-95%
- **Example**: "All members of X group should be eliminated"

### SECTARIAN (🟣)
- **Description**: Sect-based hatred (Shia vs Sunni, Protestant vs Catholic, etc.)
- **Badge Color**: Purple (#3C3489)
- **Background**: Light Purple (#EEEDFE)
- **Confidence Range**: Typically 70-90%
- **Example**: "Sunni Muslims are infidels"

### RACIAL_ABUSE (🟠)
- **Description**: Slurs or attacks based on race or ethnicity
- **Badge Color**: Orange (#854F0B)
- **Background**: Light Orange (#FAEEDA)
- **Confidence Range**: Typically 65-95%
- **Example**: "People of Y ethnicity are criminals"

### RELIGIOUS_THREAT (🟥)
- **Description**: Threats targeting a religion or its followers
- **Badge Color**: Dark Red (#501313)
- **Background**: Light Red (#F7C1C1)
- **Confidence Range**: Typically 70-95%
- **Example**: "We will attack Z religious places"

### NEUTRAL (🟢)
- **Description**: Safe, normal, informational, or constructive content
- **Badge Color**: Green (#3B6D11)
- **Background**: Light Green (#EAF3DE)
- **Confidence Range**: Typically 50-95%
- **Example**: "Today is a nice day", "Informational article"

---

## Response Format

All responses follow this JSON structure:

```json
{
  "label": "string",        // One of 5 categories above
  "confidence": "number",   // 0-100, confidence of classification
  "reason": "string",       // 1-2 sentence explanation
  "extracted_text": "string|null"  // null for text, extracted text for images
}
```

---

## Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "detail": "Text cannot be empty"
}
```

**500 Internal Server Error**
```json
{
  "detail": "Error message describing what went wrong"
}
```

---

## Rate Limiting (Free Tier)

- **Google Gemini API**: 60 requests per minute per project
- **Backend**: No built-in rate limiting (use reverse proxy in production)
- **Social APIs**: Reddit and Mastodon have their own rate limits

**Recommendation**: Implement rate limiting middleware in production using tools like Redis.

---

## Request/Response Examples

### Example 1: Analyze Hateful Text

**Request**
```bash
curl -X POST http://localhost:8000/api/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"text": "I hate all people of group X"}'
```

**Response**
```json
{
  "label": "HATE_SPEECH",
  "confidence": 92,
  "reason": "The statement expresses explicit hatred toward a specific group.",
  "extracted_text": null
}
```

### Example 2: Analyze Neutral Content

**Request**
```bash
curl -X POST http://localhost:8000/api/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"text": "The weather is beautiful today"}'
```

**Response**
```json
{
  "label": "NEUTRAL",
  "confidence": 98,
  "reason": "This is neutral, everyday content with no hate speech.",
  "extracted_text": null
}
```

### Example 3: Image with Text

**Request** (JavaScript)
```javascript
const imageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAA..."
fetch('http://localhost:8000/api/analyze-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageBase64 })
})
.then(r => r.json())
.then(result => console.log(result))
```

**Response**
```json
{
  "label": "RELIGIOUS_THREAT",
  "confidence": 85,
  "reason": "The extracted text contains threats against a specific religion.",
  "extracted_text": "We will burn down all temples of Z religion"
}
```

---

## Timeout Configuration

- **Request Timeout**: 30 seconds
- **Gemini API Response Time**: 2-5 seconds typical
- **Image Processing**: 3-5 seconds typical

---

## CORS Headers

The backend includes CORS headers for:
- Allow Origin: `*` (all origins)
- Allow Methods: `GET, POST, PUT, DELETE, OPTIONS`
- Allow Headers: `*` (all headers)

For production, restrict to known domains:
```python
allow_origins=["https://yourdomain.com"]
```

---

## WebSocket Support

Currently, this API uses REST endpoints. For real-time updates, consider implementing WebSockets for social feed streaming.

---

## Pagination

Social feeds return a fixed 15 posts per request. No pagination parameters currently supported. To implement pagination:

```python
@app.post("/api/analyze-text")
async def analyze_text_endpoint(input_data: TextInput, limit: int = 15, offset: int = 0):
    # Implementation
    pass
```

---

## Caching Strategy

Responses are not cached by default. To add caching:

```python
from functools import lru_cache

@lru_cache(maxsize=128)
async def cached_analysis(text: str):
    return await analyze_text(text)
```

---

## Versioning

Current API version: **v1 (beta)**

For future versions, use URL structure:
- `/v1/api/analyze-text`
- `/v2/api/analyze-text`

---

## Webhooks (Future)

Plan to support webhooks for batch analysis:
```
POST /api/webhooks/analyze-batch
{
  "webhook_url": "https://your-domain.com/callback",
  "texts": ["text1", "text2"]
}
```

---

## Performance Metrics

**Typical Response Times**
- Text Analysis: 2-3 seconds
- Image Analysis: 3-5 seconds
- Health Check: < 50ms

**Recommended Concurrency**: 5-10 simultaneous requests (free tier)

---

## Testing with Postman

1. Import endpoints into Postman
2. Set variables:
   - `base_url`: `http://localhost:8000`
3. Create requests for each endpoint
4. Test with different input samples

---

## Troubleshooting

**"API Key not valid" error**
- Verify GEMINI_API_KEY in .env
- Check key hasn't expired
- Regenerate key at aistudio.google.com

**"Connection refused"**
- Ensure backend is running on port 8000
- Check firewall settings
- Try `localhost` instead of IP

**"CORS error"**
- Ensure backend is running
- Check frontend is on different port
- Clear browser cache

**"Image too large"**
- Max size is 5MB
- Compress image before upload
- Use image optimization tools
