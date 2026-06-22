# Quick Start Guide

## 5-Minute Setup

### Step 1: Get Gemini API Key (Free)
1. Visit [aistudio.google.com](https://aistudio.google.com)
2. Click "Get API Key"
3. Create a new API key
4. Copy the key

### Step 2: Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt


# Create .env file and add:
copy .env.example .env
# GEMINI_API_KEY=your_key_here

python main.py
```
✅ Backend running at `http://localhost:8000`

### Step 3: Frontend Setup (New Terminal)
```bash
cd frontend
copy .env.example .env

npm install
npm run dev
```
✅ Frontend running at `http://localhost:3000`

## Testing

### Text Detection
1. Go to "Text Detection" tab
2. Paste any text
3. Click "Analyze Text"
4. See classification with confidence score

### Image Detection
1. Go to "Image Detection" tab
2. Upload JPG/PNG/WEBP image
3. Click "Analyze Image"
4. See extracted text + classification

### Social Feed
1. Go to "Social Feed" tab
2. Select Platform (Reddit/Mastodon)
3. Select Subreddit/Instance
4. Click "Fetch Posts"
5. View AI analysis for each post

## Troubleshooting

**"GEMINI_API_KEY not set" error**
- Check .env file exists in backend/
- Restart backend after creating .env

**CORS errors**
- Backend and frontend must run on different ports
- Frontend proxy is configured in vite.config.js

**Image upload fails**
- Check image size (max 5MB)
- Supported formats: JPG, PNG, WEBP

**Social feed loading slow**
- Normal for first time (analyzing 15 posts)
- Subsequent requests cache results

## Performance Tips
- Use dark mode for reduced eye strain
- Close other tabs for faster processing
- Keep browser updated for best performance

## Next Steps
- Check README.md for detailed documentation
- See DEVELOPMENT.md for contributing
- Check API.md for API reference
