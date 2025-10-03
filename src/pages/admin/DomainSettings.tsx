import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Save, 
  Globe, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Domain {
  id: string;
  domain: string;
  user_id: string;
  user_name: string;
  verified: boolean;
  ssl_enabled: boolean;
  dns_configured: boolean;
  created_at: string;
  last_checked: string;
  status: 'active' | 'pending' | 'failed';
}

export default function DomainSettings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);

  const [domainSettings, setDomainSettings] = useState({
    enableCustomDomains: true,
    autoSSL: true,
    subdomainSupport: true,
    maxDomainsPerUser: 1,
    requireVerification: true,
    allowedTLDs: ['com', 'net', 'org', 'io', 'co'],
    blockedDomains: ['spam.com', 'test.local'],
    dnsProvider: 'cloudflare',
    autoRenewalSSL: true,
    forceHTTPS: true,
  });

  const [customDomains, setCustomDomains] = useState<Domain[]>([
    {
      id: '1',
      domain: 'johnsmith.com',
      user_id: '123',
      user_name: 'John Smith',
      verified: true,
      ssl_enabled: true,
      dns_configured: true,
      created_at: '2024-01-15T10:00:00Z',
      last_checked: '2024-01-20T14:30:00Z',
      status: 'active'
    },
    {
      id: '2',
      domain: 'maryjane.author',
      user_id: '124',
      user_name: 'Mary Jane',
      verified: false,
      ssl_enabled: false,
      dns_configured: false,
      created_at: '2024-01-18T15:30:00Z',
      last_checked: '2024-01-20T14:30:00Z',
      status: 'pending'
    },
    {
      id: '3',
      domain: 'brokensite.com',
      user_id: '125',
      user_name: 'Test User',
      verified: false,
      ssl_enabled: false,
      dns_configured: false,
      created_at: '2024-01-10T09:15:00Z',
      last_checked: '2024-01-20T14:30:00Z',
      status: 'failed'
    }
  ]);

  const handleSaveDomainSettings = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Success",
        description: "Domain settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save domain settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCheckDomain = async (domainId: string) => {
    setChecking(domainId);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate random verification result
      const isVerified = Math.random() > 0.5;
      setCustomDomains(prev => prev.map(domain => 
        domain.id === domainId 
          ? { 
              ...domain, 
              verified: isVerified,
              dns_configured: isVerified,
              ssl_enabled: isVerified,
              status: isVerified ? 'active' : 'failed',
              last_checked: new Date().toISOString()
            }
          : domain
      ));
      
      toast({
        title: isVerified ? "Domain Verified" : "Verification Failed",
        description: isVerified 
          ? "Domain is properly configured and SSL is active"
          : "Please check DNS settings and try again",
        variant: isVerified ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Check Failed",
        description: "Could not verify domain status",
        variant: "destructive",
      });
    } finally {
      setChecking(null);
    }
  };

  const handleDeleteDomain = (domainId: string) => {
    if (window.confirm('Are you sure you want to delete this domain? This action cannot be undone.')) {
      setCustomDomains(prev => prev.filter(d => d.id !== domainId));
      toast({
        title: "Domain Deleted",
        description: "Custom domain has been removed",
      });
    }
  };

  const getStatusIcon = (domain: Domain) => {
    if (domain.status === 'active' && domain.verified) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (domain.status === 'failed') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (domain: Domain) => {
    if (domain.status === 'active' && domain.verified) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    } else if (domain.status === 'failed') {
      return <Badge variant="destructive">Failed</Badge>;
    } else {
      return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="h-8 w-8" />
            Domain Settings
          </h1>
          <p className="text-muted-foreground">Manage custom domain settings and SSL certificates</p>
        </div>
        <Button onClick={handleSaveDomainSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">Domain Settings</TabsTrigger>
          <TabsTrigger value="domains">Active Domains</TabsTrigger>
          <TabsTrigger value="dns">DNS Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          {/* Domain Features */}
          <Card>
            <CardHeader>
              <CardTitle>Domain Features</CardTitle>
              <CardDescription>Configure custom domain functionality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableCustomDomains"
                      checked={domainSettings.enableCustomDomains}
                      onCheckedChange={(checked) => setDomainSettings(prev => ({ ...prev, enableCustomDomains: checked }))}
                    />
                    <Label htmlFor="enableCustomDomains">Enable custom domains</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoSSL"
                      checked={domainSettings.autoSSL}
                      onCheckedChange={(checked) => setDomainSettings(prev => ({ ...prev, autoSSL: checked }))}
                    />
                    <Label htmlFor="autoSSL">Automatic SSL certificates</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="subdomainSupport"
                      checked={domainSettings.subdomainSupport}
                      onCheckedChange={(checked) => setDomainSettings(prev => ({ ...prev, subdomainSupport: checked }))}
                    />
                    <Label htmlFor="subdomainSupport">Support subdomains</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="forceHTTPS"
                      checked={domainSettings.forceHTTPS}
                      onCheckedChange={(checked) => setDomainSettings(prev => ({ ...prev, forceHTTPS: checked }))}
                    />
                    <Label htmlFor="forceHTTPS">Force HTTPS redirect</Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requireVerification"
                      checked={domainSettings.requireVerification}
                      onCheckedChange={(checked) => setDomainSettings(prev => ({ ...prev, requireVerification: checked }))}
                    />
                    <Label htmlFor="requireVerification">Require domain verification</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoRenewalSSL"
                      checked={domainSettings.autoRenewalSSL}
                      onCheckedChange={(checked) => setDomainSettings(prev => ({ ...prev, autoRenewalSSL: checked }))}
                    />
                    <Label htmlFor="autoRenewalSSL">Auto-renew SSL certificates</Label>
                  </div>

                  <div>
                    <Label htmlFor="maxDomainsPerUser">Max domains per user</Label>
                    <Input
                      id="maxDomainsPerUser"
                      type="number"
                      value={domainSettings.maxDomainsPerUser}
                      onChange={(e) => setDomainSettings(prev => ({ ...prev, maxDomainsPerUser: parseInt(e.target.value) || 1 }))}
                      min="1"
                      max="10"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dnsProvider">DNS Provider</Label>
                    <select
                      id="dnsProvider"
                      value={domainSettings.dnsProvider}
                      onChange={(e) => setDomainSettings(prev => ({ ...prev, dnsProvider: e.target.value }))}
                      className="w-full p-2 border rounded-md mt-1"
                    >
                      <option value="cloudflare">Cloudflare</option>
                      <option value="route53">AWS Route 53</option>
                      <option value="namecheap">Namecheap</option>
                      <option value="manual">Manual Configuration</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Domain Restrictions */}
          <Card>
            <CardHeader>
              <CardTitle>Domain Restrictions</CardTitle>
              <CardDescription>Control which domains can be used</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="allowedTLDs">Allowed Top-Level Domains</Label>
                <Input
                  id="allowedTLDs"
                  value={domainSettings.allowedTLDs.join(', ')}
                  onChange={(e) => setDomainSettings(prev => ({ 
                    ...prev, 
                    allowedTLDs: e.target.value.split(',').map(tld => tld.trim()).filter(Boolean)
                  }))}
                  placeholder="com, net, org, io"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Comma-separated list of allowed TLDs
                </p>
              </div>

              <div>
                <Label htmlFor="blockedDomains">Blocked Domains</Label>
                <Input
                  id="blockedDomains"
                  value={domainSettings.blockedDomains.join(', ')}
                  onChange={(e) => setDomainSettings(prev => ({ 
                    ...prev, 
                    blockedDomains: e.target.value.split(',').map(domain => domain.trim()).filter(Boolean)
                  }))}
                  placeholder="spam.com, malicious.site"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Comma-separated list of blocked domains
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Custom Domains</CardTitle>
              <CardDescription>Manage all custom domains across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customDomains.length === 0 ? (
                  <div className="text-center py-8">
                    <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No custom domains</h3>
                    <p className="text-muted-foreground">Users haven't added any custom domains yet.</p>
                  </div>
                ) : (
                  customDomains.map((domain) => (
                    <Card key={domain.id} className="border-l-4 border-l-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(domain)}
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{domain.domain}</h4>
                                {getStatusBadge(domain)}
                                <Button variant="ghost" size="sm" asChild>
                                  <a 
                                    href={`https://${domain.domain}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </Button>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Owner: {domain.user_name} • Added {new Date(domain.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCheckDomain(domain.id)}
                              disabled={checking === domain.id}
                            >
                              {checking === domain.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteDomain(domain.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-2 md:grid-cols-3 text-sm">
                          <div className="flex items-center gap-2">
                            {domain.dns_configured ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-500" />
                            )}
                            <span>DNS {domain.dns_configured ? 'Configured' : 'Not Configured'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {domain.ssl_enabled ? (
                              <Shield className="h-3 w-3 text-green-500" />
                            ) : (
                              <Shield className="h-3 w-3 text-red-500" />
                            )}
                            <span>SSL {domain.ssl_enabled ? 'Active' : 'Inactive'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {domain.verified ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-yellow-500" />
                            )}
                            <span>{domain.verified ? 'Verified' : 'Pending Verification'}</span>
                          </div>
                        </div>

                        <div className="mt-2 text-xs text-muted-foreground">
                          Last checked: {new Date(domain.last_checked).toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>DNS Configuration Guide</CardTitle>
              <CardDescription>Instructions for users to configure their domains</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Required DNS Records</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="grid grid-cols-3 gap-4 font-mono bg-blue-100 p-2 rounded">
                    <div><strong>Type</strong></div>
                    <div><strong>Name</strong></div>
                    <div><strong>Value</strong></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 font-mono">
                    <div>A</div>
                    <div>@</div>
                    <div>185.158.133.1</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 font-mono">
                    <div>A</div>
                    <div>www</div>
                    <div>185.158.133.1</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 font-mono">
                    <div>CNAME</div>
                    <div>*</div>
                    <div>proxy.authorpage.com</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">SSL Certificate Information</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• SSL certificates are automatically provisioned via Let's Encrypt</li>
                  <li>• Certificates auto-renew 30 days before expiration</li>
                  <li>• HTTPS redirect is enforced for all custom domains</li>
                  <li>• Domain validation typically takes 5-10 minutes</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Verification Process</h4>
                <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                  <li>User adds custom domain in their settings</li>
                  <li>System provides DNS configuration instructions</li>
                  <li>User updates DNS records with their registrar</li>
                  <li>System automatically verifies DNS configuration</li>
                  <li>SSL certificate is provisioned and domain goes live</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting</CardTitle>
              <CardDescription>Common issues and solutions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium mb-2">Domain not verifying?</h5>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Check that DNS records are correctly configured</li>
                    <li>Wait for DNS propagation (up to 48 hours)</li>
                    <li>Ensure no conflicting records exist</li>
                    <li>Verify domain ownership with registrar</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-2">SSL certificate issues?</h5>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Domain must be verified before SSL provisioning</li>
                    <li>Check for CAA records blocking Let's Encrypt</li>
                    <li>Ensure port 80 and 443 are accessible</li>
                    <li>Contact support if issues persist after 24 hours</li>
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