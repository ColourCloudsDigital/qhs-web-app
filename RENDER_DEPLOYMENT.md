# Deploying to Render.com

This guide walks you through deploying your Qaras Hotel Management System to Render using Docker.

## Prerequisites

- GitHub account with your code pushed to a repository
- Render.com account (free tier available)
- Your remote MySQL database at 176.74.18.130 (already configured)

## Step-by-Step Deployment

### 1. Push Your Code to GitHub

If you haven't already, initialize git and push to GitHub:

```bash
git init
git add .
git commit -m "Optimized Docker build for Render deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Create a New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your repository from the list

### 3. Configure the Service

Render will detect your `render.yaml` file. Configure these settings:

**Basic Settings:**
- **Name**: `qaras-hotels` (or your preferred name)
- **Region**: Choose closest to your users (Oregon, Frankfurt, Singapore, etc.)
- **Branch**: `main`
- **Environment**: `Docker`
- **Dockerfile Path**: `./Dockerfile`
- **Docker Context**: `.`

**Instance Type:**
- **Free**: For testing (sleeps after inactivity)
- **Starter ($7/month)**: Recommended for production
- **Standard**: For higher traffic

### 4. Set Environment Variables

In the Render dashboard, add these environment variables:

**Required Variables:**

```
NODE_ENV=production
NEXTAUTH_URL=https://your-app-name.onrender.com
NEXTAUTH_SECRET=<generate-a-secure-random-string>
DATABASE_HOST=176.74.18.130
DATABASE_PORT=3306
DATABASE_USER=your_database_user
DATABASE_PASSWORD=your_database_password
DATABASE_NAME=qaras_hotel
DATABASE_URL=mysql://your_user:your_password@176.74.18.130:3306/qaras_hotel
NEXT_PUBLIC_APP_URL=https://your-app-name.onrender.com
NEXT_PUBLIC_API_URL=https://your-app-name.onrender.com/api
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**Optional Variables (if needed):**

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@yourdomain.com
PAYSTACK_SECRET_KEY=sk_live_your_key
PAYSTACK_PUBLIC_KEY=pk_live_your_key
FLUTTERWAVE_SECRET_KEY=FLWSECK-your_key
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your_key
```

### 5. Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Build the Docker image using your optimized Dockerfile
   - Deploy the container
   - Assign a URL: `https://your-app-name.onrender.com`

**Build time**: 5-10 minutes for first deployment

### 6. Monitor Deployment

Watch the build logs in real-time:
- Green checkmarks = success
- Red X = error (check logs for details)

Common build stages:
```
✓ Cloning repository
✓ Building Docker image
  - Installing dependencies
  - Building Next.js application
  - Creating standalone output
✓ Deploying container
✓ Health check passed
```

### 7. Verify Deployment

Once deployed, test your application:

1. **Health Check**:
   ```bash
   curl https://your-app-name.onrender.com/api/health
   ```
   Expected: `{"status":"ok","timestamp":"..."}`

2. **Open in Browser**:
   Visit `https://your-app-name.onrender.com`

3. **Check Logs**:
   - Go to Render Dashboard → Your Service → Logs
   - Look for: `✓ Ready in XXXms`

## Automatic Deployments

With `autoDeploy: true` in `render.yaml`, Render automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Render will detect the push and redeploy automatically.

## Custom Domain (Optional)

### Add Your Domain

1. Go to your service → **Settings** → **Custom Domains**
2. Click **"Add Custom Domain"**
3. Enter your domain: `app.yourdomain.com`
4. Add these DNS records at your domain provider:

**For subdomain (app.yourdomain.com):**
```
Type: CNAME
Name: app
Value: your-app-name.onrender.com
```

**For root domain (yourdomain.com):**
```
Type: A
Name: @
Value: [Render's IP - shown in dashboard]
```

5. Update environment variables:
```
NEXTAUTH_URL=https://app.yourdomain.com
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
NEXT_PUBLIC_API_URL=https://app.yourdomain.com/api
```

6. Render automatically provisions SSL certificate (Let's Encrypt)

## Database Considerations

You're using an external MySQL database at `176.74.18.130`. Ensure:

1. **Firewall Rules**: Allow Render's IP addresses
   - Render uses dynamic IPs, consider using IP whitelist or VPN
   - Or allow all IPs if database has strong authentication

2. **Connection Pooling**: Already configured in your app

3. **Backups**: Set up regular backups of your MySQL database

## Scaling

### Vertical Scaling (Upgrade Instance)
- Free → Starter: More memory, no sleep
- Starter → Standard: 2GB RAM, better performance
- Standard → Pro: 4GB+ RAM, dedicated resources

### Horizontal Scaling (Multiple Instances)
Available on Standard plan and above:
1. Go to Settings → Scaling
2. Increase instance count
3. Render automatically load balances

## Monitoring

### View Logs
```bash
# Real-time logs in dashboard
Dashboard → Your Service → Logs

# Or use Render CLI
render logs -f
```

### Metrics
Dashboard shows:
- CPU usage
- Memory usage
- Request count
- Response times
- Error rates

### Alerts
Set up alerts for:
- Service down
- High error rate
- Memory/CPU limits

## Troubleshooting

### Build Fails

**Check Dockerfile syntax:**
```bash
docker build -t test .
```

**Common issues:**
- Missing dependencies in package.json
- Build errors in Next.js
- Environment variables not set

### Application Won't Start

**Check logs for:**
- Database connection errors
- Missing environment variables
- Port binding issues

**Verify environment variables:**
```bash
# In Render dashboard, check all required vars are set
```

### Database Connection Issues

**Test connection:**
```bash
# From your local machine
mysql -h 176.74.18.130 -u your_user -p qaras_hotel
```

**Check:**
- Firewall allows Render IPs
- Credentials are correct
- Database is running

### Health Check Failing

Render checks `/api/health` endpoint. Ensure:
- Route exists and returns 200 status
- Database connection is working
- No startup errors

### Slow Performance

**Free tier limitations:**
- Sleeps after 15 minutes of inactivity
- Takes 30-60 seconds to wake up
- Upgrade to Starter for always-on

**Optimization:**
- Enable caching
- Optimize database queries
- Use CDN for static assets

## Cost Optimization

### Free Tier
- Good for testing
- Sleeps after inactivity
- 750 hours/month free

### Starter ($7/month)
- Always on
- 512MB RAM
- Recommended for production

### Tips to Reduce Costs
1. Use free tier for staging
2. Optimize Docker image (already done - 476MB)
3. Use external database (already doing)
4. Enable caching
5. Optimize build times

## CI/CD Pipeline

Your setup already includes auto-deploy. For more control:

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run tests
        run: npm test
      
      - name: Trigger Render Deploy
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

Add deploy hook in Render: Settings → Deploy Hook

## Backup Strategy

### Application Code
- Already in GitHub ✓

### Database
Set up automated backups:

```bash
# Daily backup script
mysqldump -h 176.74.18.130 -u user -p qaras_hotel > backup_$(date +%Y%m%d).sql

# Upload to cloud storage
aws s3 cp backup_$(date +%Y%m%d).sql s3://your-bucket/backups/
```

### Environment Variables
- Document in secure location (1Password, etc.)
- Never commit to git

## Security Checklist

- [x] HTTPS enabled (automatic with Render)
- [x] Strong NEXTAUTH_SECRET
- [x] Database credentials secured
- [ ] Firewall rules configured
- [ ] Regular security updates
- [ ] Error tracking (Sentry, etc.)
- [ ] Rate limiting configured
- [ ] CORS properly configured

## Support Resources

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Status Page**: https://status.render.com
- **Support**: support@render.com

## Quick Reference

### Useful Commands

```bash
# View logs
render logs -f

# Restart service
render restart

# Deploy manually
git push origin main

# Check service status
render services list
```

### Important URLs

- Dashboard: https://dashboard.render.com
- Your App: https://your-app-name.onrender.com
- Health Check: https://your-app-name.onrender.com/api/health
- Logs: Dashboard → Service → Logs

## Next Steps

After successful deployment:

1. ✓ Test all features
2. ✓ Set up monitoring
3. ✓ Configure custom domain
4. ✓ Set up automated backups
5. ✓ Configure error tracking
6. ✓ Load test your application
7. ✓ Document deployment process
8. ✓ Train team on Render dashboard

---

**Your optimized Docker image (476MB) is perfect for Render deployment!**
