import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function TestEmailSender() {
  const [email, setEmail] = useState("");
  const [type, setType] = useState("signup");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const testEmail = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter an email address' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-auth-email', {
        body: {
          email,
          type,
          token_hash: 'test-token-hash-123',
          token: 'test-token-456',
          redirect_to: `${window.location.origin}/dashboard`,
          site_url: window.location.origin
        }
      });

      if (error) {
        throw error;
      }

      setMessage({ 
        type: 'success', 
        text: `Test ${type} email sent successfully to ${email}!` 
      });
      console.log('Email sent:', data);
    } catch (error: any) {
      console.error('Error sending test email:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to send test email' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Test Email System
        </CardTitle>
        <CardDescription>
          Test the email functionality to ensure everything is working
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert className={message.type === 'error' ? 'border-destructive/50 text-destructive' : 'border-green-500/50 text-green-700'}>
            {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="test-email">Email Address</Label>
          <Input
            id="test-email"
            type="email"
            placeholder="test@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-type">Email Type</Label>
          <Select value={type} onValueChange={setType} disabled={loading}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="signup">Signup Confirmation</SelectItem>
              <SelectItem value="recovery">Password Recovery</SelectItem>
              <SelectItem value="magic_link">Magic Link</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={testEmail} className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send Test Email
        </Button>
      </CardContent>
    </Card>
  );
}