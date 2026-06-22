# HateGuard AI - Docker Compose Development

## Quick Start with Docker

### Prerequisites
- Docker
- Docker Compose
- Gemini API Key

### Setup

1. **Create .env file**
```bash
echo "GEMINI_API_KEY=your_key_here" > .env
```

2. **Build and start containers**
```bash
docker-compose up --build
```

3. **Access the application**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Health check: http://localhost:8000/health

### Development Mode

The docker-compose file includes hot-reload for development:
- Backend: Changes trigger server reload
- Frontend: Changes trigger rebuild

### Production Build

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Run containers
docker-compose -f docker-compose.prod.yml up
```

### Common Commands

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Remove volumes (clean slate)
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Execute command in container
docker-compose exec backend python main.py

# Scale services (if needed)
docker-compose up -d --scale backend=2
```

### Troubleshooting

**Port already in use**
```bash
# Check running processes
netstat -lntp | grep :3000  # macOS/Linux
netstat -ano | findstr :3000 # Windows

# Change port in docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 instead
```

**API connection failed**
```bash
# Check service is running
docker-compose ps

# Check logs
docker-compose logs backend
docker-compose logs frontend

# Restart service
docker-compose restart backend
```

**GEMINI_API_KEY not set**
```bash
# Create .env file
echo "GEMINI_API_KEY=your_actual_key" > .env

# Restart containers
docker-compose down
docker-compose up
```

### Environment Variables

Create `.env` file in project root:
```
GEMINI_API_KEY=your_key_from_aistudio.google.com
```

### Networking

Services communicate via service names:
- Backend container: `http://backend:8000`
- Frontend can reach backend at this URL

### Volumes (Development)

The docker-compose mounts source code for hot-reload:
```yaml
volumes:
  - ./backend:/app  # Backend code changes trigger reload
```

### Health Checks

Both services have health checks:
```bash
# Check status
docker-compose ps

# Manual health check
curl http://localhost:8000/health
curl http://localhost:3000
```

### Performance

For production:
- Use docker-compose.prod.yml (multi-stage builds)
- Enable Docker compose V2 for faster builds
- Use .dockerignore to exclude unnecessary files

### Database (Future)

To add PostgreSQL:
```yaml
db:
  image: postgres:15
  environment:
    POSTGRES_PASSWORD: password
  volumes:
    - db_data:/var/lib/postgresql/data

volumes:
  db_data:
```
