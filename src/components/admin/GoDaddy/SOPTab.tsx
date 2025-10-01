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
            Step 3: Download Your Built Application
            <Badge variant="outline">~2-10 minutes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-blue-600">Option A: Download from Lovable (Recommended for this portal)</p>
              <ol className="text-sm space-y-1.5 ml-6 list-decimal">
                <li>Click the <strong>Publish</strong> button in the top-right corner of Lovable</li>
                <li>Wait for the build to complete (usually 1-3 minutes)</li>
                <li>Once published, go to <strong>Project Settings</strong> → <strong>Download</strong></li>
                <li>Click <strong>"Download production build"</strong></li>
                <li>Save the <code className="bg-muted px-2 py-1 rounded">production-build.zip</code> file to your computer</li>
                <li>Extract the ZIP file - this creates a folder with all your website files</li>
                <li>Open the extracted folder to see: index.html, assets/, etc.</li>
              </ol>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-3">
              <p className="text-sm font-semibold">Option B: Build Locally (If you have source code)</p>
              <ol className="text-sm space-y-1.5 ml-6 list-decimal">
                <li>Download your project source code from Lovable</li>
                <li>Open terminal in your project directory</li>
                <li>Run: <code className="bg-muted px-2 py-1 rounded">npm install</code> (first time only)</li>
                <li>Run: <code className="bg-muted px-2 py-1 rounded">npm run build</code></li>
                <li>Wait for build to complete (1-3 minutes)</li>
                <li>Find the <code className="bg-muted px-2 py-1 rounded">dist</code> folder in your project</li>
                <li>This dist folder contains all files to upload</li>
              </ol>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-sm font-semibold text-green-600 mb-2">✓ What you should have:</p>
              <ul className="text-xs space-y-1 ml-4 list-disc">
                <li>A folder containing: <code className="bg-background px-1">index.html</code></li>
                <li>An <code className="bg-background px-1">assets/</code> folder with JS, CSS files</li>
                <li>Possibly: images, favicon.ico, robots.txt</li>
                <li>Total size: usually 500KB - 5MB</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 4 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Step 4: Upload Files to GoDaddy
            <Badge variant="outline">~5-20 minutes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {/* Option A: FileZilla */}
            <div className="border border-blue-500/30 rounded-lg p-4 space-y-3">
              <p className="text-sm font-bold text-blue-600">🔥 Option A: Using FileZilla FTP Client (Recommended)</p>
              
              <div className="space-y-2">
                <p className="text-xs font-semibold bg-blue-500/10 p-2 rounded">Step 4.1: Download & Install FileZilla</p>
                <ol className="text-xs space-y-1 ml-4 list-[lower-alpha]">
                  <li>Go to <a href="https://filezilla-project.org/download.php" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">filezilla-project.org</a></li>
                  <li>Download FileZilla Client (free version)</li>
                  <li>Install and open FileZilla</li>
                </ol>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold bg-blue-500/10 p-2 rounded">Step 4.2: Connect to GoDaddy</p>
                <ol className="text-xs space-y-1 ml-4 list-[lower-alpha]">
                  <li>At the top, enter your FTP credentials:
                    <div className="ml-4 mt-1 space-y-0.5 text-[11px]">
                      <div>• Host: <code className="bg-muted px-1">ftp.yourdomain.com</code></div>
                      <div>• Username: <code className="bg-muted px-1">your-ftp-username</code></div>
                      <div>• Password: <code className="bg-muted px-1">your-ftp-password</code></div>
                      <div>• Port: <code className="bg-muted px-1">21</code></div>
                    </div>
                  </li>
                  <li>Click "Quickconnect" button</li>
                  <li>Wait for "Directory listing successful" message</li>
                </ol>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold bg-blue-500/10 p-2 rounded">Step 4.3: Navigate to Upload Folder</p>
                <ol className="text-xs space-y-1 ml-4 list-[lower-alpha]">
                  <li>In the <strong>right panel</strong> (Remote site), look for folders</li>
                  <li>Double-click <code className="bg-muted px-1">public_html</code> folder</li>
                  <li>If you see old files (index.html, etc.), select all and right-click → Delete</li>
                  <li>Confirm deletion (creates clean slate)</li>
                </ol>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold bg-blue-500/10 p-2 rounded">Step 4.4: Prepare Local Files</p>
                <ol className="text-xs space-y-1 ml-4 list-[lower-alpha]">
                  <li>In the <strong>left panel</strong> (Local site), navigate to your extracted folder or dist folder</li>
                  <li>You should see: index.html, assets/, favicon.ico, etc.</li>
                  <li>Select ALL files and folders in this directory (Ctrl+A or Cmd+A)</li>
                </ol>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold bg-blue-500/10 p-2 rounded">Step 4.5: Upload Files</p>
                <ol className="text-xs space-y-1 ml-4 list-[lower-alpha]">
                  <li>Drag selected files from left panel to right panel</li>
                  <li>OR right-click selected files → Upload</li>
                  <li>Watch the "Queued files" at the bottom - this shows upload progress</li>
                  <li>Wait for ALL files to transfer (can take 5-15 minutes depending on size and internet speed)</li>
                  <li>When done, the queue should be empty and status shows "0 Bytes in queue"</li>
                </ol>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold bg-green-500/20 p-2 rounded">Step 4.6: Verify Upload</p>
                <ol className="text-xs space-y-1 ml-4 list-[lower-alpha]">
                  <li>In the right panel, check that all files are visible</li>
                  <li>Verify index.html exists in public_html</li>
                  <li>Verify assets/ folder is present with files inside</li>
                  <li>Check file sizes match (compare left vs right panels)</li>
                </ol>
              </div>
            </div>

            {/* Option B: cPanel */}
            <div className="border border-muted rounded-lg p-4 space-y-3">
              <p className="text-sm font-bold">Option B: Using GoDaddy cPanel File Manager</p>
              
              <div className="space-y-2">
                <p className="text-xs font-semibold bg-muted p-2 rounded">Step 4.1: Access cPanel</p>
                <ol className="text-xs space-y-1 ml-4 list-[lower-alpha]">
                  <li>Log into your GoDaddy account</li>
                  <li>Go to My Products → Hosting</li>
                  <li>Click "cPanel Admin" for your hosting</li>
                </ol>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold bg-muted p-2 rounded">Step 4.2: Open File Manager</p>
                <ol className="text-xs space-y-1 ml-4 list-[lower-alpha]">
                  <li>In cPanel, find "Files" section</li>
                  <li>Click "File Manager"</li>
                  <li>Navigate to public_html folder</li>
                </ol>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold bg-muted p-2 rounded">Step 4.3: Clear Old Files</p>
                <ol className="text-xs space-y-1 ml-4 list-[lower-alpha]">
                  <li>Select all existing files in public_html</li>
                  <li>Click "Delete" at the top</li>
                  <li>Confirm deletion</li>
                </ol>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold bg-muted p-2 rounded">Step 4.4: Upload New Files</p>
                <ol className="text-xs space-y-1 ml-4 list-[lower-alpha]">
                  <li>Click "Upload" button at the top</li>
                  <li>Click "Select File" or drag files into the upload area</li>
                  <li>Select ALL files from your dist/extracted folder</li>
                  <li>Wait for upload progress bars to complete (each file shows % progress)</li>
                  <li>When complete, click "Go Back to /public_html"</li>
                </ol>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold bg-green-500/20 p-2 rounded">Step 4.5: Verify Upload</p>
                <ol className="text-xs space-y-1 ml-4 list-[lower-alpha]">
                  <li>Refresh the file list</li>
                  <li>Verify all files are present</li>
                  <li>Check that folders (assets/) are uploaded with contents</li>
                </ol>
              </div>
            </div>

            {/* .htaccess file */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 space-y-2">
              <p className="text-sm font-bold text-orange-600">⚠️ Important: .htaccess File</p>
              <p className="text-xs">Your React app needs this file for proper routing. If it's not in your build folder, create it:</p>
              
              <div className="space-y-2">
                <p className="text-xs font-semibold">Option 1: Create in FileZilla</p>
                <ol className="text-xs space-y-1 ml-4 list-decimal">
                  <li>Right-click in the remote panel → Create file</li>
                  <li>Name it exactly: <code className="bg-muted px-1">.htaccess</code></li>
                  <li>Right-click the new file → View/Edit</li>
                  <li>Paste the code below, save and close</li>
                </ol>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold">Option 2: Create in cPanel</p>
                <ol className="text-xs space-y-1 ml-4 list-decimal">
                  <li>In File Manager, click "+ File" button</li>
                  <li>Name it: <code className="bg-muted px-1">.htaccess</code></li>
                  <li>Right-click → Edit → paste code below</li>
                  <li>Save changes</li>
                </ol>
              </div>

              <pre className="text-[10px] bg-background p-2 rounded overflow-x-auto">
{`<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>`}
              </pre>
            </div>

            {/* Troubleshooting */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 space-y-2">
              <p className="text-xs font-bold text-red-600">🔧 Common Upload Issues:</p>
              <ul className="text-xs space-y-1 ml-4 list-disc">
                <li><strong>Connection timeout:</strong> Check FTP credentials, try reconnecting</li>
                <li><strong>Permission denied:</strong> Ensure FTP user has write access to public_html</li>
                <li><strong>Upload slow:</strong> Normal for 50+ files, be patient</li>
                <li><strong>Some files missing:</strong> Upload folders separately if bulk upload fails</li>
                <li><strong>Cannot delete old files:</strong> Contact GoDaddy support for file permissions</li>
              </ul>
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