import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, FileText, CheckCircle, AlertCircle, Rocket, Upload, Settings, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const SOPTab = () => {
  return (
    <div className="space-y-6">
      {/* Important Notice */}
      <Card className="border-orange-500/50 bg-orange-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            Important: Manual Deployment Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            This deployment system <strong>tracks and guides</strong> your manual deployment process. 
            It does NOT automatically upload files to GoDaddy. You must manually build your application 
            and upload files via FTP client (like FileZilla) or cPanel File Manager.
          </p>
          <div className="bg-background/50 p-3 rounded-lg space-y-2">
            <p className="text-sm font-semibold">Why Manual?</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Build artifacts are not accessible from edge functions</li>
              <li>FTP operations require local file system access</li>
              <li>Ensures you have full control over deployment</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Prerequisites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Prerequisites
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">Active GoDaddy shared hosting account</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">Domain configured and pointing to hosting</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">FTP credentials (host, username, password)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">FTP client installed (FileZilla recommended)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">Node.js and npm/yarn installed locally</span>
          </div>
        </CardContent>
      </Card>

      {/* Step 1 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Step 1: Obtain GoDaddy FTP Credentials
            <Badge variant="outline">~5-10 minutes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Sub-steps:
              </p>
              <ol className="text-sm space-y-1.5 ml-6 list-decimal">
                <li>Login to GoDaddy account at godaddy.com</li>
                <li>Navigate to "My Products" → Find hosting plan → Click "Manage"</li>
                <li>Click "cPanel Admin" button</li>
                <li>In cPanel, scroll to "Files" → Click "FTP Accounts"</li>
                <li>Create new FTP account OR use existing main account</li>
                <li>Note down: FTP Server (ftp.yourdomain.com), Username, Password, Port (21)</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Step 2: Configure FTP Settings
            <Badge variant="outline">~2-3 minutes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Sub-steps:
              </p>
              <ol className="text-sm space-y-1.5 ml-6 list-decimal">
                <li>Click on "Configuration" tab above</li>
                <li>Enter your FTP Host (e.g., ftp.yourdomain.com)</li>
                <li>Enter FTP Username and Password</li>
                <li>Set FTP Port (usually 21 for FTP, 22 for SFTP)</li>
                <li>Specify Deployment Path (e.g., /public_html or /public_html/yourdomain.com)</li>
                <li>Enter your Domain Name</li>
                <li>Click "Save FTP Configuration"</li>
                <li>Verify green success message appears</li>
                <li><strong className="text-orange-600">Note: Settings are saved for tracking only</strong></li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 3 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Step 3: Build Application Locally
            <Badge variant="outline">~2-5 minutes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Sub-steps:
              </p>
              <ol className="text-sm space-y-1.5 ml-6 list-decimal">
                <li>Open terminal in your project directory</li>
                <li>Run: <code className="bg-muted px-2 py-1 rounded">npm run build</code> or <code className="bg-muted px-2 py-1 rounded">yarn build</code></li>
                <li>Wait for build to complete</li>
                <li>Verify <code className="bg-muted px-2 py-1 rounded">dist</code> folder is created</li>
                <li>Check that dist folder contains: index.html, assets/, etc.</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 4 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Step 4: Upload Files via FTP
            <Badge variant="outline">~5-15 minutes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Option A: Using FTP Client (Recommended)
              </p>
              <ol className="text-sm space-y-1.5 ml-6 list-decimal">
                <li>Download FileZilla or another FTP client</li>
                <li>Open FTP client and enter your credentials</li>
                <li>Connect to your GoDaddy server</li>
                <li>Navigate to deployment path (e.g., /public_html)</li>
                <li>Delete old files if updating</li>
                <li>Upload ALL files from your <code className="bg-muted px-2 py-1 rounded">dist</code> folder</li>
                <li>Ensure .htaccess file is uploaded (create if missing)</li>
                <li>Wait for all files to transfer (check progress)</li>
              </ol>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Option B: Using cPanel File Manager
              </p>
              <ol className="text-sm space-y-1.5 ml-6 list-decimal">
                <li>Log into your GoDaddy cPanel</li>
                <li>Open File Manager</li>
                <li>Navigate to public_html or your deployment folder</li>
                <li>Delete old files if updating</li>
                <li>Click Upload button</li>
                <li>Select all files from your dist folder</li>
                <li>Wait for upload to complete</li>
                <li>Verify all files are present</li>
              </ol>
            </div>

            <div className="bg-muted p-3 rounded-lg space-y-2">
              <p className="text-sm font-semibold">Required .htaccess file:</p>
              <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>`}
              </pre>
              <p className="text-xs text-muted-foreground">Create this file if it doesn't exist in your dist folder</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 5 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Step 5: Record Deployment
            <Badge variant="outline">~1 minute</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Sub-steps:
              </p>
              <ol className="text-sm space-y-1.5 ml-6 list-decimal">
                <li>After successful upload, return to this dashboard</li>
                <li>Click on "Deployment" tab</li>
                <li>Enter deployment name (e.g., "Production v1.0.0")</li>
                <li>Click "Record Deployment" to track this deployment</li>
                <li>View your deployment history</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 6 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Step 6: Verify Deployment
            <Badge variant="outline">~3-5 minutes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Sub-steps:
              </p>
              <ol className="text-sm space-y-1.5 ml-6 list-decimal">
                <li>Click on "Status Check" tab</li>
                <li>Click "Check Website Status" button</li>
                <li>Verify website is accessible (200 status)</li>
                <li>Open your domain in a browser</li>
                <li>Test navigation and all routes</li>
                <li>Check browser console for errors (F12)</li>
                <li>Note: Initial propagation may take 5-10 minutes</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 7 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Step 7: Post-Deployment Setup
            <Badge variant="outline">~5-10 minutes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Sub-steps:
              </p>
              <ol className="text-sm space-y-1.5 ml-6 list-decimal">
                <li>Enable SSL/HTTPS in GoDaddy cPanel (SSL/TLS Status)</li>
                <li>Run AutoSSL for free SSL certificate</li>
                <li>Verify https:// works (padlock icon in browser)</li>
                <li>Set file permissions (644 for files, 755 for folders)</li>
                <li>Clear browser cache and test again</li>
                <li>Test on different devices and browsers</li>
                <li>Set up regular backup schedule</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-blue-500/50 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <FileText className="h-5 w-5" />
            Pro Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="text-sm space-y-2 list-disc list-inside">
            <li>Always test locally before deploying</li>
            <li>Keep backups before updating existing deployment</li>
            <li>Use meaningful deployment names with version numbers</li>
            <li>Document any environment-specific configurations</li>
            <li>Monitor the first 24 hours after deployment closely</li>
            <li>Use SFTP (port 22) instead of FTP when available for better security</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};