import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Key, Server, Code } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AWSSSMDeployment = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deployScript, setDeployScript] = useState("");
  
  // AWS Credentials
  const [awsAccessKeyId, setAwsAccessKeyId] = useState("");
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [instanceId, setInstanceId] = useState("");
  
  // Deployment Config
  const [projectName, setProjectName] = useState("my-app");
  const [buildCommand, setBuildCommand] = useState("npm install && npm run build");

  const handleDeploy = async () => {
    if (!awsAccessKeyId || !awsSecretAccessKey || !region || !instanceId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all AWS credentials and instance details",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('aws-ssm-deploy', {
        body: {
          instanceId,
          region,
          awsAccessKeyId,
          awsSecretAccessKey,
          buildCommand,
          projectName,
        }
      });

      if (error) throw error;

      if (data?.success) {
        setDeployScript(data.deployScript || "");
        toast({
          title: "Deployment Initiated",
          description: "Check the instructions tab for next steps",
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">AWS SSM Deployment</h1>
        <p className="text-muted-foreground">
          Deploy directly to EC2 without SSH keys or public GitHub repositories
        </p>
      </div>

      <Tabs defaultValue="configure" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
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
        </TabsList>

        <TabsContent value="configure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                AWS Credentials
              </CardTitle>
              <CardDescription>
                Your credentials are only used for this deployment and not stored
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accessKey">AWS Access Key ID</Label>
                <Input
                  id="accessKey"
                  type="password"
                  placeholder="AKIA..."
                  value={awsAccessKeyId}
                  onChange={(e) => setAwsAccessKeyId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretKey">AWS Secret Access Key</Label>
                <Input
                  id="secretKey"
                  type="password"
                  placeholder="Enter your AWS secret key"
                  value={awsSecretAccessKey}
                  onChange={(e) => setAwsSecretAccessKey(e.target.value)}
                />
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
                    value={instanceId}
                    onChange={(e) => setInstanceId(e.target.value)}
                  />
                </div>
              </div>

              <Alert>
                <Server className="h-4 w-4" />
                <AlertDescription>
                  Make sure your EC2 instance has the SSM agent installed and an IAM role with SSM permissions
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deploy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Configuration</CardTitle>
              <CardDescription>
                Configure your project settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  placeholder="my-app"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buildCommand">Build Command</Label>
                <Input
                  id="buildCommand"
                  placeholder="npm install && npm run build"
                  value={buildCommand}
                  onChange={(e) => setBuildCommand(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleDeploy} 
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Deploy to EC2
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>1. <strong>No SSH Keys Required:</strong> Uses AWS Systems Manager (SSM) for secure access</p>
              <p>2. <strong>No Public GitHub:</strong> Deploy directly from your local environment</p>
              <p>3. <strong>Secure Credentials:</strong> Your AWS credentials are used only for this request</p>
              <p>4. <strong>Automated Setup:</strong> Installs dependencies and configures Nginx automatically</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="script" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Script</CardTitle>
              <CardDescription>
                {deployScript ? "Generated deployment script" : "Deploy first to see the script"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deployScript ? (
                <Textarea
                  value={deployScript}
                  readOnly
                  className="font-mono text-xs h-96"
                />
              ) : (
                <Alert>
                  <AlertDescription>
                    Click "Deploy to EC2" to generate the deployment script
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

export default AWSSSMDeployment;
