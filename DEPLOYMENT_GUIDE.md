# 🚀 AWS EC2 Deployment Guide

## Prerequisites

### 1. AWS Account Setup
- Create AWS account at https://aws.amazon.com/
- Set up billing alerts
- Create IAM user with EC2 permissions

### 2. Generate AWS Credentials
1. Go to AWS Console → IAM
2. Create new user with `AmazonEC2FullAccess` policy
3. Generate Access Key ID and Secret Access Key
4. Save credentials securely (never commit to git)

### 3. EC2 Configuration Recommendations

#### For Production (1M Users Target)

**Instance Type**: `t3.large` or `t3.xlarge`
- vCPUs: 2-4
- Memory: 8-16 GB
- Network: Moderate to High

**Storage**: 
- 50 GB SSD (gp3)
- Enable snapshots for backups

**Security Group**:
```
Inbound Rules:
- HTTP (80) from 0.0.0.0/0
- HTTPS (443) from 0.0.0.0/0
- SSH (22) from YOUR_IP only

Outbound Rules:
- All traffic
```

---

## Step-by-Step Deployment

### Step 1: Configure AWS in Admin Panel

1. Login as Admin
2. Navigate to **Admin → AWS Deployment**
3. Click **"Configure AWS Settings"**
4. Enter:
   - **AWS Access Key ID**: Your IAM access key
   - **AWS Secret Access Key**: Your IAM secret key
   - **Default Region**: `us-east-1` (or closest to users)
   - **Instance Type**: `t3.large`
   - **AMI ID**: Use Ubuntu 22.04 LTS (auto-detected)
5. Click **"Save AWS Configuration"**

### Step 2: Create New Deployment

1. In AWS Deployment page, go to **"Deployments"** tab
2. Click **"Create New Deployment"**
3. Configure:
   - **Deployment Name**: `production-v1`
   - **Region**: Select your region
   - **Enable Auto-Deploy**: Optional (for CI/CD)
4. Click **"Deploy to EC2"**

### Step 3: Monitor Deployment

Watch the real-time deployment log:
```
✓ Creating EC2 instance...
✓ Instance created: i-1234567890abcdef0
✓ Waiting for instance to be running...
✓ Installing Node.js and dependencies...
✓ Building React application...
✓ Starting application server...
✓ Deployment completed successfully!
```

**Deployment typically takes 5-10 minutes**

### Step 4: Configure DNS

1. Note the **EC2 Public IP** from deployment log
2. Go to your domain registrar (GoDaddy, Namecheap, etc.)
3. Create/Update A record:
   ```
   Type: A
   Name: @ (or www)
   Value: [Your EC2 Public IP]
   TTL: 3600
   ```
4. Wait for DNS propagation (up to 48 hours)

### Step 5: SSL Certificate Setup

#### Option A: Let's Encrypt (Free)

SSH into your EC2 instance:
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

#### Option B: AWS Certificate Manager (ACM)

1. Go to AWS Console → Certificate Manager
2. Request public certificate for your domain
3. Verify domain ownership (email or DNS)
4. Attach certificate to Load Balancer

---

## Post-Deployment Configuration

### 1. Environment Variables

SSH into EC2 and set environment variables:

```bash
# Edit environment file
sudo nano /etc/environment

# Add these variables
SUPABASE_URL=https://kovlbxzqasqhigygfiyj.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
NODE_ENV=production
```

### 2. PM2 Process Manager (Recommended)

Install PM2 to keep app running:

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "author-platform" -- start

# Save PM2 config
pm2 save

# Set PM2 to start on boot
pm2 startup
```

### 3. Nginx Reverse Proxy

Configure Nginx for better performance:

```nginx
# /etc/nginx/sites-available/default

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Firewall Setup

```bash
# Allow HTTP, HTTPS, SSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22

# Enable firewall
sudo ufw enable
```

---

## Monitoring & Maintenance

### CloudWatch Setup (AWS Native)

1. Go to AWS Console → CloudWatch
2. Create Dashboard for your instance
3. Add metrics:
   - CPU Utilization (Alert if > 80%)
   - Memory Usage (Alert if > 80%)
   - Network In/Out
   - Disk I/O

4. Create Alarms:
   ```
   CPU > 80% for 5 minutes → Email alert
   Status Check Failed → Email + SMS
   ```

### Application Logs

```bash
# View PM2 logs
pm2 logs

# View Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# View system logs
journalctl -u nginx -f
```

### Backup Strategy

1. **Database**: Supabase handles automated backups
2. **EC2 Snapshots**: 
   - Go to EC2 → Volumes → Actions → Create Snapshot
   - Schedule daily snapshots via Lambda
3. **Code**: Keep git repository updated

---

## Scaling for 1M Users

### Vertical Scaling (Quick Win)

Upgrade instance size:
```
t3.large → t3.xlarge → t3.2xlarge
```

### Horizontal Scaling (Production Ready)

1. **Load Balancer**:
   - Create Application Load Balancer
   - Distribute traffic across multiple EC2 instances

2. **Auto Scaling Group**:
   - Min: 2 instances
   - Desired: 3 instances
   - Max: 10 instances
   - Scale trigger: CPU > 70%

3. **CDN (CloudFront)**:
   - Distribute static assets globally
   - Reduce latency for international users

4. **Database**:
   - Supabase scales automatically
   - Consider read replicas if needed

---

## Troubleshooting

### Deployment Failed

**Check deployment logs in Admin Panel**

Common issues:
- ❌ Invalid AWS credentials → Verify IAM permissions
- ❌ Instance launch failed → Check AWS service limits
- ❌ Security group not configured → Add inbound rules

### Application Not Accessible

1. **Check EC2 Status**:
   ```bash
   ssh to instance
   pm2 status
   ```

2. **Check Nginx**:
   ```bash
   sudo systemctl status nginx
   sudo nginx -t  # Test configuration
   ```

3. **Check Firewall**:
   ```bash
   sudo ufw status
   ```

### High CPU Usage

1. **Check processes**:
   ```bash
   top
   htop  # if installed
   ```

2. **Restart application**:
   ```bash
   pm2 restart all
   ```

3. **Scale up instance** if consistently high

### Database Connection Issues

1. Check Supabase status: https://status.supabase.com
2. Verify connection string in environment
3. Check network connectivity from EC2

---

## Security Best Practices

### 1. SSH Key Management
- Use SSH keys (never passwords)
- Rotate keys every 90 days
- Restrict SSH to specific IPs

### 2. Regular Updates
```bash
# Update system packages weekly
sudo apt update && sudo apt upgrade -y

# Update Node.js modules monthly
npm update
```

### 3. Security Monitoring
- Enable AWS GuardDuty
- Set up CloudTrail for audit logs
- Regular security scans with AWS Inspector

### 4. Secrets Management
- Never commit credentials to git
- Use AWS Secrets Manager
- Rotate credentials regularly

---

## Cost Optimization

### Estimated Monthly Costs (1M Users)

```
t3.xlarge instance (24/7):     ~$120
Load Balancer:                 ~$20
Data Transfer (500GB):         ~$45
CloudFront CDN:                ~$30
EC2 Snapshots (daily):         ~$10
-----------------------------------
Total:                         ~$225/month
```

### Cost-Saving Tips
- Use Reserved Instances (save 30-60%)
- Enable auto-scaling (scale down at night)
- Use CloudFront to reduce data transfer
- Regular cleanup of old snapshots
- Monitor with Cost Explorer

---

## Rollback Plan

If deployment fails or issues arise:

1. **Quick Rollback**:
   ```bash
   # In Admin Panel → AWS Deployment
   # Click "Rollback to Previous Version"
   ```

2. **Manual Rollback**:
   ```bash
   # SSH to instance
   cd /var/www/app
   git checkout previous-version
   pm2 restart all
   ```

3. **Full Restore**:
   - Stop current instance
   - Launch new instance from previous snapshot
   - Update DNS to new instance IP

---

## Support Resources

- **AWS Support**: https://console.aws.amazon.com/support
- **Supabase Docs**: https://supabase.com/docs
- **Community**: Discord, Stack Overflow

---

## Success Metrics

Track these after deployment:

- ✅ Uptime > 99.9%
- ✅ Page load time < 2 seconds
- ✅ Error rate < 0.1%
- ✅ API response time < 200ms
- ✅ Zero security incidents

---

*Happy Deploying! 🚀*
