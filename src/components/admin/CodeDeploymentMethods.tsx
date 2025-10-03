import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GitBranch, Upload, Workflow, Container, Cloud, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CodeDeploymentMethodsProps {
  ec2Ip?: string;
  instanceId?: string;
  region?: string;
}

export function CodeDeploymentMethods({ ec2Ip, instanceId, region }: CodeDeploymentMethodsProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const gitBareRepoScript = `# On EC2 instance
ssh -i your-key.pem ec2-user@${ec2Ip || 'YOUR_EC2_IP'}

# 1. Create bare repository
sudo mkdir -p /var/repo/app.git
cd /var/repo/app.git
sudo git init --bare
sudo chown -R ec2-user:ec2-user /var/repo/app.git

# 2. Create post-receive hook
cat > /var/repo/app.git/hooks/post-receive << 'EOF'
#!/bin/bash
TARGET="/var/www/html"
GIT_DIR="/var/repo/app.git"
BRANCH="main"

while read oldrev newrev ref
do
  # Check if main branch
  if [[ $ref = refs/heads/"$BRANCH" ]]; then
    echo "Deploying $BRANCH branch to production..."
    
    # Checkout files to web directory
    git --work-tree=$TARGET --git-dir=$GIT_DIR checkout -f
    
    cd $TARGET
    
    # Install dependencies and build
    npm install
    npm run build
    
    # Copy build files
    sudo cp -r dist/* /var/www/html/
    sudo chown -R nginx:nginx /var/www/html
    
    # Restart services
    sudo systemctl restart nginx
    
    echo "Deployment complete!"
  fi
done
EOF

# 3. Make hook executable
sudo chmod +x /var/repo/app.git/hooks/post-receive

# On your local machine
# 4. Add EC2 as remote
git remote add production ec2-user@${ec2Ip || 'YOUR_EC2_IP'}:/var/repo/app.git

# 5. Deploy with git push
git push production main`;

  const rsyncScript = `#!/bin/bash
# deploy.sh - Rsync deployment script

set -e

# Configuration
EC2_USER="ec2-user"
EC2_HOST="${ec2Ip || 'YOUR_EC2_IP'}"
EC2_KEY="path/to/your-key.pem"
LOCAL_BUILD_DIR="./dist"
REMOTE_DIR="/var/www/html"

echo "🚀 Starting deployment to $EC2_HOST..."

# 1. Build application locally
echo "📦 Building application..."
npm install
npm run build

# 2. Rsync files to EC2
echo "📤 Syncing files to EC2..."
rsync -avz --delete \\
  -e "ssh -i $EC2_KEY" \\
  --exclude '.git' \\
  --exclude 'node_modules' \\
  --exclude '.env' \\
  $LOCAL_BUILD_DIR/ \\
  $EC2_USER@$EC2_HOST:$REMOTE_DIR/

# 3. Set permissions and restart services
echo "🔧 Setting permissions and restarting services..."
ssh -i $EC2_KEY $EC2_USER@$EC2_HOST << 'ENDSSH'
  sudo chown -R nginx:nginx /var/www/html
  sudo systemctl restart nginx
ENDSSH

echo "✅ Deployment complete!"

# Optional: Run this script with cron or as a Git hook
# Add to .git/hooks/post-commit:
# #!/bin/bash
# ./deploy.sh`;

  const githubActionsYaml = `name: Deploy to EC2

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to EC2
      env:
        EC2_HOST: ${ec2Ip || 'YOUR_EC2_IP'}
        EC2_USER: ec2-user
        EC2_KEY: \${{ secrets.EC2_SSH_KEY }}
      run: |
        # Setup SSH
        mkdir -p ~/.ssh
        echo "$EC2_KEY" > ~/.ssh/deploy_key.pem
        chmod 600 ~/.ssh/deploy_key.pem
        ssh-keyscan -H $EC2_HOST >> ~/.ssh/known_hosts
        
        # Deploy via rsync
        rsync -avz --delete \\
          -e "ssh -i ~/.ssh/deploy_key.pem" \\
          ./dist/ \\
          $EC2_USER@$EC2_HOST:/var/www/html/
        
        # Restart services
        ssh -i ~/.ssh/deploy_key.pem $EC2_USER@$EC2_HOST \\
          "sudo chown -R nginx:nginx /var/www/html && sudo systemctl restart nginx"
    
    - name: Deployment notification
      if: success()
      run: echo "✅ Deployment successful!"

# Setup Instructions:
# 1. Go to your GitHub repo → Settings → Secrets and variables → Actions
# 2. Add new secret: EC2_SSH_KEY (paste your private key content)
# 3. Push to main branch to trigger deployment`;

  const dockerComposeYaml = `# docker-compose.yml
version: '3.8'

services:
  app:
    image: your-dockerhub-username/your-app:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    volumes:
      - ./data:/app/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./dist:/usr/share/nginx/html:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped

# Deployment script
# deploy-docker.sh
#!/bin/bash
EC2_HOST="${ec2Ip || 'YOUR_EC2_IP'}"
EC2_USER="ec2-user"
EC2_KEY="your-key.pem"

echo "🐳 Building Docker image..."
docker build -t your-app:latest .

echo "📤 Pushing to Docker Hub..."
docker push your-dockerhub-username/your-app:latest

echo "🚀 Deploying to EC2..."
ssh -i $EC2_KEY $EC2_USER@$EC2_HOST << 'ENDSSH'
  cd /var/www/app
  docker-compose pull
  docker-compose up -d
  docker system prune -f
ENDSSH

echo "✅ Deployment complete!"`;

  const ansiblePlaybook = `# deploy.yml - Ansible playbook
---
- name: Deploy application to EC2
  hosts: production
  become: yes
  
  vars:
    app_dir: /var/www/html
    repo_url: https://github.com/your-username/your-repo.git
    branch: main
  
  tasks:
    - name: Install Node.js
      yum:
        name: nodejs
        state: present
    
    - name: Clone/update repository
      git:
        repo: "{{ repo_url }}"
        dest: "{{ app_dir }}"
        version: "{{ branch }}"
        force: yes
    
    - name: Install npm dependencies
      npm:
        path: "{{ app_dir }}"
        production: yes
    
    - name: Build application
      command: npm run build
      args:
        chdir: "{{ app_dir }}"
    
    - name: Set permissions
      file:
        path: "{{ app_dir }}"
        owner: nginx
        group: nginx
        recurse: yes
    
    - name: Restart Nginx
      systemd:
        name: nginx
        state: restarted
        enabled: yes

# inventory.ini
[production]
${ec2Ip || 'YOUR_EC2_IP'} ansible_user=ec2-user ansible_ssh_private_key_file=your-key.pem

# Run deployment
# ansible-playbook -i inventory.ini deploy.yml`;

  const awsCodeDeployYaml = `# appspec.yml - AWS CodeDeploy specification
version: 0.0
os: linux

files:
  - source: /
    destination: /var/www/html

permissions:
  - object: /var/www/html
    owner: nginx
    group: nginx
    mode: 755
    type:
      - directory
      - file

hooks:
  BeforeInstall:
    - location: scripts/install_dependencies.sh
      timeout: 300
      runas: root
  
  AfterInstall:
    - location: scripts/build_app.sh
      timeout: 600
      runas: ec2-user
  
  ApplicationStart:
    - location: scripts/start_server.sh
      timeout: 300
      runas: root

# scripts/install_dependencies.sh
#!/bin/bash
yum install -y nodejs npm

# scripts/build_app.sh
#!/bin/bash
cd /var/www/html
npm install
npm run build

# scripts/start_server.sh
#!/bin/bash
cp -r /var/www/html/dist/* /var/www/html/
chown -R nginx:nginx /var/www/html
systemctl restart nginx

# AWS CLI deployment command
aws deploy create-deployment \\
  --application-name MyApp \\
  --deployment-group-name Production \\
  --s3-location bucket=my-deployments,key=app.zip,bundleType=zip \\
  --region ${region || 'ap-south-1'}`;

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          Choose a deployment method based on your project size, team, and infrastructure needs.
          Each method has its own trade-offs between simplicity, automation, and scalability.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="git" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="git">
            <GitBranch className="h-4 w-4 mr-2" />
            Git Push
          </TabsTrigger>
          <TabsTrigger value="rsync">
            <Upload className="h-4 w-4 mr-2" />
            Rsync
          </TabsTrigger>
          <TabsTrigger value="cicd">
            <Workflow className="h-4 w-4 mr-2" />
            CI/CD
          </TabsTrigger>
          <TabsTrigger value="docker">
            <Container className="h-4 w-4 mr-2" />
            Docker
          </TabsTrigger>
          <TabsTrigger value="aws">
            <Cloud className="h-4 w-4 mr-2" />
            AWS Native
          </TabsTrigger>
        </TabsList>

        {/* Git Bare Repo + Post-Receive Hook */}
        <TabsContent value="git" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Git Bare Repository + Post-Receive Hook
              </CardTitle>
              <CardDescription>
                Simple deployment using git push. Best for small projects and single-server setups.
              </CardDescription>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">Simple Setup</Badge>
                <Badge variant="secondary">Small Projects</Badge>
                <Badge variant="outline">Single Server</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Pros
                </h4>
                <ul className="text-sm space-y-1 ml-6 list-disc text-muted-foreground">
                  <li>Familiar Git workflow</li>
                  <li>Automatic deployment on push</li>
                  <li>No external dependencies</li>
                  <li>Fast for small changes</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Setup Instructions</h4>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto font-mono">
                    {gitBareRepoScript}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(gitBareRepoScript, "Git setup script")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Note:</strong> This method deploys directly to production on every push to main branch.
                  Consider using branches for development and staging environments.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rsync over SSH */}
        <TabsContent value="rsync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Rsync over SSH
              </CardTitle>
              <CardDescription>
                Fast file synchronization. Great for static sites and simple applications.
              </CardDescription>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">Fast Sync</Badge>
                <Badge variant="secondary">Static Sites</Badge>
                <Badge variant="outline">Script-based</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Pros
                </h4>
                <ul className="text-sm space-y-1 ml-6 list-disc text-muted-foreground">
                  <li>Only transfers changed files</li>
                  <li>Very fast for incremental updates</li>
                  <li>Build locally, deploy built files</li>
                  <li>Can be automated with cron or hooks</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Deployment Script</h4>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto font-mono">
                    {rsyncScript}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(rsyncScript, "Rsync script")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Make Script Executable</h4>
                <pre className="bg-muted p-3 rounded text-xs font-mono">
                  chmod +x deploy.sh
                  {'\n'}./deploy.sh
                </pre>
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Tip:</strong> Add this script to your Git hooks or set up a cron job for scheduled deployments.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CI/CD Pipeline */}
        <TabsContent value="cicd" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                CI/CD Pipeline (GitHub Actions)
              </CardTitle>
              <CardDescription>
                Automated testing, building, and deployment. Best for production environments.
              </CardDescription>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">Automated</Badge>
                <Badge variant="secondary">Production Ready</Badge>
                <Badge variant="outline">Testing Included</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Pros
                </h4>
                <ul className="text-sm space-y-1 ml-6 list-disc text-muted-foreground">
                  <li>Run tests before deployment</li>
                  <li>Automated on every commit</li>
                  <li>Deploy to multiple servers</li>
                  <li>Secrets management included</li>
                  <li>Deployment history and rollback</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">GitHub Actions Workflow</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Create <code className="text-xs bg-muted px-1 py-0.5 rounded">.github/workflows/deploy.yml</code>
                </p>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto font-mono">
                    {githubActionsYaml}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(githubActionsYaml, "GitHub Actions workflow")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Security:</strong> Store your EC2 SSH private key in GitHub Secrets, never commit it to your repository.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Docker + Orchestration */}
        <TabsContent value="docker" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Container className="h-5 w-5" />
                Docker + Docker Compose
              </CardTitle>
              <CardDescription>
                Containerized deployment with consistent environments across all stages.
              </CardDescription>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">Containerized</Badge>
                <Badge variant="secondary">Consistent Environments</Badge>
                <Badge variant="outline">Scalable</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Pros
                </h4>
                <ul className="text-sm space-y-1 ml-6 list-disc text-muted-foreground">
                  <li>Identical environments everywhere</li>
                  <li>Easy rollback to previous versions</li>
                  <li>Isolated dependencies</li>
                  <li>Multi-container orchestration</li>
                  <li>Easy to scale horizontally</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Docker Compose Configuration</h4>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto font-mono">
                    {dockerComposeYaml}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(dockerComposeYaml, "Docker configuration")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Prerequisites on EC2</h4>
                <pre className="bg-muted p-3 rounded text-xs font-mono">
                  {`# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AWS Native */}
        <TabsContent value="aws" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                AWS CodeDeploy + CodePipeline
              </CardTitle>
              <CardDescription>
                AWS-native deployment solution with deep integration. Best for large-scale applications.
              </CardDescription>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">AWS Integrated</Badge>
                <Badge variant="secondary">Enterprise Grade</Badge>
                <Badge variant="outline">Auto-Scaling</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Pros
                </h4>
                <ul className="text-sm space-y-1 ml-6 list-disc text-muted-foreground">
                  <li>Integrated with AWS services</li>
                  <li>Blue/green deployments</li>
                  <li>Automatic rollback on failure</li>
                  <li>Deploy to multiple instances</li>
                  <li>Health checks and monitoring</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">AppSpec Configuration</h4>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto font-mono">
                    {awsCodeDeployYaml}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(awsCodeDeployYaml, "AWS CodeDeploy configuration")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Setup Steps</h4>
                <ol className="text-sm space-y-2 ml-6 list-decimal text-muted-foreground">
                  <li>Create CodeDeploy application in AWS Console</li>
                  <li>Create deployment group targeting your EC2 instance</li>
                  <li>Install CodeDeploy agent on EC2</li>
                  <li>Create S3 bucket for deployment artifacts</li>
                  <li>Configure IAM roles for CodeDeploy</li>
                  <li>Upload your code as a zip file to S3</li>
                  <li>Trigger deployment via AWS CLI or Console</li>
                </ol>
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Note:</strong> CodeDeploy requires additional IAM setup and the CodeDeploy agent installed on your EC2 instance.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
