import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Rocket, Loader2, CheckCircle2, Github, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AutoDeployButtonProps {
  ec2Ip?: string;
  instanceId?: string;
}

export function AutoDeployButton({ ec2Ip, instanceId }: AutoDeployButtonProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentSuccess, setDeploymentSuccess] = useState(false);
  const [githubRepo, setGithubRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [buildCommand, setBuildCommand] = useState("npm run build");
  const [deployedUrl, setDeployedUrl] = useState("");

  const handleDeploy = async () => {
    if (!ec2Ip || !instanceId) {
      toast.error("EC2 instance information is missing");
      return;
    }

    if (!githubRepo) {
      toast.error("Please enter your GitHub repository URL");
      return;
    }

    setIsDeploying(true);
    setDeploymentSuccess(false);
    toast.info("Starting deployment to AWS EC2...");

    try {
      const { data, error } = await supabase.functions.invoke('deploy-to-ec2', {
        body: {
          ec2Ip,
          instanceId,
          githubRepo,
          branch,
          buildCommand,
          projectName: 'app'
        }
      });

      if (error) throw error;

      if (data.success) {
        setDeploymentSuccess(true);
        setDeployedUrl(data.deployedUrl);
        
        // Show instructions in a dialog or copy to clipboard
        if (data.instructions) {
          navigator.clipboard.writeText(data.instructions);
          toast.success("✅ Deployment instructions copied to clipboard!", {
            description: "SSH into your EC2 and run the script"
          });
        } else {
          toast.success("🎉 Deployment script ready!");
        }
      } else {
        throw new Error(data.error || 'Deployment failed');
      }
    } catch (error: any) {
      console.error('Deployment error:', error);
      toast.error(`Deployment failed: ${error.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          Automated Deployment
        </CardTitle>
        <CardDescription>
          Deploy your production-ready application to AWS EC2 with one click
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* GitHub Repository Configuration */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="github-repo" className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              GitHub Repository URL
            </Label>
            <Input
              id="github-repo"
              placeholder="https://github.com/username/repository.git"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              disabled={isDeploying}
            />
            <p className="text-xs text-muted-foreground">
              Your GitHub repository must be public or EC2 must have SSH access
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Input
                id="branch"
                placeholder="main"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                disabled={isDeploying}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="build-command">Build Command</Label>
              <Input
                id="build-command"
                placeholder="npm run build"
                value={buildCommand}
                onChange={(e) => setBuildCommand(e.target.value)}
                disabled={isDeploying}
              />
            </div>
          </div>
        </div>

        {/* Deployment Status */}
        {deploymentSuccess && deployedUrl && (
          <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-semibold text-blue-800 dark:text-blue-200">
                  ✅ Deployment Script Generated!
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  📋 Deployment instructions have been copied to your clipboard.
                </p>
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded text-sm">
                  <p className="font-medium mb-2">Next steps:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>SSH into your EC2: <code className="text-xs">ssh -i your-key.pem ec2-user@{ec2Ip}</code></li>
                    <li>Paste and run the deployment script</li>
                    <li>Your site will be live at: <a href={deployedUrl} target="_blank" rel="noopener noreferrer" className="underline">{deployedUrl}</a></li>
                  </ol>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Deploy Button */}
        <Button
          onClick={handleDeploy}
          disabled={isDeploying || !ec2Ip || !githubRepo}
          className="w-full gap-2"
          size="lg"
        >
          {isDeploying ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Deploying to EC2...
            </>
          ) : (
            <>
              <Rocket className="h-5 w-5" />
              Deploy to Production
            </>
          )}
        </Button>

        {/* Information */}
        <Alert>
          <AlertDescription className="text-sm space-y-2">
            <p className="font-semibold">What this does:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Connects to your EC2 instance via SSH</li>
              <li>Clones/pulls latest code from GitHub</li>
              <li>Installs dependencies and builds your app</li>
              <li>Deploys to Nginx and restarts services</li>
              <li>Makes your site live immediately</li>
            </ul>
          </AlertDescription>
        </Alert>

        {!ec2Ip && (
          <Alert variant="destructive">
            <AlertDescription>
              No EC2 instance detected. Please deploy an EC2 instance first.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
