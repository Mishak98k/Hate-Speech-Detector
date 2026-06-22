# Development Guide

## Project Structure

```
gemini-project/
├── backend/
│   ├── main.py              # FastAPI server
│   ├── gemini_service.py    # Gemini API integration
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment template
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── api/             # API integration
│   │   ├── App.jsx          # Main app component
│   │   ├── main.jsx         # React entry point
│   │   └── index.css        # Tailwind styles
│   ├── package.json         # npm dependencies
│   ├── vite.config.js       # Vite configuration
│   ├── tailwind.config.js   # Tailwind configuration
│   └── index.html           # HTML template
├── README.md                # Project documentation
├── QUICKSTART.md            # Quick setup guide
└── DEVELOPMENT.md           # This file
```

## Development Workflow

### Backend Development

1. **Adding a new endpoint**
```python
# In main.py
@app.post("/api/new-endpoint")
async def new_endpoint(input_data: YourModel):
    try:
        result = await your_service_function(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

2. **Adding Gemini features**
```python
# In gemini_service.py
async def new_feature(param):
    result = await call_gemini_api(
        prompt="Your prompt here",
        system_prompt="System instructions"
    )
    return result
```

3. **Testing endpoints**
```bash
curl -X POST http://localhost:8000/api/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Sample text"}'
```

### Frontend Development

1. **Creating a new component**
```jsx
// src/components/NewComponent.jsx
export const NewComponent = ({ prop1, prop2 }) => {
  const [state, setState] = React.useState(null)
  
  return (
    <div className="...">
      {/* Component JSX */}
    </div>
  )
}
```

2. **Adding API calls**
```javascript
// src/api/newapi.js
export const newFunction = async (params) => {
  try {
    const response = await fetch(url, options)
    return await response.json()
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}
```

3. **Using Tailwind CSS**
```jsx
// Responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  
// Dark mode
<div className="bg-white dark:bg-gray-800">
  
// Custom colors (see tailwind.config.js)
<div className="bg-hate-speech-light text-hate-speech-dark">
```

## Code Style Guidelines

### Python (Backend)
- Use async/await for all I/O operations
- Type hints for all function parameters
- Descriptive error messages
- Logging for debugging
- CORS enabled by default

### JavaScript/React (Frontend)
- Functional components with hooks
- Named exports for components
- JSDoc comments for complex logic
- Use Tailwind utility classes (no custom CSS when possible)
- Handle loading and error states

## Testing

### Backend Testing
```bash
cd backend
source venv/bin/activate

# Manual testing
curl http://localhost:8000/health

# Load testing with multiple requests
python -m stress_test.py  # Create this file for testing
```

### Frontend Testing
```bash
cd frontend
npm run build  # Test production build

# Browser DevTools
# F12 → Console for errors
# F12 → Network for API calls
```

## Common Issues

### API Connection Issues
- Check both servers are running
- Verify ports: Backend 8000, Frontend 3000
- Check CORS headers in browser console

### Slow Performance
- Check Gemini API rate limits (60 req/minute for free tier)
- Monitor network latency
- Use browser DevTools Performance tab

### Memory Issues
- Clear browser localStorage: `localStorage.clear()`
- Close unused browser tabs
- Restart both servers

## Environment Variables

### Backend
```bash
GEMINI_API_KEY=your_key          # Required
```

### Frontend
```bash
REACT_APP_API_URL=http://localhost:8000  # Default
```

## Deployment Checklist

- [ ] Add real Gemini API key
- [ ] Update REACT_APP_API_URL to production
- [ ] Remove console.log statements
- [ ] Test all features on mobile
- [ ] Check dark mode on all pages
- [ ] Verify error handling
- [ ] Load test with concurrent users
- [ ] Check image upload size limits
- [ ] Verify CORS settings
- [ ] Test with different browsers

## Performance Optimization

1. **Backend**
   - Use connection pooling for APIs
   - Implement caching for common requests
   - Add request rate limiting

2. **Frontend**
   - Use React.memo for expensive components
   - Lazy load images
   - Code splitting with Vite

3. **General**
   - Compress images before upload
   - Use CDN for static assets
   - Enable gzip compression

## Monitoring & Logging

### Backend Logs
```python
import logging
logger = logging.getLogger(__name__)
logger.info("Message")
logger.error("Error")
```

### Frontend Errors
```javascript
console.log("Info")
console.error("Error")
// Use browser DevTools Console tab
```

## Git Workflow

```bash
# Feature branch
git checkout -b feature/new-feature

# Make changes and test
git add .
git commit -m "Add new feature: description"

# Push and create PR
git push origin feature/new-feature
```

## Dependencies Management

### Backend
```bash
# Add new dependency
pip install package_name
pip freeze > requirements.txt

# Update all
pip install -U -r requirements.txt
```

### Frontend
```bash
# Add new dependency
npm install package-name

# Update all
npm update
```

## Security Best Practices

1. **API Keys**: Never commit to git, use .env
2. **CORS**: Restrict to known domains in production
3. **Input Validation**: Always validate user input
4. **Error Messages**: Don't expose sensitive details
5. **HTTPS**: Use SSL/TLS in production
6. **Rate Limiting**: Implement for API endpoints
7. **CSRF Protection**: Enable in FastAPI for forms

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Google Gemini API](https://ai.google.dev/)
- [Reddit API Documentation](https://www.reddit.com/dev/api)
- [Mastodon API Documentation](https://docs.joinmastodon.org/)
