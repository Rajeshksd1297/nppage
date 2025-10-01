import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Server, ExternalLink, Eye, EyeOff, Save, CheckCircle2, Circle, Rocket } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";

const awsRegions = [
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-east-2", label: "US East (Ohio)" },
  { value: "us-west-1", label: "US West (N. California)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "eu-west-1", label: "EU (Ireland)" },
  { value: "eu-central-1", label: "EU (Frankfurt)" },
  { value: "ap-south-1", label: "Asia Pacific (Mumbai)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
  { value: "ap-southeast-2", label: "Asia Pacific (Sydney)" },
  { value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
];

const instanceTypes = [
  { value: "t2.micro", label: "t2.micro (Free Tier)" },
  { value: "t2.small", label: "t2.small" },
  { value: "t2.medium", label: "t2.medium" },
  { value: "t3.micro", label: "t3.micro" },
  { value: "t3.small", label: "t3.small" },
  { value: "t3.medium", label: "t3.medium" },
];

const settingsSchema = z.object({
  aws_access_key_id: z.string().min(16, "Access Key ID must be at least 16 characters").max(128),
  aws_secret_access_key: z.string().min(40, "Secret Access Key must be at least 40 characters").max(128),
  default_region: z.string().min(1),
  instance_type: z.string().min(1),
  key_pair_name: z.string().optional(),
  security_group_id: z.string().optional(),
  subnet_id: z.string().optional(),
  ami_id: z.string().optional(),
  auto_deploy_enabled: z.boolean(),
});

const deploymentSteps = [
  {
    title: "Configure AWS Credentials",
    description: "Add your AWS Access Key ID and Secret Access Key",
    completed: false,
  },
  {
    title: "Set Instance Configuration",
    description: "Choose region and instance type for your deployment",
    completed: false,
  },
  {
    title: "Create Deployment",
    description: "Name your deployment and launch EC2 instance",
    completed: false,
  },
];

export default function AWSDeployment() {
  const [deploymentName, setDeploymentName] = useState("");
  const [region, setRegion] = useState("ap-south-1");
  const [autoDeploy, setAutoDeploy] = useState(false);
  const [deploymentType, setDeploymentType] = useState<'fresh' | 'incremental'>('incremental');
  const [includeDatabase, setIncludeDatabase] = useState(false);
  const [includeMigrations, setIncludeMigrations] = useState(true);
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [settingsForm, setSettingsForm] = useState({
    aws_access_key_id: "",
    aws_secret_access_key: "",
    default_region: "ap-south-1",
    instance_type: "t2.micro",
    key_pair_name: "",
    security_group_id: "",
    subnet_id: "",
    ami_id: "",
    auto_deploy_enabled: false,
  });

  const { data: awsSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["aws-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aws_settings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (awsSettings) {
      setSettingsForm({
        aws_access_key_id: awsSettings.aws_access_key_id || "",
        aws_secret_access_key: awsSettings.aws_secret_access_key || "",
        default_region: awsSettings.default_region || "ap-south-1",
        instance_type: awsSettings.instance_type || "t2.micro",
        key_pair_name: awsSettings.key_pair_name || "",
        security_group_id: awsSettings.security_group_id || "",
        subnet_id: awsSettings.subnet_id || "",
        ami_id: awsSettings.ami_id || "",
        auto_deploy_enabled: awsSettings.auto_deploy_enabled || false,
      });
      setRegion(awsSettings.default_region || "ap-south-1");
    }
  }, [awsSettings]);

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

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: typeof settingsForm) => {
      try {
        settingsSchema.parse(data);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(error.errors[0].message);
        }
        throw error;
      }

      if (awsSettings?.id) {
        const { error } = await supabase
          .from("aws_settings")
          .update(data)
          .eq("id", awsSettings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("aws_settings").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "AWS settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["aws-settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deployMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("aws-deploy", {
        body: {
          deploymentName,
          region,
          autoDeploy,
          deploymentType,
          includeDatabase,
          includeMigrations,
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

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettingsMutation.mutate(settingsForm);
  };

  const handleDeploy = () => {
    if (!awsSettings?.aws_access_key_id || !awsSettings?.aws_secret_access_key) {
      toast({
        title: "AWS Settings Required",
        description: "Please configure AWS credentials first.",
        variant: "destructive",
      });
      return;
    }

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

  const completedSteps = [
    !!awsSettings?.aws_access_key_id && !!awsSettings?.aws_secret_access_key,
    !!awsSettings?.default_region && !!awsSettings?.instance_type,
    deployments && deployments.length > 0,
  ];

  const isReadyToDeploy = completedSteps[0] && completedSteps[1] && !completedSteps[2];

  if (settingsLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">AWS EC2 Deployment</h1>
        <p className="text-muted-foreground">
          Configure AWS credentials and deploy EC2 instances
        </p>
      </div>

      {/* Deployment Steps Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment Steps</CardTitle>
          <CardDescription>Follow these steps to deploy your application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deploymentSteps.map((step, index) => {
              const isComplete = completedSteps[index];
              const isReady = index === 2 && isReadyToDeploy;
              
              return (
                <div key={index} className="flex items-start gap-3">
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : isReady ? (
                    <Rocket className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <h4 className={`font-medium ${isComplete ? "text-green-600" : isReady ? "text-primary" : ""}`}>
                      Step {index + 1}: {step.title}
                      {isReady && <span className="ml-2 text-xs font-normal text-primary">(Ready to deploy!)</span>}
                    </h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">AWS Configuration</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="guide">Deployment Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <form onSubmit={handleSaveSettings}>
            <Card>
              <CardHeader>
                <CardTitle>AWS Credentials</CardTitle>
                <CardDescription>
                  Enter your AWS access credentials for EC2 deployments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="access-key">AWS Access Key ID *</Label>
                  <div className="relative">
                    <Input
                      id="access-key"
                      type={showAccessKey ? "text" : "password"}
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      value={settingsForm.aws_access_key_id}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, aws_access_key_id: e.target.value })
                      }
                      required
                      minLength={16}
                      maxLength={128}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowAccessKey(!showAccessKey)}
                    >
                      {showAccessKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secret-key">AWS Secret Access Key *</Label>
                  <div className="relative">
                    <Input
                      id="secret-key"
                      type={showSecretKey ? "text" : "password"}
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      value={settingsForm.aws_secret_access_key}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, aws_secret_access_key: e.target.value })
                      }
                      required
                      minLength={40}
                      maxLength={128}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                    >
                      {showSecretKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Instance Configuration</CardTitle>
                <CardDescription>
                  Configure default EC2 instance settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="region">Default Region *</Label>
                    <Select
                      value={settingsForm.default_region}
                      onValueChange={(value) =>
                        setSettingsForm({ ...settingsForm, default_region: value })
                      }
                    >
                      <SelectTrigger id="region">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {awsRegions.map((region) => (
                          <SelectItem key={region.value} value={region.value}>
                            {region.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instance-type">Instance Type *</Label>
                    <Select
                      value={settingsForm.instance_type}
                      onValueChange={(value) =>
                        setSettingsForm({ ...settingsForm, instance_type: value })
                      }
                    >
                      <SelectTrigger id="instance-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {instanceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="key-pair">Key Pair Name (Optional)</Label>
                  <Input
                    id="key-pair"
                    placeholder="my-ec2-keypair"
                    value={settingsForm.key_pair_name}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, key_pair_name: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    SSH key pair name for EC2 instance access
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="security-group">Security Group ID (Optional)</Label>
                  <Input
                    id="security-group"
                    placeholder="sg-0123456789abcdef0"
                    value={settingsForm.security_group_id}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, security_group_id: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subnet">Subnet ID (Optional)</Label>
                  <Input
                    id="subnet"
                    placeholder="subnet-0123456789abcdef0"
                    value={settingsForm.subnet_id}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, subnet_id: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ami">AMI ID (Optional)</Label>
                  <Input
                    id="ami"
                    placeholder="ami-0123456789abcdef0"
                    value={settingsForm.ami_id}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, ami_id: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use default Amazon Linux 2 AMI
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-deploy">Enable Auto Deploy</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically deploy on code changes
                    </p>
                  </div>
                  <Switch
                    id="auto-deploy"
                    checked={settingsForm.auto_deploy_enabled}
                    onCheckedChange={(checked) =>
                      setSettingsForm({ ...settingsForm, auto_deploy_enabled: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end mt-6">
              <Button type="submit" disabled={saveSettingsMutation.isPending}>
                {saveSettingsMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                Save Configuration
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="deployments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>New Deployment</CardTitle>
              <CardDescription>
                Create a new EC2 instance deployment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!awsSettings?.aws_access_key_id && (
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-500 rounded-lg p-4 mb-4">
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    ⚠️ AWS credentials not configured. Please configure AWS settings in the Configuration tab first.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="deployment-name">Deployment Name</Label>
                <Input
                  id="deployment-name"
                  placeholder="my-app-production"
                  value={deploymentName}
                  onChange={(e) => setDeploymentName(e.target.value)}
                  disabled={!awsSettings?.aws_access_key_id}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">AWS Region</Label>
                <Select 
                  value={region} 
                  onValueChange={setRegion}
                  disabled={!awsSettings?.aws_access_key_id}
                >
                  <SelectTrigger id="region">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {awsRegions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deployment-type">Deployment Type</Label>
                <Select 
                  value={deploymentType} 
                  onValueChange={(value: 'fresh' | 'incremental') => setDeploymentType(value)}
                  disabled={!awsSettings?.aws_access_key_id}
                >
                  <SelectTrigger id="deployment-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incremental">
                      Incremental (Preserves User Data)
                    </SelectItem>
                    <SelectItem value="fresh">
                      Fresh Installation
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {deploymentType === 'incremental' 
                    ? "Updates code and migrations only. Preserves all user data and database records."
                    : "Complete fresh installation. Warning: This will reset all data!"}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="include-migrations">Include Database Migrations</Label>
                  <p className="text-sm text-muted-foreground">
                    Run SQL migrations during deployment
                  </p>
                </div>
                <Switch
                  id="include-migrations"
                  checked={includeMigrations}
                  onCheckedChange={setIncludeMigrations}
                  disabled={!awsSettings?.aws_access_key_id}
                />
              </div>

              {deploymentType === 'fresh' && (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-amber-50 dark:bg-amber-950">
                  <div className="space-y-0.5">
                    <Label htmlFor="include-database">Initialize Database</Label>
                    <p className="text-sm text-muted-foreground">
                      Set up fresh database schema
                    </p>
                  </div>
                  <Switch
                    id="include-database"
                    checked={includeDatabase}
                    onCheckedChange={setIncludeDatabase}
                    disabled={!awsSettings?.aws_access_key_id}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-deploy-new"
                  checked={autoDeploy}
                  onCheckedChange={setAutoDeploy}
                  disabled={!awsSettings?.aws_access_key_id}
                />
                <Label htmlFor="auto-deploy-new">Enable Auto Deploy</Label>
              </div>

              <Button
                onClick={handleDeploy}
                disabled={deployMutation.isPending || !awsSettings?.aws_access_key_id}
                className="w-full"
              >
                {deployMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="mr-2 h-4 w-4" />
                )}
                {deploymentType === 'incremental' ? 'Deploy Update' : 'Deploy Fresh Installation'}
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
              {deployments && deployments.length > 0 ? (
                <div className="space-y-4">
                  {deployments.map((deployment) => (
                    <Card key={deployment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
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
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                  : deployment.status === "deploying"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
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

                        {/* Deployment Progress Report */}
                        {deployment.deployment_log && (() => {
                          const log = deployment.deployment_log;
                          
                          // Extract timestamps
                          const startMatch = log.match(/Deployment Creation Started: (.+)/);
                          const completeMatch = log.match(/Deployment completed at: (.+)/);
                          const startTime = startMatch ? new Date(startMatch[1]) : null;
                          const endTime = completeMatch ? new Date(completeMatch[1]) : null;
                          
                          // Calculate duration
                          let duration = '';
                          if (startTime && endTime) {
                            const diff = endTime.getTime() - startTime.getTime();
                            const seconds = Math.floor(diff / 1000);
                            duration = seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
                          }

                          // Extract completed steps
                          const completedSteps = log.split('\n')
                            .filter(line => line.trim().startsWith('✓'))
                            .map(line => line.trim().substring(2));
                          
                          // Extract deployment type and configuration
                          const deployTypeMatch = log.match(/Deployment Type: (.+)/);
                          const deployType = deployTypeMatch ? deployTypeMatch[1] : 'Unknown';
                          
                          return (
                            <div className="mt-3 border-t pt-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                  <Server className="h-4 w-4 text-primary" />
                                  Deployment Progress Report
                                </h4>
                                {duration && (
                                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                    {duration}
                                  </span>
                                )}
                              </div>

                              {/* Timeline */}
                              <div className="grid grid-cols-2 gap-3 text-xs bg-muted/50 p-3 rounded-lg">
                                <div>
                                  <div className="text-muted-foreground mb-1">Started</div>
                                  <div className="font-mono font-medium">
                                    {startTime ? startTime.toLocaleTimeString() : 'N/A'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground mb-1">
                                    {deployment.status === 'running' ? 'Completed' : 'Status'}
                                  </div>
                                  <div className="font-mono font-medium">
                                    {endTime ? endTime.toLocaleTimeString() : 
                                     deployment.status === 'pending' ? 'In Progress...' : 
                                     deployment.status}
                                  </div>
                                </div>
                              </div>

                              {/* Deployment Type */}
                              <div className="text-xs">
                                <span className="text-muted-foreground">Type:</span>{" "}
                                <span className="font-medium">{deployType}</span>
                              </div>

                              {/* Completed Steps */}
                              {completedSteps.length > 0 && (
                                <div className="space-y-2">
                                  <div className="text-xs font-semibold text-green-700 dark:text-green-400 flex items-center gap-1">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Completed ({completedSteps.length} steps)
                                  </div>
                                  <div className="space-y-1 pl-5">
                                    {completedSteps.slice(0, 6).map((step, idx) => (
                                      <div key={idx} className="text-xs flex items-start gap-2 text-muted-foreground">
                                        <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                        <span>{step}</span>
                                      </div>
                                    ))}
                                    {completedSteps.length > 6 && (
                                      <div className="text-xs text-muted-foreground pl-5">
                                        + {completedSteps.length - 6} more completed
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Pending Items */}
                              {deployment.status === 'pending' && (
                                <div className="space-y-2 border-t pt-2">
                                  <div className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Pending
                                  </div>
                                  <div className="space-y-1 pl-5">
                                    <div className="text-xs flex items-start gap-2 text-muted-foreground">
                                      <Circle className="h-3 w-3 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                                      <span>Waiting for instance initialization...</span>
                                    </div>
                                    <div className="text-xs flex items-start gap-2 text-muted-foreground">
                                      <Circle className="h-3 w-3 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                                      <span>Finalizing network configuration</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Full Deployment Log */}
                        {deployment.deployment_log && (
                          <details className="mt-3">
                            <summary className="text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground">
                              View Full Deployment Log
                            </summary>
                            <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-x-auto max-h-96">
                              {deployment.deployment_log}
                            </pre>
                          </details>
                        )}
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
        </TabsContent>

        <TabsContent value="guide" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AWS EC2 Deployment Guide</CardTitle>
              <CardDescription>
                Complete step-by-step guide for deploying your application to AWS EC2
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Prerequisites Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Prerequisites
                </h3>
                <ul className="space-y-2 ml-7 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Active AWS account with administrative access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>AWS Access Key ID and Secret Access Key (from IAM console)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Basic understanding of EC2 instances and regions</span>
                  </li>
                </ul>
              </div>

              <div className="border-t pt-6 space-y-6">
                {/* Step 1 */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      1
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold text-base">Create AWS IAM Credentials</h4>
                      <ol className="space-y-2 text-sm text-muted-foreground ml-4 list-decimal">
                        <li>Log in to AWS Console → Navigate to IAM service</li>
                        <li>Click "Users" in the left sidebar → "Add users"</li>
                        <li>Enter user name (e.g., "ec2-deployment-user")</li>
                        <li>Select "Programmatic access" for access type</li>
                        <li>Attach policy: "AmazonEC2FullAccess"</li>
                        <li>Review and create user</li>
                        <li>Download credentials CSV or copy Access Key ID and Secret Access Key</li>
                      </ol>
                      <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg mt-3">
                        <p className="text-sm text-amber-900 dark:text-amber-100">
                          ⚠️ <strong>Important:</strong> Save your credentials securely. AWS shows the Secret Access Key only once.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="space-y-3 border-t pt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      2
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold text-base">Configure AWS Settings in Platform</h4>
                      <ol className="space-y-2 text-sm text-muted-foreground ml-4 list-decimal">
                        <li>Navigate to "AWS Configuration" tab above</li>
                        <li>Enter your AWS Access Key ID (starts with AKIA...)</li>
                        <li>Enter your AWS Secret Access Key</li>
                        <li>Select default region (Mumbai ap-south-1 is pre-selected)</li>
                        <li>Choose instance type (t2.micro for free tier)</li>
                        <li>Click "Save Configuration"</li>
                      </ol>
                      <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg mt-3">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                          💡 <strong>Tip:</strong> Your credentials are encrypted and stored securely. Use the eye icon to verify entries before saving.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="space-y-3 border-t pt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      3
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold text-base">Understanding Deployment Types</h4>
                      <div className="space-y-3 ml-4">
                        <div className="p-4 border rounded-lg">
                          <h5 className="font-medium text-sm mb-2">✅ Incremental Deployment (Recommended)</h5>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            <li>• Preserves all user data and database records</li>
                            <li>• Updates application code files only</li>
                            <li>• Runs SQL migrations without data loss</li>
                            <li>• Safe for production environments</li>
                            <li>• Zero downtime for users</li>
                          </ul>
                        </div>
                        <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950">
                          <h5 className="font-medium text-sm mb-2 text-red-900 dark:text-red-100">⚠️ Fresh Installation</h5>
                          <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                            <li>• Completely wipes existing data</li>
                            <li>• Sets up clean database</li>
                            <li>• Use only for first-time deployment</li>
                            <li>• Cannot be undone - creates new instance</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="space-y-3 border-t pt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      4
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold text-base">Deploy Your Application</h4>
                      <ol className="space-y-2 text-sm text-muted-foreground ml-4 list-decimal">
                        <li>Go to "Deployments" tab</li>
                        <li>Enter a deployment name (e.g., "production-app")</li>
                        <li>Verify region is correct (ap-south-1 Mumbai)</li>
                        <li>Select deployment type:
                          <ul className="ml-4 mt-1 space-y-1">
                            <li>→ "Incremental" for updates (preserves data)</li>
                            <li>→ "Fresh Installation" for first deployment</li>
                          </ul>
                        </li>
                        <li>Check "Include Database Migrations" (recommended)</li>
                        <li>Enable "Auto Deploy" if you want automatic updates</li>
                        <li>Click "Deploy Update" or "Deploy Fresh Installation"</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="space-y-3 border-t pt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      5
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold text-base">Monitor Deployment Progress</h4>
                      <ol className="space-y-2 text-sm text-muted-foreground ml-4 list-decimal">
                        <li>Deployment status will show as "deploying" → "running"</li>
                        <li>View deployment log by clicking "View Deployment Log"</li>
                        <li>Log shows:
                          <ul className="ml-4 mt-1 space-y-1">
                            <li>→ Instance ID (e.g., i-0123456789abcdef0)</li>
                            <li>→ Public IP address</li>
                            <li>→ Data preservation status</li>
                            <li>→ Migration execution steps</li>
                          </ul>
                        </li>
                        <li>Click on Public IP to access your deployed application</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="space-y-3 border-t pt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      6
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold text-base">Verify Deployment</h4>
                      <ol className="space-y-2 text-sm text-muted-foreground ml-4 list-decimal">
                        <li>Click the Public IP link in deployment card</li>
                        <li>Application should load in new browser tab</li>
                        <li>For incremental deployments, verify:
                          <ul className="ml-4 mt-1 space-y-1">
                            <li>→ Existing user accounts still accessible</li>
                            <li>→ Database records intact (books, profiles, etc.)</li>
                            <li>→ New features/updates are live</li>
                            <li>→ Migrations applied successfully</li>
                          </ul>
                        </li>
                        <li>Check browser console for any errors</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* What Gets Deployed Section */}
                <div className="border-t pt-6 space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Server className="h-5 w-5 text-primary" />
                    What Gets Deployed
                  </h3>
                  <div className="space-y-3 ml-7">
                    <div>
                      <h5 className="font-medium text-sm mb-2">Incremental Deployment Includes:</h5>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>✅ Updated application code files</li>
                        <li>✅ New database migrations (schema changes only)</li>
                        <li>✅ Environment configuration updates</li>
                        <li>✅ Dependencies and package updates</li>
                        <li>✅ Static assets (images, CSS, JS)</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                      <h5 className="font-medium text-sm mb-2 text-green-900 dark:text-green-100">Data Preserved:</h5>
                      <ul className="space-y-1 text-sm text-green-700 dark:text-green-300">
                        <li>✓ User accounts and profiles</li>
                        <li>✓ Books, articles, blog posts</li>
                        <li>✓ Contact submissions and messages</li>
                        <li>✓ Events, awards, FAQs</li>
                        <li>✓ Newsletter subscribers</li>
                        <li>✓ All custom user data</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Troubleshooting Section */}
                <div className="border-t pt-6 space-y-3">
                  <h3 className="text-lg font-semibold">Common Issues & Solutions</h3>
                  <div className="space-y-3 ml-7">
                    <div className="p-4 border rounded-lg">
                      <p className="font-medium text-sm mb-1">❌ "AWS credentials not configured"</p>
                      <p className="text-sm text-muted-foreground">
                        → Go to AWS Configuration tab and enter valid credentials
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="font-medium text-sm mb-1">❌ Deployment stuck in "deploying" status</p>
                      <p className="text-sm text-muted-foreground">
                        → Check deployment log for errors. Verify AWS IAM permissions include EC2 full access
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="font-medium text-sm mb-1">❌ Cannot access deployed application</p>
                      <p className="text-sm text-muted-foreground">
                        → Ensure security group allows HTTP/HTTPS traffic. Check if public IP is accessible
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="font-medium text-sm mb-1">❌ Data lost after deployment</p>
                      <p className="text-sm text-muted-foreground">
                        → You likely used "Fresh Installation" instead of "Incremental". Always use Incremental for updates
                      </p>
                    </div>
                  </div>
                </div>

                {/* Best Practices */}
                <div className="border-t pt-6 space-y-3">
                  <h3 className="text-lg font-semibold">Best Practices</h3>
                  <ul className="space-y-2 ml-7 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Always test deployments in a staging environment first</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Use Incremental deployment for all production updates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Review deployment logs after each deployment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Keep AWS credentials secure - never share or commit to code</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Enable Auto Deploy for continuous deployment from code changes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Monitor instance costs in AWS billing dashboard regularly</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
