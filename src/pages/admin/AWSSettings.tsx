import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Eye, EyeOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";

const awsRegions = [
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-east-2", label: "US East (Ohio)" },
  { value: "us-west-1", label: "US West (N. California)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "eu-west-1", label: "EU (Ireland)" },
  { value: "eu-central-1", label: "EU (Frankfurt)" },
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

export default function AWSSettings() {
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    aws_access_key_id: "",
    aws_secret_access_key: "",
    default_region: "us-east-1",
    instance_type: "t2.micro",
    key_pair_name: "",
    security_group_id: "",
    subnet_id: "",
    ami_id: "",
    auto_deploy_enabled: false,
  });

  const { data: settings, isLoading } = useQuery({
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
    if (settings) {
      setFormData({
        aws_access_key_id: settings.aws_access_key_id || "",
        aws_secret_access_key: settings.aws_secret_access_key || "",
        default_region: settings.default_region || "us-east-1",
        instance_type: settings.instance_type || "t2.micro",
        key_pair_name: settings.key_pair_name || "",
        security_group_id: settings.security_group_id || "",
        subnet_id: settings.subnet_id || "",
        ami_id: settings.ami_id || "",
        auto_deploy_enabled: settings.auto_deploy_enabled || false,
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Validate data
      try {
        settingsSchema.parse(data);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(error.errors[0].message);
        }
        throw error;
      }

      if (settings?.id) {
        const { error } = await supabase
          .from("aws_settings")
          .update(data)
          .eq("id", settings.id);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">AWS Settings</h1>
        <p className="text-muted-foreground">
          Configure AWS credentials and deployment settings
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
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
                  value={formData.aws_access_key_id}
                  onChange={(e) =>
                    setFormData({ ...formData, aws_access_key_id: e.target.value })
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
                  value={formData.aws_secret_access_key}
                  onChange={(e) =>
                    setFormData({ ...formData, aws_secret_access_key: e.target.value })
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

        <Card className="mb-6">
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
                  value={formData.default_region}
                  onValueChange={(value) =>
                    setFormData({ ...formData, default_region: value })
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
                  value={formData.instance_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, instance_type: value })
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
                value={formData.key_pair_name}
                onChange={(e) =>
                  setFormData({ ...formData, key_pair_name: e.target.value })
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
                value={formData.security_group_id}
                onChange={(e) =>
                  setFormData({ ...formData, security_group_id: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subnet">Subnet ID (Optional)</Label>
              <Input
                id="subnet"
                placeholder="subnet-0123456789abcdef0"
                value={formData.subnet_id}
                onChange={(e) =>
                  setFormData({ ...formData, subnet_id: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ami">AMI ID (Optional)</Label>
              <Input
                id="ami"
                placeholder="ami-0123456789abcdef0"
                value={formData.ami_id}
                onChange={(e) =>
                  setFormData({ ...formData, ami_id: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use default Amazon Linux 2 AMI
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Deployment Options</CardTitle>
            <CardDescription>
              Configure automatic deployment behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-deploy">Enable Auto Deploy</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically deploy on code changes
                </p>
              </div>
              <Switch
                id="auto-deploy"
                checked={formData.auto_deploy_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, auto_deploy_enabled: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
