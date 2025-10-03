import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Terminal, Github, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SSMDeployGuideProps {
  instanceId?: string;
  githubRepo?: string;
  branch?: string;
}

export const SSMDeployGuide = ({ instanceId, githubRepo, branch = "main" }: SSMDeployGuideProps) => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const ssmCommand = `aws ssm start-session --target ${instanceId || 'YOUR_INSTANCE_ID'} --region us-east-1`;
  
  const githubActionsWorkflow = `name: Deploy to EC2
on:
  push:
    branches: [${branch}]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to EC2 via SSM
        env:
          AWS_ACCESS_KEY_ID: \${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
        run: |
          aws ssm send-command \\
            --instance-ids ${instanceId || 'YOUR_INSTANCE_ID'} \\
            --document-name "AWS-RunShellScript" \\
            --parameters 'commands=[
              "cd /var/www/app || mkdir -p /var/www/app",
              "cd /var/www/app",
              "if [ -d .git ]; then git pull origin ${branch}; else git clone -b ${branch} ${githubRepo || 'YOUR_REPO'} .; fi",
              "npm install",
              "npm run build",
              "sudo rm -rf /var/www/html/*",
              "sudo cp -r dist/* /var/www/html/",
              "sudo systemctl restart nginx"
            ]' \\
            --output text`;

  return (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Deploy to EC2 without managing SSH keys! AWS Systems Manager (SSM) provides secure, 
          key-free access to your instances.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                AWS SSM Deployment
              </CardTitle>
              <CardDescription>Connect to EC2 without SSH keys</CardDescription>
            </div>
            <Badge variant="secondary">Recommended</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Prerequisites
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
              <li>AWS CLI installed (<a href="https://aws.amazon.com/cli/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Get it here</a>)</li>
              <li>Session Manager plugin (<a href="https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Install guide</a>)</li>
              <li>EC2 instance with SSM role (AmazonSSMManagedInstanceCore)</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Connect Command</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(ssmCommand, "SSM command")}
              >
                Copy
              </Button>
            </div>
            <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
              <code>{ssmCommand}</code>
            </pre>
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              After connecting, you can run deployment commands directly on your instance 
              without needing any .pem files!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                GitHub Actions Automation
              </CardTitle>
              <CardDescription>Fully automated deployment on push</CardDescription>
            </div>
            <Badge>Fully Automated</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Setup Steps</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Create <code className="bg-muted px-1 rounded">.github/workflows/deploy.yml</code> in your repo</li>
              <li>Add the workflow configuration below</li>
              <li>Add AWS credentials to GitHub Secrets:
                <ul className="list-disc list-inside ml-6 mt-1 text-muted-foreground">
                  <li>AWS_ACCESS_KEY_ID</li>
                  <li>AWS_SECRET_ACCESS_KEY</li>
                </ul>
              </li>
              <li>Push to {branch} branch to trigger automatic deployment</li>
            </ol>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Workflow File</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(githubActionsWorkflow, "GitHub Actions workflow")}
              >
                Copy
              </Button>
            </div>
            <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto max-h-96">
              <code>{githubActionsWorkflow}</code>
            </pre>
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>Pro Tip:</strong> This workflow runs automatically on every push to {branch}, 
              eliminating manual deployment steps entirely!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Benefits of Key-Free Deployment</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <span><strong>No Key Management:</strong> No need to store or manage .pem files</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <span><strong>Better Security:</strong> Uses AWS IAM for authentication</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <span><strong>Audit Trail:</strong> All sessions logged in CloudTrail</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <span><strong>CI/CD Ready:</strong> Perfect for automated deployments</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
