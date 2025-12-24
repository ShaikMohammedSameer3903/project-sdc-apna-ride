# 🔧 Git Setup & Push to Main Branch

## ✅ Jenkins Updated
Your Jenkinsfile now supports **both `main` and `master`** branches for deployment.

## 🚀 Quick Git Setup

### Step 1: Initialize Git (if not already done)
```bash
cd d:\apnaride
git init
```

### Step 2: Rename Branch to Main
```bash
git branch -M main
```

### Step 3: Add All Files
```bash
git add .
```

### Step 4: Commit Changes
```bash
git commit -m "Initial commit - ApnaRide complete with all features"
```

### Step 5: Add Remote Repository
```bash
# Replace with your repository URL
git remote add origin https://github.com/yourusername/apnaride.git

# Or if using SSH
git remote add origin git@github.com:yourusername/apnaride.git
```

### Step 6: Push to Main
```bash
git push -u origin main
```

## 📝 Create .gitignore

Create a `.gitignore` file in the root:

```gitignore
# Node modules
apnaride-frontend/node_modules/
apnaride-frontend/dist/
apnaride-frontend/.env
apnaride-frontend/.env.local

# Backend
Back End/target/
Back End/.env
Back End/.mvn/wrapper/maven-wrapper.jar

# IDE
.idea/
.vscode/
*.iml
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Database
*.sql
*.db

# Docker
.docker/

# Temporary files
*.tmp
*.bak
```

## 🔐 GitHub Repository Setup

### Option 1: Create New Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `apnaride`
3. Description: `Uber-like ride-sharing application with real-time features`
4. Public or Private: Choose based on your needs
5. **Don't** initialize with README (you already have one)
6. Click "Create repository"

### Option 2: Use Existing Repository

If you already have a repository:
```bash
git remote set-url origin https://github.com/yourusername/apnaride.git
```

## 📦 Complete Git Workflow

### First Time Setup:
```bash
cd d:\apnaride

# Initialize
git init
git branch -M main

# Add files
git add .

# Commit
git commit -m "feat: Complete ApnaRide application with all features

- Customer dashboard with route display and nearby drivers
- Driver dashboard with auto-decline removal
- Rating system with animated stars
- 5-minute auto-cancel for unaccepted rides
- Smooth driver location animations
- Enhanced CartoDB maps
- Complete customer and driver profiles
- Docker and Jenkins CI/CD ready"

# Add remote
git remote add origin YOUR_REPO_URL

# Push
git push -u origin main
```

### Daily Workflow:
```bash
# Pull latest changes
git pull origin main

# Make changes...

# Stage changes
git add .

# Commit with message
git commit -m "feat: your feature description"

# Push to main
git push origin main
```

## 🏷️ Git Branching Strategy

### For Team Development:

```bash
# Create feature branch
git checkout -b feature/new-feature

# Work on feature...
git add .
git commit -m "feat: add new feature"

# Push feature branch
git push origin feature/new-feature

# Create Pull Request on GitHub
# After review, merge to main
```

### Branch Types:
- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

## 🔄 Jenkins Integration

Once you push to GitHub, Jenkins will automatically:

1. ✅ Checkout code from `main` branch
2. ✅ Build backend and frontend
3. ✅ Run tests
4. ✅ Build Docker images
5. ✅ Push to Docker registry
6. ✅ Deploy to production (with approval)

### Jenkins Webhook Setup:

1. Go to your GitHub repository
2. Settings → Webhooks → Add webhook
3. Payload URL: `http://your-jenkins-url/github-webhook/`
4. Content type: `application/json`
5. Events: `Just the push event`
6. Save

## 📊 Git Commands Reference

### Check Status:
```bash
git status
```

### View Commit History:
```bash
git log --oneline
```

### Undo Last Commit (keep changes):
```bash
git reset --soft HEAD~1
```

### Discard Local Changes:
```bash
git checkout -- .
```

### Create Tag for Release:
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### View Remote URL:
```bash
git remote -v
```

## 🎯 Ready to Push!

Your project is ready. Just run:

```bash
cd d:\apnaride
git add .
git commit -m "Complete ApnaRide application"
git push -u origin main
```

## ✅ What Happens After Push

1. **Jenkins Pipeline Triggers** (if configured)
   - Builds your code
   - Runs tests
   - Creates Docker images
   - Deploys to production

2. **GitHub Actions** (optional - create `.github/workflows/deploy.yml`)
   - Alternative to Jenkins
   - Can deploy to cloud platforms

3. **Docker Hub** (if Jenkins configured)
   - Images pushed automatically
   - Tagged with build number

## 🆘 Common Issues

### Issue: Permission Denied
```bash
# Use SSH instead of HTTPS
git remote set-url origin git@github.com:username/apnaride.git
```

### Issue: Large Files
```bash
# Use Git LFS for large files
git lfs install
git lfs track "*.jar"
git lfs track "*.war"
```

### Issue: Merge Conflicts
```bash
# Pull with rebase
git pull --rebase origin main

# Resolve conflicts in files
# Then:
git add .
git rebase --continue
```

## 🎉 You're All Set!

Your ApnaRide project is ready to be pushed to GitHub and deployed via Jenkins!

**Next Steps:**
1. Create GitHub repository
2. Push code: `git push -u origin main`
3. Configure Jenkins webhook
4. Watch automatic deployment! 🚀
