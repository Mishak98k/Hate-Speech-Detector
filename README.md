# HateGuard AI - Hate Speech Detection Web App

A production-quality, full-stack AI-powered hate speech detection application using Google Gemini 2.5 Flash API.

## Features

### 🎯 Core Functionality
- **Text Analysis**: Analyze text for 5 hate speech categories with confidence scores
- **Image Analysis**: Extract text from images using Gemini Vision and analyze for hate speech
- **Social Monitor**: Fetch and analyze real posts from 4 social platforms (Twitter, Instagram, Facebook, Reddit)
- **Dataset Monitor**: Access 5,000+ pre-collected hate speech posts for analysis and model training
- **Evidence Logging**: Track all analyzed posts with timestamps, categories, and confidence scores
- **PDF Report Generation**: Export analysis results and evidence as professional PDF reports
- **Performance Metrics**: Monitor statistics (total analyzed, hate count, distribution)

### 📊 Classification Categories
1. **Hate Speech** - General hate, dehumanizing language
2. **Sectarian** - Sect-based hatred (Shia/Sunni, religious divisions)
3. **Racial Abuse** - Ethnicity/race-based slurs or attacks
4. **Religious Threat** - Threats targeting religion or believers
5. **Neutral** - Safe, normal, harmless content

### ✨ User Experience
- Mobile-first, fully responsive design
- Dark mode support with localStorage persistence
- Smooth animations and loading skeletons
- Copy-to-clipboard for results
- Toast notifications for user feedback
- Real-time confidence scores with progress bars
- Post source links to original content
- Multi-page navigation (Dashboard, Text Analysis, Image Analysis, Social Monitor, Dataset Monitor, Evidence Log, PDF Report, Performance)

## Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **AI**: Google Gemini 2.5 Flash API
- **Async**: aiohttp for concurrent API calls
- **CORS**: Enabled for frontend communication
- **Database**: In-memory storage (can be extended to persistent DB)

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS with dark mode support
- **Icons**: lucide-react
- **State Management**: React Hooks
- **PDF Generation**: jsPDF library

### External APIs
- **Gemini API**: Text & image analysis (Google Cloud)
- **Twitter API**: Real posts via GetX API endpoint
- **Instagram API**: Real posts via Apify actor
- **Facebook API**: Real posts via Apify actor
- **Reddit API**: Real posts via Apify actor

## ⚖️ Legal & Compliance Notice

**Important**: This application uses real social media data from Reddit, Twitter, Instagram, and Facebook for educational hate speech analysis purposes.

### Reddit API Terms of Service
- Reddit's ToS **explicitly prohibits** using Reddit data to train or run ML/AI models for automated content moderation without **explicit written approval** from Reddit.
- This application uses Apify's web scraper for data collection (not direct Reddit API authentication).
- **Compliance**: If deploying this application with Reddit data collection for production hate speech detection models, you **MUST** obtain written approval from Reddit's legal team.
- For research/educational use only without model deployment, verify compliance with Reddit's current policies.
- See: https://www.reddit.com/r/reddit/wiki/api

### Other Platforms
- **Twitter/X**: Requires GetX API (paid). Subject to X's API terms for hate speech research.
- **Instagram & Facebook**: Uses Apify actors. Subject to Meta's Terms of Service for data scraping.
- **General**: Always verify ToS of any platform before deploying to production.

### Recommendation
- For **production deployment**, contact platform legal teams for data usage permissions.
- For **research/academic use**, document compliance with institutional review boards.
- For **local testing/demo**, no special approval needed.

## Dataset

**Hate Speech Dataset**: 5,000+ unique posts from UC Berkeley "Measuring Hate Speech" dataset
- **Source**: https://huggingface.co/datasets/ucberkeley-dlab/measuring-hate-speech
- **Distribution**: 1,250 posts per platform (Twitter, Instagram, Facebook, Reddit)
- **Categories**: All 5 hate speech types with keyword-based filtering
- **No Duplicates**: Real data with unique variations, no generation/repetition

## Setup Instructions

### Quick Start (5 minutes)
See **[QUICKSTART.md](QUICKSTART.md)**

### Development Setup

#### Prerequisites
- Python 3.10+
- Node.js 16+
- Google Gemini API key (free tier available at: https://ai.google.dev)
- (Optional) Apify API token for Instagram/Facebook/Reddit posts

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run backend
python main.py
```

Backend runs on: `http://localhost:8000`

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:3000`

### Environment Variables

**Backend (.env)**
```
GEMINI_API_KEY=your_gemini_api_key_here
APIFY_API_TOKEN=your_apify_token_here (optional, for enhanced social post fetching)
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:8000
```

## API Endpoints

### Health Check
- `GET /health` - Check server status

### Text Analysis
- `POST /api/analyze-text` - Analyze text for hate speech

### Image Analysis
- `POST /api/analyze-image` - Extract text from image and analyze

### Social Media Posts
- `POST /api/twitter/posts` - Fetch real Twitter posts
- `POST /api/instagram/posts` - Fetch real Instagram posts
- `POST /api/facebook/posts` - Fetch real Facebook posts
- `POST /api/reddit/posts` - Fetch real Reddit posts

### Dataset Posts
- `POST /api/dataset/hate-posts` - Get hate speech dataset posts with filters (platform, category, limit)

See **[API.md](API.md)** for detailed endpoint documentation.

## Deployment

### Docker
```bash
# Development
docker-compose up

# Production
docker-compose -f docker-compose.prod.yml up
```

See **[DOCKER.md](DOCKER.md)** for detailed Docker instructions.

### Cloud Deployment
Guides available for:
- Heroku
- AWS (EC2, ECS, Lambda)
- Google Cloud (Cloud Run, App Engine)
- Azure (App Service)
- DigitalOcean
- Vercel (Frontend)
- Railway

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for step-by-step guides.

## Project Structure

```
gemini-project/
├── backend/
│   ├── main.py                    # FastAPI application
│   ├── gemini_service.py          # Gemini API integration
│   ├── hate_speech_datasets.py    # 5000 real hate speech posts
│   ├── requirements.txt           # Python dependencies
│   ├── Dockerfile                 # Docker configuration
│   └── .env.example              # Environment template
│
├── frontend/
│   ├── src/
│   │   ├── pages/                # Route pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── TextAnalysis.jsx
│   │   │   ├── ImageAnalysis.jsx
│   │   │   ├── SocialMonitor.jsx
│   │   │   ├── DatasetMonitor.jsx
│   │   │   ├── EvidenceLog.jsx
│   │   │   ├── PDFReport.jsx
│   │   │   └── Performance.jsx
│   │   ├── components/            # Reusable components
│   │   ├── api/                  # API client functions
│   │   ├── utils/                # Utility functions
│   │   └── App.jsx               # Main app component
│   ├── package.json              # npm dependencies
│   ├── vite.config.js            # Vite configuration
│   └── Dockerfile                # Docker configuration
│
├── docker-compose.yml            # Development Docker setup
├── docker-compose.prod.yml       # Production Docker setup
│
└── Documentation/
    ├── README.md                 # This file
    ├── QUICKSTART.md            # 5-minute setup guide
    ├── API.md                   # API reference
    ├── DEVELOPMENT.md           # Developer guide
    ├── DEPLOYMENT.md            # Deployment guides
    ├── DOCKER.md                # Docker documentation
    ├── TROUBLESHOOTING.md       # Common issues & fixes
    └── INDEX.md                 # Documentation index
```

## Features in Detail

### Dashboard Page
- Overview of analysis statistics
- Total analyzed posts counter
- Hate vs. Neutral distribution
- Quick access to all features

### Text Analysis Page
- Real-time text input
- Instant hate speech classification
- Confidence score (0-100%)
- Detailed reasoning for classification
- Copy results to clipboard
- Save to evidence log

### Image Analysis Page
- Image upload with preview
- OCR text extraction using Gemini Vision
- Analyze extracted text for hate speech
- Display confidence scores
- Download analyzed image
- Save evidence

### Social Monitor Page
- Real-time fetching from 4 platforms
- Platform selector (Twitter, Instagram, Facebook, Reddit, All)
- Keyword search across platforms
- Adjustable post limit (1-100 per platform)
- View original posts via Source button
- One-click analysis of multiple posts
- Parallel analysis for speed

### Dataset Monitor Page
- 5,000 pre-curated hate speech posts
- Platform filtering (Twitter, Instagram, Facebook, Reddit, All Platforms)
- Hate type filtering (5 categories)
- Adjustable post limit (1-500 per platform, 1-2000 total)
- Batch analysis of dataset posts
- No duplicates - real data with variations

### Evidence Log Page
- Complete history of all analyzed posts
- Searchable and filterable
- Timestamp tracking
- Category labels
- Confidence scores
- Export to PDF

### PDF Report Page
- Professional report generation
- Include selected posts
- Summary statistics
- Category breakdown
- Export as PDF file

### Performance Page
- Real-time statistics dashboard
- Charts and visualizations
- API response times
- Analysis distribution

## Development

See **[DEVELOPMENT.md](DEVELOPMENT.md)** for:
- Code structure and guidelines
- How to add new features
- Testing procedures
- Database integration
- Gemini API prompt engineering

## Troubleshooting

Common issues and solutions in **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**

## API Rate Limits

- **Gemini API**: 60 requests per minute (free tier)
- **Social Media APIs**: Varies by platform
- **Dataset**: No rate limits (local storage)

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]

## Support

- Check **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** first
- Review **[API.md](API.md)** for endpoint details
- Read **[DEVELOPMENT.md](DEVELOPMENT.md)** for code structure

---

**Last Updated**: June 2026
**Version**: 2.0 (Real Dataset Integration)
**Status**: Production Ready ✅

**Frontend (.env)**
```
REACT_APP_API_URL=https://your-api-domain.com
```

### Building for Production

**Frontend**
```bash
cd frontend
npm run build
# Output in frontend/dist/
```

**Backend**
```bash
# Use production ASGI server like Gunicorn
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

## Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Considerations
- Text analysis: ~2-3 seconds (Gemini API latency)
- Image analysis: ~3-5 seconds (Gemini Vision processing)
- Social feed: ~15-30 seconds for 15 posts (parallel analysis)
- Confidence bar animations: 500ms smooth transition
- Dark mode: No performance impact (CSS-based)

## Error Handling
- Image size validation (max 5MB)
- Image format validation (JPG, PNG, WEBP)
- Empty input detection
- API timeout handling (30 seconds)
- Network error recovery with user-friendly messages

## Data Privacy
- No data is stored server-side (stateless API)
- All processing is ephemeral
- Images are not saved after analysis
- Stats are stored locally in browser localStorage
- Public APIs used for social feeds (no authentication)

## Future Enhancements
- User authentication and saved analyses
- Export analysis reports (PDF/CSV)
- Batch processing for multiple files
- Advanced filtering for social feeds
- Custom model training
- Multi-language support
- Browser extension

## License
MIT

## Support
For issues or feature requests, please create an issue in the repository.
