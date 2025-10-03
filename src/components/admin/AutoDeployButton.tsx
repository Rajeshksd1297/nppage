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
        toast.success("🎉 Deployment completed successfully!");
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
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-green-800 dark:text-green-200">
                  ✅ Deployment Successful!
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your site is now live at:
                  </p>
                  <a
                    href={deployedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-green-800 dark:text-green-200 hover:underline flex items-center gap-1"
                  >
                    {deployedUrl}
                    <ExternalLink className="h-3 w-3" />
                  </a>
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
