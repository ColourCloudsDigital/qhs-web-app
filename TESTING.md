# Testing Your Docker Deployment

After running `docker-compose up -d`, follow these steps to verify everything is working correctly.

## Step 1: Check Container Status

```bash
docker-compose ps
```

Expected output - both services should show "Up" status:
```
NAME                IMAGE               STATUS              PORTS
qaras-app           qaras-hotel:latest  Up (healthy)        0.0.0.0:3000->3000/tcp
qaras-mysql         mysql:8.0           Up (healthy)        0.0.0.0:3306->3306/tcp
```

## Step 2: Check Container Logs

### View Application Logs
```bash
docker-compose logs -f app
```

Look for:
- ✓ Server started successfully
- ✓ Listening on port 3000
- ✓ No database connection errors

Press `Ctrl+C` to exit log view.

### View Database Logs
```bash
docker-compose logs db
```

Look for:
- ✓ MySQL initialization complete
- ✓ Ready for connections

## Step 3: Test Health Check Endpoint

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Or open in browser: http://localhost:3000/api/health

## Step 4: Test Database Connection

```bash
docker-compose exec db mysql -u qaras_user -p qaras_hotel -e "SHOW TABLES;"
```

Enter the password from your `.env` file when prompted.

Expected: List of database tables should appear.

## Step 5: Access the Application

Open your browser and navigate to:

**Main Application:**
```
http://localhost:3000
```

**Login Page:**
```
http://localhost:3000/login
```

**Admin Dashboard:**
```
http://localhost:3000/admin/dashboard
```

## Step 6: Test Key Features

### 1. Homepage
- [ ] Homepage loads without errors
- [ ] Images and styles load correctly
- [ ] Navigation menu works

### 2. Authentication
- [ ] Login page loads
- [ ] Registration page loads
- [ ] Can create a test account

### 3. Database Connectivity
- [ ] Can view hotels list
- [ ] Can view rooms
- [ ] Data loads from database

### 4. API Endpoints
Test various API endpoints:

```bash
# Test public settings
curl http://localhost:3000/api/public/settings

# Test hotels endpoint (may require auth)
curl http://localhost:3000/api/hotels
```

## Step 7: Monitor Resource Usage

```bash
docker stats qaras-app qaras-mysql
```

Check:
- CPU usage (should be reasonable)
- Memory usage (app ~500MB-1GB, db ~200-500MB)
- Network I/O

Press `Ctrl+C` to exit.

## Step 8: Check for Errors

### Application Errors
```bash
docker-compose logs app | grep -i error
```

### Database Errors
```bash
docker-compose logs db | grep -i error
```

## Common Issues and Solutions

### Issue: Containers Not Starting

**Check logs:**
```bash
docker-compose logs
```

**Restart services:**
```bash
docker-compose restart
```

### Issue: Database Connection Failed

**Verify database is ready:**
```bash
docker-compose exec db mysqladmin ping -h localhost -u root -p
```

**Check database credentials in .env file**

**Restart application:**
```bash
docker-compose restart app
```

### Issue: Port Already in Use

**Check what's using port 3000:**
```bash
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000
```

**Change port in docker-compose.yml:**
```yaml
ports:
  - "8080:3000"  # Use port 8080 instead
```

### Issue: Application Shows 502/503 Error

**Wait for health check:**
The application may take 30-60 seconds to fully start. Check:
```bash
docker-compose logs -f app
```

**Verify health status:**
```bash
curl http://localhost:3000/api/health
```

### Issue: Database Not Initialized

**Check if schema was imported:**
```bash
docker-compose exec db mysql -u qaras_user -p qaras_hotel -e "SHOW TABLES;"
```

**Manually import schema if needed:**
```bash
docker-compose exec -i db mysql -u qaras_user -p qaras_hotel < qaras_combined.sql
```

## Performance Testing

### Load Testing with Apache Bench
```bash
# Install Apache Bench (ab)
# Windows: Download from Apache website
# Linux: sudo apt-get install apache2-utils
# Mac: brew install apache2

# Test with 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:3000/
```

### Response Time Testing
```bash
curl -w "@-" -o /dev/null -s http://localhost:3000/ <<'EOF'
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
   time_pretransfer:  %{time_pretransfer}\n
      time_redirect:  %{time_redirect}\n
 time_starttransfer:  %{time_starttransfer}\n
                    ----------\n
         time_total:  %{time_total}\n
EOF
```

## Stopping and Cleaning Up

### Stop Services (Keep Data)
```bash
docker-compose stop
```

### Stop and Remove Containers (Keep Data)
```bash
docker-compose down
```

### Stop and Remove Everything (Including Data)
```bash
docker-compose down -v
```

### Remove Images
```bash
docker rmi qaras-hotel:latest
```

## Quick Test Script

Create a file `test-deployment.sh`:

```bash
#!/bin/bash

echo "🔍 Testing Qaras Hotel Deployment..."
echo ""

# Check if containers are running
echo "1. Checking container status..."
docker-compose ps
echo ""

# Check health endpoint
echo "2. Testing health endpoint..."
curl -s http://localhost:3000/api/health | jq '.' || echo "Health check failed"
echo ""

# Check database connection
echo "3. Testing database connection..."
docker-compose exec -T db mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} 2>/dev/null && echo "✓ Database is responding" || echo "✗ Database connection failed"
echo ""

# Check application logs for errors
echo "4. Checking for errors in logs..."
ERROR_COUNT=$(docker-compose logs app | grep -i error | wc -l)
echo "Found $ERROR_COUNT error messages in logs"
echo ""

# Test homepage
echo "5. Testing homepage..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Homepage is accessible (HTTP $HTTP_CODE)"
else
    echo "✗ Homepage returned HTTP $HTTP_CODE"
fi
echo ""

echo "✅ Testing complete!"
```

Make it executable and run:
```bash
chmod +x test-deployment.sh
./test-deployment.sh
```

## Monitoring Dashboard

For continuous monitoring, you can add monitoring tools to your docker-compose.yml:

```yaml
# Add to docker-compose.yml
  portainer:
    image: portainer/portainer-ce:latest
    container_name: portainer
    restart: unless-stopped
    ports:
      - "9000:9000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data

volumes:
  portainer_data:
```

Then access Portainer at: http://localhost:9000

## Next Steps

Once testing is successful:

1. ✅ Configure your domain name
2. ✅ Set up SSL/TLS certificates
3. ✅ Configure production environment variables
4. ✅ Set up automated backups
5. ✅ Configure monitoring and alerts
6. ✅ Test payment gateway integration
7. ✅ Test email functionality
8. ✅ Perform security audit
9. ✅ Load testing with expected traffic
10. ✅ Document any custom configurations

## Support

If you encounter issues:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables: `docker-compose config`
3. Check container health: `docker-compose ps`
4. Review DEPLOYMENT.md for troubleshooting tips
