import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BackupSecurityCenter as BackupSecurityComponent } from '@/components/admin/BackupSecurityCenter';

const BackupSecurityCenter = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin Dashboard
        </Button>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Backup & Security Center</h1>
        <p className="text-muted-foreground">
          Manage website backups, security settings, and data protection for your entire platform
        </p>
      </div>

      <BackupSecurityComponent />
    </div>
  );
};

export default BackupSecurityCenter;
