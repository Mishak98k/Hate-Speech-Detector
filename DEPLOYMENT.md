# Deployment Guide

## Deployment Options

Choose the deployment platform that best suits your needs:

1. **Heroku** - Easiest for beginners
2. **Vercel** - Best for frontend, simple deployment
3. **AWS** - Most scalable and customizable
4. **DigitalOcean** - Good balance of simplicity and control
5. **Render** - Modern, similar to Heroku
6. **Railway** - Beginner-friendly with GitHub integration
7. **Docker** - Self-hosted on any VPS

---

## 1. Heroku Deployment (Recommended for Beginners)

### Prerequisites
- Heroku account (free tier available)
- Heroku CLI installed
- Git

### Deploy Backend

```bash
# Navigate to backend directory
cd backend

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create Heroku app
heroku create hateguard-api

# Set environment variable
heroku config:set GEMINI_API_KEY=your_key_here

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Deploy Frontend

```bash
# Navigate to frontend directory
cd frontend

# Build production
npm run build

# Create netlify.toml or use Vercel instead (see below)
```

### Update Frontend Environment

```bash
# Update .env for production
REACT_APP_API_URL=https://hateguard-api.herokuapp.com
```

---

## 2. Vercel Deployment (Best for Frontend)

### Deploy Frontend with Vercel

```bash
# Navigate to frontend
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Link to existing project or create new one
# Follow prompts to connect Git repository

# Set environment variables in Vercel dashboard
# REACT_APP_API_URL=https://your-backend-url
```

### Benefits
- Automatic deployments on git push
- Preview URLs for branches
- Serverless functions (if needed)
- Free SSL/TLS

---

## 3. AWS Deployment (Most Scalable)

### Using AWS Elastic Container Service (ECS)

#### Prerequisites
- AWS Account
- AWS CLI configured
- Docker images pushed to ECR (Elastic Container Registry)

```bash
# Create ECR repository for backend
aws ecr create-repository --repository-name hateguard-backend

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend image
cd backend
docker build -t hateguard-backend .
docker tag hateguard-backend:latest \
  ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/hateguard-backend:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/hateguard-backend:latest

# Repeat for frontend
cd frontend
docker build -t hateguard-frontend .
docker tag hateguard-frontend:latest \
  ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/hateguard-frontend:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/hateguard-frontend:latest
```

#### Create ECS Tasks

1. Go to AWS ECS Console
2. Create cluster: `hateguard-cluster`
3. Create task definitions for backend and frontend
4. Create services
5. Configure load balancer (ALB)
6. Set up auto-scaling

---

## 4. DigitalOcean Deployment

### Using DigitalOcean App Platform

```bash
# Install doctl CLI
brew install doctl  # macOS
# or download from https://github.com/digitalocean/doctl/releases

# Authenticate
doctl auth init

# Deploy with app spec
doctl apps create --spec app.yaml
```

### app.yaml
```yaml
name: hateguard-ai
services:
  - name: backend
    source:
      type: github
      repo: your-username/hateguard-ai
      branch: main
    github_repo: your-username/hateguard-ai
    http_port: 8000
    build_command: pip install -r requirements.txt
    run_command: gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
    environment_slug: python
    envs:
      - key: GEMINI_API_KEY
        type: SECRET
        value: ${GEMINI_API_KEY}

  - name: frontend
    source:
      type: github
      repo: your-username/hateguard-ai
      branch: main
    github_repo: your-username/hateguard-ai
    http_port: 3000
    build_command: npm ci && npm run build
    run_command: npm install -g serve && serve -s dist -l 3000
    environment_slug: node-js
    envs:
      - key: REACT_APP_API_URL
        type: RUNTIME
        value: ${BACKEND_URL}
```

---

## 5. Render Deployment

### Backend Deployment

1. Go to [render.com](https://render.com)
2. Click "New +"
3. Select "Web Service"
4. Connect GitHub repository
5. Configure:
   - **Name**: hateguard-backend
   - **Root Directory**: backend
   - **Runtime**: Python 3.11
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app`
   - Add environment variable: `GEMINI_API_KEY`
6. Deploy

### Frontend Deployment

1. Click "New +"
2. Select "Static Site"
3. Connect GitHub repository
4. Configure:
   - **Name**: hateguard-frontend
   - **Root Directory**: frontend
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: dist
   - Add environment: `REACT_APP_API_URL=https://hateguard-backend.onrender.com`
5. Deploy

---

## 6. Self-Hosted on VPS (DigitalOcean, Linode, AWS EC2)

### Server Setup (Ubuntu 22.04)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
git clone https://github.com/your-username/hateguard-ai.git
cd hateguard-ai

# Create .env file
echo "GEMINI_API_KEY=your_key_here" > .env

# Start with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose ps
```

### Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install nginx -y

# Create config
sudo tee /etc/nginx/sites-available/hateguard > /dev/null <<EOF
upstream backend {
    server localhost:8000;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host \$host;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/hateguard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

## 7. Railway Deployment

### Deploy with Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create project
railway init

# Configure services in railway.json
# Add backend and frontend services

# Deploy
railway up
```

---

## 8. Environment Variables for Production

### Backend
```env
GEMINI_API_KEY=your_production_key
# Optional:
LOG_LEVEL=info
WORKERS=4
```

### Frontend
```env
REACT_APP_API_URL=https://api.your-domain.com
REACT_APP_ENV=production
```

---

## 9. Production Checklist

- [ ] **Security**
  - [ ] API key stored securely (env vars, not in code)
  - [ ] CORS configured to specific domains
  - [ ] HTTPS enabled
  - [ ] Rate limiting configured
  - [ ] Input validation enabled

- [ ] **Performance**
  - [ ] Database indexes created
  - [ ] Caching enabled (Redis if applicable)
  - [ ] CDN configured for static assets
  - [ ] Gzip compression enabled
  - [ ] Image optimization enabled

- [ ] **Monitoring**
  - [ ] Error tracking (Sentry)
  - [ ] Application monitoring (DataDog, New Relic)
  - [ ] Uptime monitoring
  - [ ] Log aggregation
  - [ ] Alert system configured

- [ ] **Backup & Recovery**
  - [ ] Database backups automated
  - [ ] Disaster recovery plan
  - [ ] Testing recovery procedures

- [ ] **Compliance**
  - [ ] Privacy policy updated
  - [ ] Terms of service
  - [ ] GDPR compliance (if EU users)
  - [ ] Data retention policies

---

## 10. Monitoring & Scaling

### Scaling Strategies

**Vertical Scaling** (Increase resource per server)
- Upgrade VPS tier
- Add more memory/CPU

**Horizontal Scaling** (Add more servers)
- Load balancer (nginx, AWS ELB)
- Multiple backend instances
- Container orchestration (Kubernetes)

### Monitoring Tools

**Error Tracking**
```bash
pip install sentry-sdk
```

**Performance Monitoring**
- DataDog
- New Relic
- Prometheus + Grafana

**Log Aggregation**
- ELK Stack
- Datadog
- CloudWatch

---

## 11. Troubleshooting Deployment

**"Gemini API Key not found"**
- Verify environment variable is set
- Restart application after setting env var

**"502 Bad Gateway"**
- Check backend is running
- Verify API health endpoint
- Check logs for errors

**"CORS errors"**
- Update CORS settings to match frontend domain
- Ensure backend is running

**"Out of memory"**
- Upgrade server tier
- Implement caching
- Use connection pooling

---

## 12. Cost Estimation

**Free Tier Options**
- Heroku: 550 hours/month free
- Vercel: Free for frontend
- Railway: $5/month credits
- DigitalOcean App Platform: Free tier available

**Typical Monthly Costs (Production)**
- Gemini API: ~$1-5 (free tier unlimited for development)
- VPS (DigitalOcean): $5-20/month
- Database: $15-50/month (if added)
- CDN: $0-10/month
- Total: ~$20-85/month

---

## 13. Continuous Deployment

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: heroku/deploy-github-actions@v3
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: "hateguard-api"
          heroku_email: ${{ secrets.HEROKU_EMAIL }}
```

---

## Next Steps

1. Choose deployment platform
2. Create accounts and set up credentials
3. Follow platform-specific guide above
4. Test application thoroughly
5. Set up monitoring and alerts
6. Configure backups and recovery
7. Document deployment process
8. Create runbooks for common issues

---

## Support

For deployment issues:
1. Check platform documentation
2. Review application logs
3. Verify environment variables
4. Check API quotas and rate limits
5. Contact platform support if needed
