import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const SOPTab = () => {
  return (
    <div className="space-y-6">
      {/* Prerequisites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Prerequisites
          </CardTitle>
          <CardDescription>
            Ensure you have these items ready before starting deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Active GoDaddy shared hosting account</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Domain name configured and pointing to hosting</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">FTP credentials (host, username, password)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">cPanel access for FTP account management</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Sufficient disk space (minimum 50MB recommended)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SOP Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Deployment Process - Step by Step
          </CardTitle>
          <CardDescription>
            Follow each step in order for successful deployment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1 */}
          <div className="space-y-3 pb-6 border-b">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-lg">Obtain GoDaddy FTP Credentials</h4>
                  <Badge variant="outline">5-10 minutes</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Get your FTP access details from GoDaddy cPanel
                </p>
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">1.1. Login to GoDaddy</p>
                    <p className="text-xs text-muted-foreground">• Navigate to godaddy.com and sign in to your account</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">1.2. Access Your Hosting</p>
                    <p className="text-xs text-muted-foreground">• Go to "My Products" → Find your hosting plan → Click "Manage"</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">1.3. Open cPanel</p>
                    <p className="text-xs text-muted-foreground">• Click "cPanel Admin" button to open control panel</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">1.4. Navigate to FTP Accounts</p>
                    <p className="text-xs text-muted-foreground">• In cPanel, scroll to "Files" section → Click "FTP Accounts"</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">1.5. Create or View FTP Account</p>
                    <p className="text-xs text-muted-foreground">• Create new FTP account OR use existing main account</p>
                    <p className="text-xs text-muted-foreground">• Note down: FTP Server/Host, Username, Password, Port (usually 21)</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">1.6. Verify FTP Server Address</p>
                    <p className="text-xs text-muted-foreground">• Format is usually: ftp.yourdomain.com or your server IP address</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-3 pb-6 border-b">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-lg">Configure FTP Settings in System</h4>
                  <Badge variant="outline">2-3 minutes</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Enter your FTP credentials in the Configuration tab
                </p>
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">2.1. Switch to Configuration Tab</p>
                    <p className="text-xs text-muted-foreground">• Click "Configuration" tab at the top of this page</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">2.2. Enter FTP Host</p>
                    <p className="text-xs text-muted-foreground">• Example: ftp.yourdomain.com</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">2.3. Enter FTP Port</p>
                    <p className="text-xs text-muted-foreground">• Default is 21 (use 22 for SFTP if supported)</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">2.4. Enter FTP Username</p>
                    <p className="text-xs text-muted-foreground">• Usually: username@yourdomain.com or just username</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">2.5. Enter FTP Password</p>
                    <p className="text-xs text-muted-foreground">• Use the password you set in cPanel FTP Accounts</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">2.6. Set Deployment Path</p>
                    <p className="text-xs text-muted-foreground">• For main domain: /public_html</p>
                    <p className="text-xs text-muted-foreground">• For subdomain: /public_html/subdomain</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">2.7. Enter Domain Name</p>
                    <p className="text-xs text-muted-foreground">• Example: yourdomain.com (without https://)</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">2.8. Save Configuration</p>
                    <p className="text-xs text-muted-foreground">• Click "Save Configuration" button</p>
                    <p className="text-xs text-muted-foreground">• Wait for success message</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-3 pb-6 border-b">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                3
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-lg">Start Deployment</h4>
                  <Badge variant="outline">5-15 minutes</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Initiate the deployment process to GoDaddy hosting
                </p>
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">3.1. Navigate to Deployment Tab</p>
                    <p className="text-xs text-muted-foreground">• Click "Deployment" tab at the top</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">3.2. Enter Deployment Name</p>
                    <p className="text-xs text-muted-foreground">• Example: "Production v1.0" or "Initial Deployment"</p>
                    <p className="text-xs text-muted-foreground">• This helps track different deployments</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">3.3. Review Deployment Target</p>
                    <p className="text-xs text-muted-foreground">• Verify FTP host, path, and domain are correct</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">3.4. Click Deploy Button</p>
                    <p className="text-xs text-muted-foreground">• Click "Deploy to GoDaddy" button</p>
                    <p className="text-xs text-muted-foreground">• System will start building your application</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">3.5. Wait for Build Process</p>
                    <p className="text-xs text-muted-foreground">• Application will be compiled for production</p>
                    <p className="text-xs text-muted-foreground">• Assets will be optimized and minified</p>
                    <p className="text-xs text-muted-foreground">• This may take 3-5 minutes</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">3.6. Monitor FTP Upload</p>
                    <p className="text-xs text-muted-foreground">• Files will be uploaded to your hosting via FTP</p>
                    <p className="text-xs text-muted-foreground">• Upload time depends on file size and connection speed</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">3.7. .htaccess Configuration</p>
                    <p className="text-xs text-muted-foreground">• System automatically creates .htaccess file</p>
                    <p className="text-xs text-muted-foreground">• Enables client-side routing for React app</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">3.8. Wait for Completion</p>
                    <p className="text-xs text-muted-foreground">• Watch for success or error messages</p>
                    <p className="text-xs text-muted-foreground">• Check deployment history for status</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="space-y-3 pb-6 border-b">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                4
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-lg">Verify Deployment</h4>
                  <Badge variant="outline">5-10 minutes</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Check if deployment was successful and application is working
                </p>
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">4.1. Check Deployment Status</p>
                    <p className="text-xs text-muted-foreground">• Go to "Status Check" tab</p>
                    <p className="text-xs text-muted-foreground">• Look for green success indicator</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">4.2. Test Website Access</p>
                    <p className="text-xs text-muted-foreground">• Click "Check Website" button in Status Check tab</p>
                    <p className="text-xs text-muted-foreground">• Or open your domain in a new browser tab</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">4.3. Verify Homepage Loads</p>
                    <p className="text-xs text-muted-foreground">• Ensure homepage displays correctly</p>
                    <p className="text-xs text-muted-foreground">• Check for any missing images or styles</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">4.4. Test Navigation</p>
                    <p className="text-xs text-muted-foreground">• Click through different pages/routes</p>
                    <p className="text-xs text-muted-foreground">• Verify all links work correctly</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">4.5. Check Browser Console</p>
                    <p className="text-xs text-muted-foreground">• Press F12 to open developer tools</p>
                    <p className="text-xs text-muted-foreground">• Look for any error messages in Console tab</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">4.6. Test on Mobile Devices</p>
                    <p className="text-xs text-muted-foreground">• Open website on phone/tablet</p>
                    <p className="text-xs text-muted-foreground">• Verify responsive design works</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">4.7. Check SSL Certificate</p>
                    <p className="text-xs text-muted-foreground">• Ensure https:// works (padlock icon in browser)</p>
                    <p className="text-xs text-muted-foreground">• If not, enable SSL in GoDaddy cPanel</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                5
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-lg">Post-Deployment Setup</h4>
                  <Badge variant="outline">Optional</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Additional configurations for optimal performance
                </p>
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">5.1. Enable SSL/HTTPS</p>
                    <p className="text-xs text-muted-foreground">• In GoDaddy cPanel, go to SSL/TLS Status</p>
                    <p className="text-xs text-muted-foreground">• Run AutoSSL to enable free SSL certificate</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">5.2. Set Up Email Accounts</p>
                    <p className="text-xs text-muted-foreground">• Create professional email addresses for your domain</p>
                    <p className="text-xs text-muted-foreground">• Configure in cPanel → Email Accounts</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">5.3. Configure Backup Schedule</p>
                    <p className="text-xs text-muted-foreground">• Keep regular backups of deployment history</p>
                    <p className="text-xs text-muted-foreground">• Download FTP backup periodically</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">5.4. Monitor Website Performance</p>
                    <p className="text-xs text-muted-foreground">• Use Status Check tab regularly</p>
                    <p className="text-xs text-muted-foreground">• Set up Google Analytics if needed</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">5.5. Document Deployment</p>
                    <p className="text-xs text-muted-foreground">• Save deployment credentials securely</p>
                    <p className="text-xs text-muted-foreground">• Note any custom configurations made</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements & Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Requirements & Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Requirements:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>GoDaddy shared hosting account with FTP access</li>
              <li>FTP credentials (host, username, password)</li>
              <li>Domain configured and pointing to your hosting</li>
              <li>Sufficient disk space for application files</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Best Practices:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Test deployments on a subdomain first</li>
              <li>Ensure SSL/HTTPS is enabled in your GoDaddy cPanel</li>
              <li>The .htaccess file enables client-side routing</li>
              <li>Keep backup of FTP credentials secure</li>
              <li>Monitor deployment logs for any errors</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Troubleshooting:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>If deployment fails, check FTP credentials</li>
              <li>Verify deployment path exists on server</li>
              <li>Ensure proper file permissions (644 for files, 755 for directories)</li>
              <li>Check if domain DNS is properly configured</li>
              <li>Contact GoDaddy support for hosting-specific issues</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
