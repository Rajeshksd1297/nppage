import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Terminal, Github, Key, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const GitAuthSetup = () => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const sshKeyGenCommand = `ssh-keygen -t ed25519 -C "your-email@example.com"
cat ~/.ssh/id_ed25519.pub`;

  const gitConfigSSH = `# Test SSH connection
ssh -T git@github.com

# If successful, you'll see:
# "Hi username! You've successfully authenticated..."`;

  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>GitHub Authentication Error:</strong> GitHub no longer supports password authentication. 
          You must use SSH keys or Personal Access Tokens.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Method 1: SSH Keys (Recommended)
              </CardTitle>
              <CardDescription>Secure, no passwords needed</CardDescription>
            </div>
            <Badge>Most Secure</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Step 1: Generate SSH Key on EC2</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Connect to your EC2 instance and run:
            </p>
            <div className="flex items-center justify-between gap-2 mb-2">
              <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto flex-1">
                <code>{sshKeyGenCommand}</code>
              </pre>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(sshKeyGenCommand, "SSH key generation commands")}
              >
                Copy
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Press Enter for all prompts (no passphrase needed for automated deployments)
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Step 2: Add Key to GitHub</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Copy the public key output from above command</li>
              <li>Go to GitHub: <a href="https://github.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Settings → SSH and GPG keys</a></li>
              <li>Click "New SSH key"</li>
              <li>Paste your public key and save</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Step 3: Test Connection</h4>
            <div className="flex items-center justify-between gap-2 mb-2">
              <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto flex-1">
                <code>{gitConfigSSH}</code>
              </pre>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(gitConfigSSH, "SSH test command")}
              >
                Copy
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Step 4: Update Repository URL to SSH</h4>
            <p className="text-sm text-muted-foreground mb-2">
              In your deployment script, use SSH URL format:
            </p>
            <div className="bg-muted p-3 rounded-md text-sm">
              <code className="text-green-600">✓ git@github.com:username/repo.git</code>
              <br />
              <code className="text-red-600 line-through">✗ https://github.com/username/repo.git</code>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                Method 2: Personal Access Token
              </CardTitle>
              <CardDescription>Works with HTTPS URLs</CardDescription>
            </div>
            <Badge variant="secondary">Alternative</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Step 1: Create Token</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Go to GitHub: <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Settings → Developer settings → Personal access tokens → Tokens (classic)</a></li>
              <li>Click "Generate new token (classic)"</li>
              <li>Select scopes: <code className="bg-muted px-1">repo</code> (full control)</li>
              <li>Click "Generate token" and copy it immediately</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Step 2: Use Token in Git Clone</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Replace the git clone command with:
            </p>
            <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
              <code>git clone https://YOUR_TOKEN@github.com/username/repo.git</code>
            </pre>
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>Security Note:</strong> Tokens are like passwords. Store them securely and never commit them to repositories.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Quick Fix for Current Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            Your deployment is failing because GitHub requires authentication. Choose ONE of these quick fixes:
          </p>
          
          <div className="space-y-2">
            <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">Option A: Use Public Repository (Fastest)</p>
              <p className="text-xs text-green-700 dark:text-green-300">
                Make your GitHub repository public temporarily - no authentication needed for cloning
              </p>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Option B: Setup SSH (Recommended)</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Follow Method 1 above - takes 5 minutes, works forever
              </p>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-md">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">Option C: Use GitHub Actions (Best)</p>
              <p className="text-xs text-purple-700 dark:text-purple-300">
                Fully automated - no manual deployment steps at all! See "No-Key Deploy" tab
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
