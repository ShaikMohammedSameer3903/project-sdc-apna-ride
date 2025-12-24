# 🚀 ApnaRide - Deploy Now Guide

## ✅ Pre-Deployment Checklist

Your project is **DEPLOYMENT READY**! All configurations are in place.

### Docker Files Status:
- ✅ `apnaride-frontend/Dockerfile` - Multi-stage build with Nginx
- ✅ `Back End/Dockerfile` - Multi-stage build with Maven
- ✅ `docker-compose.yml` - Development environment
- ✅ `docker-compose.prod.yml` - Production environment
- ✅ `apnaride-frontend/nginx.conf` - Nginx configuration
- ✅ `Jenkinsfile` - CI/CD pipeline

## 🐳 Quick Deploy with Docker

### Option 1: Local Deployment (Development)

```bash
# Navigate to project root
cd d:\apnaride

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**Access your app:**
- Frontend: http://localhost:80
- Backend API: http://localhost:9031
- MySQL: localhost:3306

### Option 2: Production Deployment

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Check health
docker-compose -f docker-compose.prod.yml ps
```

### Stop Services

```bash
# Development
docker-compose down

# Production
docker-compose -f docker-compose.prod.yml down

# Remove volumes (clean database)
docker-compose down -v
```

## 🔧 Environment Variables

Create `.env` file in project root:

```env
# Database
DB_NAME=apnaride
DB_USERNAME=root
DB_PASSWORD=shaik
DB_HOST=mysql
DB_PORT=3306

# Backend
SERVER_PORT=9031
SPRING_PROFILES_ACTIVE=prod
JPA_DDL_AUTO=update
JPA_SHOW_SQL=false

# Frontend
VITE_API_BASE_URL=http://localhost:9031
VITE_WS_BASE_URL=ws://localhost:9031

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:80,http://localhost:5173
```

## 🏗️ Jenkins CI/CD Pipeline

### Setup Jenkins

1. **Install Jenkins**:
```bash
docker run -d -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  --name jenkins jenkins/jenkins:lts
```

2. **Access Jenkins**: http://localhost:8080

3. **Install Required Plugins**:
   - Docker Pipeline
   - NodeJS
   - Maven Integration
   - SonarQube Scanner (optional)

4. **Configure Tools** (Manage Jenkins → Global Tool Configuration):
   - Maven: `Maven-3.9`
   - NodeJS: `NodeJS-20`
   - Docker: Install automatically

5. **Add Credentials**:
   - Docker Hub: ID = `dockerhub-credentials`
   - Email: For notifications

### Create Jenkins Pipeline

1. New Item → Pipeline
2. Pipeline → Definition: Pipeline script from SCM
3. SCM: Git
4. Repository URL: Your Git repo
5. Script Path: `Jenkinsfile`
6. Save & Build

### Pipeline Stages:

```
✓ Checkout code
✓ Environment setup
✓ Backend build & test
✓ Frontend build & test
✓ Code quality analysis (SonarQube)
✓ Build Docker images
✓ Security scan
✓ Push to registry
✓ Deploy (dev/staging/prod)
✓ Health check
```

## ☁️ Cloud Deployment Options

### Option 1: AWS (Recommended)

**Using AWS ECS:**

```bash
# Install AWS CLI
aws configure

# Create ECR repositories
aws ecr create-repository --repository-name apnaride/backend
aws ecr create-repository --repository-name apnaride/frontend

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag images
docker tag apnaride/backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/apnaride/backend:latest
docker tag apnaride/frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/apnaride/frontend:latest

# Push images
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/apnaride/backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/apnaride/frontend:latest

# Deploy to ECS (use AWS Console or CLI)
```

### Option 2: Heroku

**Backend:**
```bash
cd "Back End"
heroku create apnaride-backend
heroku addons:create jawsdb:kitefin
git push heroku main
```

**Frontend:**
```bash
cd apnaride-frontend
npm run build
# Deploy dist/ to Netlify or Vercel
```

### Option 3: DigitalOcean

```bash
# Create Droplet
# SSH into server
ssh root@your-server-ip

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone repository
git clone <your-repo-url>
cd apnaride

# Run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Option 4: Google Cloud Run

```bash
# Install gcloud CLI
gcloud init

# Build and push
gcloud builds submit --tag gcr.io/PROJECT-ID/apnaride-backend ./Back\ End
gcloud builds submit --tag gcr.io/PROJECT-ID/apnaride-frontend ./apnaride-frontend

# Deploy
gcloud run deploy apnaride-backend --image gcr.io/PROJECT-ID/apnaride-backend --platform managed
gcloud run deploy apnaride-frontend --image gcr.io/PROJECT-ID/apnaride-frontend --platform managed
```

## 🔒 Production Checklist

Before deploying to production:

### Security:
- [ ] Change default passwords
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set secure environment variables
- [ ] Enable rate limiting
- [ ] Add authentication tokens

### Database:
- [ ] Set up database backups
- [ ] Configure connection pooling
- [ ] Enable SSL for database connections
- [ ] Set proper user permissions

### Monitoring:
- [ ] Set up application monitoring (New Relic, Datadog)
- [ ] Configure log aggregation (ELK stack)
- [ ] Set up alerts for errors
- [ ] Monitor resource usage

### Performance:
- [ ] Enable CDN for static assets
- [ ] Configure caching headers
- [ ] Optimize images
- [ ] Enable Gzip compression
- [ ] Set up load balancer

## 📊 Health Checks

### Backend Health:
```bash
curl http://localhost:9031/actuator/health
```

Expected response:
```json
{
  "status": "UP"
}
```

### Frontend Health:
```bash
curl http://localhost:80
```

Should return HTML content.

### Database Health:
```bash
docker exec apnaride-mysql mysqladmin ping -h localhost -u root -pshaik
```

## 🐛 Troubleshooting

### Issue: Containers not starting

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql

# Restart services
docker-compose restart
```

### Issue: Database connection failed

```bash
# Check MySQL is running
docker-compose ps mysql

# Check database exists
docker exec -it apnaride-mysql mysql -u root -pshaik -e "SHOW DATABASES;"

# Recreate database
docker-compose down -v
docker-compose up -d
```

### Issue: Port already in use

```bash
# Find process using port
netstat -ano | findstr :9031
netstat -ano | findstr :80

# Kill process
taskkill /PID <process-id> /F

# Or change ports in docker-compose.yml
```

### Issue: Build fails

```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check Dockerfile syntax
docker build -t test ./Back\ End
```

## 📈 Scaling

### Horizontal Scaling:

```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 3
      
  frontend:
    deploy:
      replicas: 2
```

### Load Balancer:

```nginx
upstream backend {
    server backend1:9031;
    server backend2:9031;
    server backend3:9031;
}
```

## 🎯 Quick Deploy Commands

### Development:
```bash
docker-compose up -d && docker-compose logs -f
```

### Production:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Update & Redeploy:
```bash
git pull
docker-compose down
docker-compose build
docker-compose up -d
```

### Backup Database:
```bash
docker exec apnaride-mysql mysqldump -u root -pshaik apnaride > backup.sql
```

### Restore Database:
```bash
docker exec -i apnaride-mysql mysql -u root -pshaik apnaride < backup.sql
```

## ✅ Your App is Ready!

**Everything is configured and ready to deploy:**

1. ✅ Docker multi-stage builds optimized
2. ✅ Nginx configured with security headers
3. ✅ Health checks enabled
4. ✅ Non-root users for security
5. ✅ Jenkins pipeline ready
6. ✅ Environment variables configured
7. ✅ Database with persistent volumes
8. ✅ Network isolation
9. ✅ Auto-restart policies
10. ✅ Production-ready compose file

## 🚀 Deploy Now!

```bash
# Just run this command:
cd d:\apnaride
docker-compose up -d

# Wait 30 seconds for services to start
# Then open: http://localhost:80
```

**Your ApnaRide app is live!** 🎉

---

**Need help?** Check logs with: `docker-compose logs -f`
