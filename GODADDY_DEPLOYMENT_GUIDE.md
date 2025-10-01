# GoDaddy Shared Hosting Deployment Guide

This guide covers deploying your Go My Page application to GoDaddy shared hosting using FTP.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Step-by-Step Deployment](#step-by-step-deployment)
- [Post-Deployment Configuration](#post-deployment-configuration)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

## Prerequisites

### GoDaddy Account Requirements
- Active GoDaddy shared hosting account
- FTP access enabled
- Domain configured and pointing to hosting
- Sufficient disk space (minimum 500MB recommended)

### Required Information
1. **FTP Host**: Usually `ftp.yourdomain.com` or your server IP
2. **FTP Username**: Your FTP account username
3. **FTP Password**: Your FTP account password
4. **FTP Port**: Default is 21 (use 22 for SFTP if available)
5. **Deployment Path**: Usually `/public_html` or `/htdocs`
6. **Domain Name**: Your website domain (e.g., yourdomain.com)

## Finding Your FTP Credentials

### Method 1: Via GoDaddy Dashboard
1. Log in to your GoDaddy account at https://godaddy.com
2. Navigate to **My Products**
3. Find your hosting account and click **Manage**
4. Click **cPanel** (or direct hosting management)
5. Look for **FTP Accounts** under the Files section
6. View or create an FTP account
7. Note the FTP server/host, username, and password

### Method 2: Via cPanel Directly
1. Access your cPanel (usually at yourdomain.com/cpanel)
2. Go to **Files** → **FTP Accounts**
3. Create a new FTP account or view existing ones
4. Copy the FTP server address and credentials

## Step-by-Step Deployment

### 1. Configure FTP Settings in Admin Panel

1. Navigate to **Admin** → **GoDaddy Deployment** in your Go My Page admin panel
2. Click **Settings** button
3. Fill in your FTP credentials:
   - **FTP Host**: Your FTP server address
   - **FTP Port**: Usually 21
   - **FTP Username**: Your FTP account username
   - **FTP Password**: Your FTP password
   - **Deployment Path**: `/public_html` (or your web root)
   - **Domain**: Your website domain
4. Click **Save Settings**

### 2. Create New Deployment

1. Go back to **GoDaddy Deployment** page
2. Enter a **Deployment Name** (e.g., "Production v1.0")
3. Review your configuration in the summary box
4. Click **Deploy to GoDaddy**

### 3. Monitor Deployment Progress

The system will automatically:
1. Build your application for production
2. Optimize all assets (CSS, JS, images)
3. Create necessary configuration files (.htaccess)
4. Connect to your FTP server
5. Upload all files to your hosting
6. Set proper file permissions
7. Verify the deployment

### 4. Deployment Completion

Once completed, you'll receive:
- Deployment success confirmation
- Direct link to your live site
- Deployment log with detailed steps
- Next steps checklist

## Post-Deployment Configuration

### Configure .htaccess for React Router

The deployment automatically creates a `.htaccess` file with the following content:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

This ensures all routes work correctly with React Router.

### SSL/HTTPS Configuration

1. Log in to your GoDaddy cPanel
2. Navigate to **Security** → **SSL/TLS Status**
3. Enable **AutoSSL** or install a certificate
4. Force HTTPS by adding to `.htaccess`:

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### File Permissions

Ensure proper permissions are set:
- **Files**: 644 (rw-r--r--)
- **Directories**: 755 (rwxr-xr-x)
- **Executable scripts**: 755 (rwxr-xr-x)

The deployment system automatically sets these for you.

### Environment Variables (if needed)

If your application uses environment variables:
1. Create a `.env` file in your deployment path
2. Add required variables
3. Ensure it's not publicly accessible

## Monitoring and Maintenance

### Check Deployment Logs

1. Go to **Admin** → **GoDaddy Deployment**
2. View **Deployment History**
3. Click the eye icon to view detailed logs

### Update Deployed Application

1. Make changes to your application
2. Create a new deployment with an updated name
3. The system will replace files on your hosting

### Rollback if Needed

To rollback to a previous version:
1. Keep backups of your application versions
2. Create a new deployment with the backup version
3. Or manually upload files via FTP

## Troubleshooting

### Common Issues and Solutions

#### 1. FTP Connection Failed
**Problem**: Cannot connect to FTP server

**Solutions**:
- Verify FTP host is correct (usually `ftp.yourdomain.com`)
- Check if FTP port is 21 (or 22 for SFTP)
- Ensure FTP username and password are correct
- Check if your IP is not blocked by GoDaddy firewall
- Try using passive FTP mode

#### 2. Permission Denied Errors
**Problem**: Cannot write to deployment directory

**Solutions**:
- Verify deployment path exists (`/public_html`)
- Check FTP account has write permissions
- Ensure sufficient disk space available
- Contact GoDaddy support to verify account permissions

#### 3. 404 Errors on Routes
**Problem**: Routes other than home show 404

**Solutions**:
- Verify `.htaccess` file was uploaded
- Check Apache mod_rewrite is enabled on hosting
- Ensure `.htaccess` is in the web root directory
- Contact GoDaddy support to enable mod_rewrite

#### 4. Blank White Page
**Problem**: Website shows blank page

**Solutions**:
- Check browser console for errors
- Verify all files were uploaded successfully
- Check if JavaScript is enabled
- Review deployment logs for errors
- Ensure API URLs are correct for production

#### 5. SSL Certificate Issues
**Problem**: HTTPS not working

**Solutions**:
- Enable AutoSSL in cPanel
- Wait 24-48 hours for SSL propagation
- Manually install SSL certificate
- Contact GoDaddy support for SSL assistance

#### 6. Slow Loading Times
**Problem**: Website loads slowly

**Solutions**:
- Enable caching in `.htaccess`
- Optimize images before deployment
- Use CDN for static assets
- Check GoDaddy hosting plan limits
- Consider upgrading to better hosting plan

### Getting Help

#### Check Logs
1. Deployment logs in admin panel
2. Browser console (F12) for client errors
3. cPanel error logs for server errors

#### GoDaddy Support
- **Phone Support**: Available on GoDaddy dashboard
- **Live Chat**: 24/7 support
- **Email Support**: Via your account
- **Knowledge Base**: help.godaddy.com

#### Application Support
- Review deployment logs
- Check configuration settings
- Verify FTP credentials
- Test with a subdomain first

## Security Best Practices

### FTP Security
1. **Use Strong Passwords**: Minimum 16 characters with mixed case, numbers, symbols
2. **Create Dedicated FTP Account**: Don't use main cPanel account
3. **Limit FTP Access**: Restrict to specific directories
4. **Change Password Regularly**: Update every 3-6 months
5. **Use SFTP if Available**: Port 22 instead of FTP port 21

### Application Security
1. **Enable SSL/HTTPS**: Force all traffic to HTTPS
2. **Hide Sensitive Files**: Use .htaccess to protect files
3. **Regular Updates**: Keep application dependencies updated
4. **Backup Regularly**: Schedule automatic backups
5. **Monitor Access**: Review logs for suspicious activity

### GoDaddy Account Security
1. **Enable Two-Factor Authentication**: On your GoDaddy account
2. **Use Strong Account Password**: Different from FTP password
3. **Limit Account Access**: Only give access when needed
4. **Monitor Login Activity**: Check for unauthorized access
5. **Keep Recovery Info Updated**: Email and phone number

## Performance Optimization

### Caching Configuration

Add to `.htaccess` for browser caching:

```apache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
  ExpiresByType application/pdf "access plus 1 month"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
```

### Compression

Enable Gzip compression in `.htaccess`:

```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE text/javascript
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

## Scaling Considerations

### When to Upgrade Hosting

Consider upgrading if you experience:
- Slow loading times consistently
- Frequent downtime or timeouts
- Disk space limitations
- Bandwidth limitations
- High traffic volumes

### Upgrade Options
1. **Better Shared Hosting Plan**: More resources
2. **VPS Hosting**: Dedicated resources
3. **Dedicated Server**: Full control
4. **Cloud Hosting**: Scalable infrastructure

## Checklist

### Pre-Deployment
- [ ] GoDaddy hosting account active
- [ ] FTP credentials obtained and verified
- [ ] Domain configured and propagated
- [ ] Sufficient disk space available
- [ ] Application tested locally

### Deployment
- [ ] FTP settings configured in admin panel
- [ ] Deployment name entered
- [ ] Configuration reviewed
- [ ] Deployment initiated
- [ ] Deployment completed successfully

### Post-Deployment
- [ ] Website accessible at domain
- [ ] All routes working correctly
- [ ] SSL/HTTPS enabled and working
- [ ] Images and assets loading
- [ ] Forms and interactive elements functional
- [ ] Mobile responsiveness verified
- [ ] Browser console error-free
- [ ] Performance optimized

### Security
- [ ] SSL certificate installed
- [ ] HTTPS forced
- [ ] FTP credentials secured
- [ ] Two-factor authentication enabled
- [ ] Backup system configured
- [ ] File permissions set correctly

## Success Metrics

After deployment, verify:
- **Uptime**: 99.9% availability
- **Load Time**: Under 3 seconds
- **SSL Score**: A+ on SSL Labs
- **Mobile Speed**: Good on PageSpeed Insights
- **Accessibility**: No major errors

## Additional Resources

### Documentation
- [GoDaddy cPanel Guide](https://www.godaddy.com/help/cpanel)
- [FTP Setup Guide](https://www.godaddy.com/help/set-up-ftp-access)
- [SSL Installation](https://www.godaddy.com/help/install-ssl-certificate)

### Tools
- [FileZilla FTP Client](https://filezilla-project.org/)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)
- [Google PageSpeed Insights](https://pagespeed.web.dev/)

### Support Channels
- **GoDaddy Support**: 24/7 phone and chat
- **Community Forums**: community.godaddy.com
- **Video Tutorials**: youtube.com/godaddy

## Conclusion

Deploying to GoDaddy shared hosting is straightforward with the automated deployment system. Follow this guide for a smooth deployment experience. For production use with high traffic, consider upgrading to VPS or cloud hosting for better performance and scalability.

For additional help or custom deployment requirements, contact support or review the deployment logs for detailed information.
