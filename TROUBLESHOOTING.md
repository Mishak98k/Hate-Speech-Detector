# Troubleshooting & Installation Guide

## Table of Contents
1. [Installation Issues](#installation-issues)
2. [Runtime Errors](#runtime-errors)
3. [API & Connectivity](#api--connectivity)
4. [Performance Issues](#performance-issues)
5. [Deployment Issues](#deployment-issues)
6. [Browser Compatibility](#browser-compatibility)

---

## Installation Issues

### Python Virtual Environment Issues

**Problem: "python" command not found**
```bash
# Windows
python --version

# macOS/Linux
python3 --version
```

**Solution:**
- Install Python 3.8+
- On Windows, add Python to PATH during installation
- Use `python3` instead of `python` on macOS/Linux

**Problem: "pip" not found**
```bash
# Upgrade pip
python -m pip install --upgrade pip

# On Windows
python -m pip install -r requirements.txt

# On macOS/Linux
python3 -m pip install -r requirements.txt
```

### Node.js Installation Issues

**Problem: "npm" command not found**
```bash
# Check Node.js version
node --version

# Check npm version
npm --version
```

**Solution:**
- Install Node.js 16+ from nodejs.org
- Restart terminal after installation
- Clear npm cache: `npm cache clean --force`

**Problem: npm install fails**
```bash
# Clear cache and reinstall
rm package-lock.json
npm cache clean --force
npm install

# If still fails, try:
npm install --legacy-peer-deps
```

### Git Issues

**Problem: "git not recognized"**
- Install Git from git-scm.com
- Add to PATH
- Restart terminal

**Problem: Repository clone fails**
```bash
# Check internet connection
ping github.com

# Try SSH instead of HTTPS
git clone git@github.com:user/repo.git

# Or use HTTPS with token
git clone https://token@github.com/user/repo.git
```

---

## Runtime Errors

### Backend Errors

#### "ModuleNotFoundError: No module named 'fastapi'"

```bash
# Solution: Install dependencies
pip install -r requirements.txt

# Or install individually
pip install fastapi uvicorn aiohttp pydantic python-dotenv
```

#### "GEMINI_API_KEY not set"

```bash
# Check if .env file exists
ls -la backend/.env  # macOS/Linux
dir backend\.env     # Windows

# Create .env file
cd backend
echo "GEMINI_API_KEY=your_key_here" > .env

# Verify it's set
cat .env  # macOS/Linux
type .env # Windows
```

#### "Address already in use :8000"

```bash
# Find process using port 8000
# Windows
netstat -ano | findstr :8000
taskkill /PID process_id /F

# macOS/Linux
lsof -i :8000
kill -9 process_id
```

#### "Request timeout"

```python
# Increase timeout in FastAPI
@app.post("/api/analyze-text")
async def analyze_text_endpoint(input_data: TextInput):
    # Timeout set to 30 seconds in gemini_service.py
    # If still timing out, check Gemini API status
    pass
```

### Frontend Errors

#### "Cannot find module 'react'"

```bash
# Solution: Install dependencies
npm install

# Or specific package
npm install react react-dom
```

#### "Port 3000 already in use"

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID process_id /F

# macOS/Linux
lsof -i :3000
kill -9 process_id

# Or use different port
npm run dev -- --port 3001
```

#### "CSS not loading (Tailwind)"

```bash
# Rebuild Tailwind
npm run dev

# Clear cache
rm -rf node_modules package-lock.json
npm install
npm run dev
```

#### "Build fails"

```bash
# Clear build artifacts
rm -rf dist

# Rebuild
npm run build

# Check for errors
npm run build 2>&1 | grep -i error
```

---

## API & Connectivity

### Backend API Issues

#### "Cannot GET /health"

```bash
# Check backend is running
curl http://localhost:8000/health

# If failed, check:
# 1. Backend is running: python main.py
# 2. Port 8000 is correct
# 3. No firewall blocking
```

#### "CORS error: Access-Control-Allow-Origin"

```javascript
// Error in browser console:
// Access to XMLHttpRequest has been blocked by CORS policy

// Solution: Check FastAPI CORS config
# In main.py, verify:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# For production, restrict:
allow_origins=["https://yourdomain.com"]
```

#### "Gemini API returns 401 Unauthorized"

```bash
# Check API key
echo $GEMINI_API_KEY  # macOS/Linux
echo %GEMINI_API_KEY% # Windows

# If empty, set it:
export GEMINI_API_KEY=your_key  # macOS/Linux
set GEMINI_API_KEY=your_key     # Windows

# Verify key is valid
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents": [{"parts": [{"text": "test"}]}]}'
```

#### "429 Too Many Requests"

```
Gemini API limit: 60 requests/minute (free tier)

Solution:
- Implement request queuing
- Add exponential backoff
- Use caching for repeated requests
- Upgrade to paid tier if needed
```

### Frontend API Issues

#### "Failed to fetch: TypeError: Failed to fetch"

```javascript
// Common causes:
1. Backend not running
2. Wrong API URL in frontend .env
3. Network/firewall issue
4. CORS misconfiguration

// Solutions:
// Check .env
cat frontend/.env

// Update API URL
REACT_APP_API_URL=http://localhost:8000

// Restart frontend
npm run dev
```

#### "Response is not valid JSON"

```javascript
// Check Gemini response
// In browser console, check Network tab

// Verify response format from API
curl http://localhost:8000/api/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"text": "test"}'

// Should return valid JSON
// If not, check backend logs
```

---

## Performance Issues

### Slow Response Times

#### Text Analysis takes 5+ seconds

```
Normal: 2-3 seconds
Slow: 5+ seconds

Causes:
1. Gemini API slow (check their status page)
2. Network latency (check ping)
3. Rate limited (wait a minute)
4. Server overloaded (check CPU)

Solutions:
- Implement request caching
- Use connection pooling
- Add request queuing
```

#### Image Analysis very slow

```
Normal: 3-5 seconds
Very slow: 10+ seconds

Causes:
1. Large image file (>2MB)
2. High resolution
3. Complex image with lots of text
4. Gemini Vision processing bottleneck

Solutions:
- Compress images before upload
- Resize images (max 1920x1920)
- Reduce image quality
- Upgrade Gemini tier
```

#### Social feed loading slowly

```
Normal: 15-30 seconds (15 posts analyzed)
Slow: 30+ seconds

Causes:
1. 15 parallel API calls = rate limiting
2. Reddit/Mastodon API slow
3. Internet connection slow
4. Gemini API bottleneck

Solutions:
- Implement queue instead of parallel
- Cache results
- Reduce posts fetched (5 instead of 15)
- Check internet speed
```

### Browser Performance

#### High memory usage

```javascript
// Clear localStorage
localStorage.clear()

// Disable features
// - Dark mode toggle
// - Stats persistence

// Optimize images
// - Lazy load images
// - Use thumbnails
```

#### CPU usage high

```
Causes:
1. Constant re-renders
2. Unoptimized animations
3. Large DOM

Solutions:
// Use React.memo for components
const ResultCard = React.memo(({ result }) => {
  return <div>{result}</div>
})

// Use useCallback for handlers
const handleAnalyze = useCallback(() => {
  // Analysis logic
}, [])
```

---

## Deployment Issues

### Docker Issues

#### "Docker daemon is not running"

```bash
# macOS
open /Applications/Docker.app

# Linux
sudo systemctl start docker

# Windows
# Start Docker Desktop application
```

#### "Build fails with 'not found'"

```bash
# Check Dockerfile path
docker build -f backend/Dockerfile -t hateguard-backend ./backend

# Clear cache
docker build --no-cache -t hateguard-backend .

# Check internet (downloading dependencies)
```

#### "Container exits immediately"

```bash
# Check logs
docker-compose logs backend
docker logs container_id

# Common issues:
# - GEMINI_API_KEY not set
# - Syntax error in Python
# - Port already in use
```

### Production Deployment

#### "502 Bad Gateway"

```
Causes:
1. Backend service down
2. Timeout connecting to backend
3. Wrong service URL

Solutions:
# Check backend health
curl https://api.yourdomain.com/health

# Check logs
docker logs hateguard-backend

# Restart services
docker-compose restart backend
```

#### "SSL/TLS certificate issues"

```bash
# Verify certificate
openssl s_client -connect yourdomain.com:443

# Renew with Let's Encrypt
sudo certbot renew

# Check expiration
sudo certbot certificates
```

---

## Browser Compatibility

### Chrome/Edge Issues

**Problem: Dark mode not working**
```javascript
// Check browser support
console.log(window.matchMedia('(prefers-color-scheme: dark)').matches)

// Force dark mode in CSS
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
  }
}
```

### Safari Issues

**Problem: Image upload not working**
```javascript
// Use .catch() instead of modern .catch()
fetch(url)
  .then(r => r.json())
  .catch(e => console.error(e))

// Avoid optional chaining
result?.confidence  // ❌ Not supported
result && result.confidence  // ✅ Use this
```

### Firefox Issues

**Problem: CORS errors**
```
Firefox is stricter with CORS

Solutions:
1. Ensure backend CORS headers are correct
2. Test with curl first
3. Check browser console for details
```

### Mobile Browser Issues

**Problem: Textarea input lag**
```javascript
// Debounce input handler
const handleInput = debounce((text) => {
  setText(text)
}, 200)

// Or use onBlur instead of onChange
<textarea onBlur={(e) => setText(e.target.value)} />
```

---

## General Troubleshooting Steps

### For any error, follow this procedure:

1. **Read the error message carefully**
   - Note error code
   - Look for file path and line number
   - Check the full error text

2. **Check logs**
   ```bash
   # Backend logs
   python main.py  # See output
   docker-compose logs backend

   # Frontend logs
   npm run dev  # See console output
   Browser DevTools → Console tab
   ```

3. **Search error message**
   - Google the exact error
   - Check Stack Overflow
   - Check project GitHub issues

4. **Isolate the issue**
   - Is it frontend or backend?
   - Is it API or local code?
   - Is it config or code?

5. **Test in isolation**
   ```bash
   # Test backend API directly
   curl http://localhost:8000/api/analyze-text \
     -H "Content-Type: application/json" \
     -d '{"text": "test"}'

   # Test frontend without API
   # Mock the API response
   ```

6. **Check recent changes**
   - What changed before error?
   - Revert to last working version
   - Use git bisect to find issue

7. **Enable debug mode**
   ```python
   # Backend
   logging.basicConfig(level=logging.DEBUG)

   # Frontend
   localStorage.setItem('DEBUG', 'true')
   ```

8. **Ask for help**
   - Share complete error message
   - Share code context
   - Share exact steps to reproduce
   - Share environment info

---

## Support Resources

1. **Documentation**
   - README.md - Project overview
   - API.md - API documentation
   - DEVELOPMENT.md - Developer guide

2. **External Resources**
   - [FastAPI Docs](https://fastapi.tiangolo.com/)
   - [React Docs](https://react.dev/)
   - [Gemini API Docs](https://ai.google.dev/)
   - [Tailwind CSS](https://tailwindcss.com/)

3. **Community**
   - Stack Overflow
   - Reddit (r/reactjs, r/FastAPI)
   - GitHub Discussions
   - Discord communities

4. **Official Support**
   - Google Cloud Console
   - Platform-specific support (Heroku, AWS, etc.)

---

## Creating a Minimal Reproducible Example

When reporting issues, provide:

```bash
# Backend minimal example
# 1. Create minimal main.py
# 2. Run: python main.py
# 3. Test: curl http://localhost:8000/health
# 4. Share error message

# Frontend minimal example
# 1. Create minimal App.jsx
# 2. Run: npm run dev
# 3. Open: http://localhost:3000
# 4. Share browser console error
```

---

## Debugging Checklist

- [ ] Read error message carefully
- [ ] Check all log files
- [ ] Verify environment variables set
- [ ] Test component in isolation
- [ ] Check network requests (DevTools)
- [ ] Try in different browser
- [ ] Clear cache and restart
- [ ] Check API rate limits
- [ ] Verify file paths
- [ ] Check file permissions
- [ ] Try on different machine
- [ ] Create minimal reproducible example

---

For additional help, refer to README.md or API.md documentation files.
