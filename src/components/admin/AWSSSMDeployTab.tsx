import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Key, Server, Code, CheckCircle2, AlertCircle, Eye, EyeOff, Package, Database } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

interface AWSSSMDeployTabProps {
  instanceId?: string;
  defaultRegion?: string;
}

export const AWSSSMDeployTab = ({ instanceId, defaultRegion = "us-east-1" }: AWSSSMDeployTabProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deployScript, setDeployScript] = useState("");
  const [deployInstructions, setDeployInstructions] = useState("");
  
  // AWS Credentials
  const [awsAccessKeyId, setAwsAccessKeyId] = useState("");
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState("");
  const [region, setRegion] = useState(defaultRegion);
  const [targetInstanceId, setTargetInstanceId] = useState(instanceId || "");
  
  // Deployment Config
  const [projectName, setProjectName] = useState("my-app");
  const [buildCommand, setBuildCommand] = useState("npm install && npm run build");
  const [deploymentType, setDeploymentType] = useState<'code-only' | 'fresh'>('code-only');
  const [autoSetupSSM, setAutoSetupSSM] = useState(true);
  const [gitRepoUrl, setGitRepoUrl] = useState('');
  const [gitBranch, setGitBranch] = useState('main');
  
  // S3 Upload
  const [useS3Upload, setUseS3Upload] = useState(false);
  const [s3BucketName, setS3BucketName] = useState('');
  const [uploadingToS3, setUploadingToS3] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  // Visibility toggles
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  const handleDeploy = async () => {
    if (!awsAccessKeyId || !awsSecretAccessKey || !region || !targetInstanceId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all AWS credentials and instance details",
        variant: "destructive",
      });
      return;
    }

    // If S3 upload is enabled, upload files first
    if (useS3Upload && selectedFiles && selectedFiles.length > 0) {
      if (!s3BucketName) {
        toast({
          title: "Missing S3 Bucket",
          description: "Please enter your S3 bucket name",
          variant: "destructive",
        });
        return;
      }

      setUploadingToS3(true);
      try {
        // Convert files to base64
        const filePromises = Array.from(selectedFiles).map(async (file) => {
          const arrayBuffer = await file.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          return {
            path: file.webkitRelativePath || file.name,
            content: base64,
          };
        });

        const files = await Promise.all(filePromises);

        const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-to-s3', {
          body: {
            bucketName: s3BucketName,
            region,
            awsAccessKeyId,
            awsSecretAccessKey,
            files,
          },
        });

        if (uploadError) throw uploadError;

        if (!uploadData?.success) {
          throw new Error(uploadData?.message || 'S3 upload failed');
        }

        toast({
          title: "Files Uploaded to S3",
          description: `${uploadData.uploadedFiles.length} files uploaded successfully`,
        });
      } catch (error: any) {
        console.error('S3 upload error:', error);
        toast({
          title: "S3 Upload Failed",
          description: error.message,
          variant: "destructive",
        });
        setUploadingToS3(false);
        return;
      }
      setUploadingToS3(false);
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('aws-ssm-deploy', {
        body: {
          instanceId: targetInstanceId,
          region,
          awsAccessKeyId,
          awsSecretAccessKey,
          buildCommand,
          projectName,
          deploymentType,
          autoSetupSSM,
          gitRepoUrl: gitRepoUrl.trim() || undefined,
          gitBranch: gitBranch.trim() || 'main',
          s3BucketName: useS3Upload ? s3BucketName : undefined,
        }
      });

      if (error) throw error;

      if (data?.success) {
        setDeployScript(data.deployScript || "");
        setDeployInstructions(data.instructions || "");
        toast({
          title: "Deployment Prepared",
          description: "Check the Script & Instructions tabs for next steps",
        });
      }
    } catch (error: any) {
      console.error('Deployment error:', error);
      toast({
        title: "Deployment Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Content copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            AWS SSM Deployment
          </CardTitle>
          <CardDescription>
            Deploy directly to EC2 without SSH keys or public GitHub repositories. Enter credentials when you're ready to push.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="configure" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configure">
            <Key className="w-4 h-4 mr-2" />
            Configure
          </TabsTrigger>
          <TabsTrigger value="deploy">
            <Upload className="w-4 h-4 mr-2" />
            Deploy
          </TabsTrigger>
          <TabsTrigger value="script">
            <Code className="w-4 h-4 mr-2" />
            Script
          </TabsTrigger>
          <TabsTrigger value="instructions">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Instructions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                AWS Credentials
              </CardTitle>
              <CardDescription>
                Your credentials are only used for this deployment and not stored permanently
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  These credentials are used temporarily to execute the deployment command via AWS Systems Manager (SSM). They are never stored in our database.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="accessKey">AWS Access Key ID</Label>
                <div className="relative">
                  <Input
                    id="accessKey"
                    type={showAccessKey ? "text" : "password"}
                    placeholder="AKIA..."
                    value={awsAccessKeyId}
                    onChange={(e) => setAwsAccessKeyId(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowAccessKey(!showAccessKey)}
                  >
                    {showAccessKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretKey">AWS Secret Access Key</Label>
                <div className="relative">
                  <Input
                    id="secretKey"
                    type={showSecretKey ? "text" : "password"}
                    placeholder="Enter your AWS secret key"
                    value={awsSecretAccessKey}
                    onChange={(e) => setAwsSecretAccessKey(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                  >
                    {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region">AWS Region</Label>
                  <Input
                    id="region"
                    placeholder="us-east-1"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instanceId">EC2 Instance ID</Label>
                  <Input
                    id="instanceId"
                    placeholder="i-1234567890abcdef0"
                    value={targetInstanceId}
                    onChange={(e) => setTargetInstanceId(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <Label htmlFor="autoSetupSSM" className="font-semibold">
                    Auto-Setup SSM Permissions
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically configure IAM role and attach SSM permissions if not present
                  </p>
                </div>
                <Switch
                  id="autoSetupSSM"
                  checked={autoSetupSSM}
                  onCheckedChange={setAutoSetupSSM}
                />
              </div>

              <Alert>
                <Server className="h-4 w-4" />
                <AlertDescription>
                  {autoSetupSSM 
                    ? "The deployment instructions will include commands to automatically setup SSM permissions if they're not already configured."
                    : "Make sure your EC2 instance has the SSM agent installed and an IAM role with SSM permissions (AmazonSSMManagedInstanceCore policy) attached."
                  }
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How SSM Deployment Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600" />
                <div>
                  <strong>No SSH Keys Required:</strong> Uses AWS Systems Manager (SSM) for secure, encrypted access to your EC2 instance
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600" />
                <div>
                  <strong>No Public GitHub:</strong> Deploy directly from your local environment without exposing your repository publicly
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600" />
                <div>
                  <strong>Secure Credentials:</strong> AWS credentials are used only for this request and never stored
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600" />
                <div>
                  <strong>Automated Setup:</strong> Installs Node.js, dependencies, and configures Nginx automatically
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deploy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Configuration</CardTitle>
              <CardDescription>
                Configure your project settings before deploying
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Deployment Type</Label>
                <RadioGroup value={deploymentType} onValueChange={(value: 'fresh' | 'code-only') => setDeploymentType(value)}>
                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="code-only" id="code-only" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="code-only" className="cursor-pointer font-semibold flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        Code Only Update (Recommended)
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Updates only your application code. Preserves all user data, databases, uploads, and configurations. Safe for production.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded">✓ Keeps user data</span>
                        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded">✓ Preserves database</span>
                        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded">✓ Zero downtime</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer border-orange-200 dark:border-orange-800">
                    <RadioGroupItem value="fresh" id="fresh" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="fresh" className="cursor-pointer font-semibold flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Fresh Installation
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Complete clean installation. Removes all existing data and starts fresh. Use only for initial setup or testing.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 px-2 py-0.5 rounded">⚠ Deletes all data</span>
                        <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 px-2 py-0.5 rounded">⚠ Wipes database</span>
                        <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 px-2 py-0.5 rounded">⚠ Removes uploads</span>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {deploymentType === 'fresh' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> Fresh installation will permanently delete all existing data, databases, uploaded files, and configurations. This action cannot be undone.
                  </AlertDescription>
                </Alert>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Option 1 - Git Repository (Recommended):</strong> Provide your Git repository URL for automatic code deployment.
                  <br />
                  <strong>Option 2 - Direct Upload:</strong> Leave Git URL empty to use files already on your EC2 instance (manual upload required).
                </AlertDescription>
              </Alert>

              {!gitRepoUrl && !useS3Upload && (
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm space-y-2">
                    <strong className="text-blue-900 dark:text-blue-100">Manual Upload Required:</strong>
                    <p className="text-blue-800 dark:text-blue-200">Before deploying, upload your project files to your EC2 instance:</p>
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded font-mono text-xs space-y-1">
                      <div><strong>Option A - SCP:</strong></div>
                      <div>scp -i your-key.pem -r ./your-project/* ec2-user@your-instance-ip:/var/www/{projectName}/</div>
                      <div className="pt-2"><strong>Option B - SFTP:</strong></div>
                      <div>sftp -i your-key.pem ec2-user@your-instance-ip</div>
                      <div>put -r ./your-project/* /var/www/{projectName}/</div>
                    </div>
                    <p className="text-blue-800 dark:text-blue-200 pt-2">Or enable S3 Auto-Upload below</p>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <Label htmlFor="useS3Upload" className="font-semibold">
                    Enable S3 Auto-Upload
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically upload project files to S3, then sync to EC2
                  </p>
                </div>
                <Switch
                  id="useS3Upload"
                  checked={useS3Upload}
                  onCheckedChange={setUseS3Upload}
                />
              </div>

              {useS3Upload && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="s3BucketName">S3 Bucket Name *</Label>
                    <Input
                      id="s3BucketName"
                      placeholder="my-deployment-bucket"
                      value={s3BucketName}
                      onChange={(e) => setS3BucketName(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Your S3 bucket must exist and your AWS credentials must have write access
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projectFiles">Upload Project Files *</Label>
                    <Input
                      id="projectFiles"
                      type="file"
                      // @ts-ignore - webkitdirectory is not in TypeScript types
                      webkitdirectory="true"
                      directory="true"
                      multiple
                      onChange={(e) => setSelectedFiles(e.target.files)}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      {selectedFiles ? `${selectedFiles.length} files selected` : 'Select your entire project folder'}
                    </p>
                  </div>

                  <Alert>
                    <Upload className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Auto-Upload Flow:</strong>
                      <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                        <li>Select your project folder above</li>
                        <li>Click "Upload & Deploy" to upload files to S3</li>
                        <li>Deployment script will sync from S3 to EC2</li>
                        <li>Build and deploy automatically</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="gitRepoUrl">Git Repository URL (Optional)</Label>
                <Input
                  id="gitRepoUrl"
                  placeholder="https://github.com/username/repository.git"
                  value={gitRepoUrl}
                  onChange={(e) => setGitRepoUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty if you prefer to manually upload files to your EC2 instance for security reasons
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gitBranch">Git Branch</Label>
                <Input
                  id="gitBranch"
                  placeholder="main"
                  value={gitBranch}
                  onChange={(e) => setGitBranch(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  placeholder="my-app"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This will be used as the directory name: /var/www/{projectName}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="buildCommand">Build Command</Label>
                <Input
                  id="buildCommand"
                  placeholder="npm install && npm run build"
                  value={buildCommand}
                  onChange={(e) => setBuildCommand(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The command to build your project (e.g., npm run build, yarn build)
                </p>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleDeploy} 
                  disabled={loading || uploadingToS3 || !awsAccessKeyId || !awsSecretAccessKey || !targetInstanceId || (useS3Upload && (!s3BucketName || !selectedFiles))}
                  className="w-full"
                  size="lg"
                >
                  {uploadingToS3 ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading to S3...
                    </>
                  ) : loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Preparing Deployment...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {useS3Upload ? 'Upload & Deploy' : 'Prepare Deployment'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> After clicking "Prepare Deployment", you'll receive a deployment script and AWS CLI commands in the following tabs. You'll need to execute these commands from your terminal with AWS CLI installed.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="script" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Script</CardTitle>
              <CardDescription>
                {deployScript ? "Generated bash script for your deployment" : "Click 'Prepare Deployment' in the Deploy tab to generate the script"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deployScript ? (
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(deployScript)}
                    >
                      Copy Script
                    </Button>
                  </div>
                  <Textarea
                    value={deployScript}
                    readOnly
                    className="font-mono text-xs h-96"
                  />
                </div>
              ) : (
                <Alert>
                  <Code className="h-4 w-4" />
                  <AlertDescription>
                    The deployment script will appear here after you configure and prepare the deployment.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instructions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Instructions</CardTitle>
              <CardDescription>
                {deployInstructions ? "Follow these steps to complete your deployment" : "Instructions will appear after preparing deployment"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deployInstructions ? (
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(deployInstructions)}
                    >
                      Copy Instructions
                    </Button>
                  </div>
                  <pre className="p-4 bg-muted rounded-lg text-xs whitespace-pre-wrap font-mono">
                    {deployInstructions}
                  </pre>
                </div>
              ) : (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Step-by-step instructions for executing the deployment will appear here once you've prepared the deployment in the Deploy tab.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
