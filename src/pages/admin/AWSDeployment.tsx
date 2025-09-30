import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Server, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AWSDeployment() {
  const [deploymentName, setDeploymentName] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [autoDeploy, setAutoDeploy] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deployments, isLoading } = useQuery({
    queryKey: ["aws-deployments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aws_deployments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deployMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("aws-deploy", {
        body: {
          deploymentName,
          region,
          autoDeploy,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Deployment Started",
        description: "Your AWS EC2 instance is being deployed.",
      });
      queryClient.invalidateQueries({ queryKey: ["aws-deployments"] });
      setDeploymentName("");
    },
    onError: (error: Error) => {
      toast({
        title: "Deployment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeploy = () => {
    if (!deploymentName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a deployment name.",
        variant: "destructive",
      });
      return;
    }
    deployMutation.mutate();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">AWS EC2 Deployment</h1>
        <p className="text-muted-foreground">
          Deploy and manage your AWS EC2 instances
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Deployment</CardTitle>
          <CardDescription>
            Create a new EC2 instance deployment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deployment-name">Deployment Name</Label>
            <Input
              id="deployment-name"
              placeholder="my-app-production"
              value={deploymentName}
              onChange={(e) => setDeploymentName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">AWS Region</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger id="region">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="auto-deploy"
              checked={autoDeploy}
              onCheckedChange={setAutoDeploy}
            />
            <Label htmlFor="auto-deploy">Enable Auto Deploy</Label>
          </div>

          <Button
            onClick={handleDeploy}
            disabled={deployMutation.isPending}
            className="w-full"
          >
            {deployMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Deploy to AWS EC2
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Deployments</CardTitle>
          <CardDescription>
            View and manage your EC2 instances
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : deployments && deployments.length > 0 ? (
            <div className="space-y-4">
              {deployments.map((deployment) => (
                <Card key={deployment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          <h3 className="font-semibold">{deployment.deployment_name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Region: {deployment.region}
                        </p>
                        {deployment.ec2_instance_id && (
                          <p className="text-sm text-muted-foreground">
                            Instance: {deployment.ec2_instance_id}
                          </p>
                        )}
                        {deployment.ec2_public_ip && (
                          <div className="flex items-center gap-2">
                            <a
                              href={`http://${deployment.ec2_public_ip}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              {deployment.ec2_public_ip}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            deployment.status === "running"
                              ? "bg-green-100 text-green-800"
                              : deployment.status === "deploying"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {deployment.status}
                        </span>
                        {deployment.last_deployed_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(deployment.last_deployed_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No deployments yet. Create your first deployment above.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
