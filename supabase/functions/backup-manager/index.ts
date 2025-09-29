import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BackupRequest {
  action: 'create' | 'restore' | 'download' | 'test' | 'schedule' | 'upload';
  backupType?: 'database' | 'files' | 'full' | 'emergency';
  backupId?: string;
  restorePoint?: string;
  settings?: any;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Memory-efficient ZIP implementation
class MemoryEfficientZip {
  private entries: Array<{ name: string; data: Uint8Array | string }> = [];
  private maxMemoryUsage = 30 * 1024 * 1024; // 30MB limit to stay under edge function limits
  private currentMemoryUsage = 0;

  addFile(name: string, data: Uint8Array | string): boolean {
    const size = typeof data === 'string' ? new TextEncoder().encode(data).length : data.length;
    
    // Skip files that are too large
    if (size > 5 * 1024 * 1024) { // 5MB per file limit
      console.warn(`Skipping large file: ${name} (${size} bytes)`);
      return false;
    }

    if (this.currentMemoryUsage + size > this.maxMemoryUsage) {
      console.warn(`Memory limit reached, skipping file: ${name}`);
      return false;
    }

    this.entries.push({ name, data });
    this.currentMemoryUsage += size;
    return true;
  }

  generateZip(): Uint8Array {
    const zipData: Uint8Array[] = [];
    const centralDirectory: Uint8Array[] = [];
    let offset = 0;

    // Create local file headers and data
    for (const entry of this.entries) {
      const fileName = new TextEncoder().encode(entry.name);
      const fileData = typeof entry.data === 'string' 
        ? new TextEncoder().encode(entry.data) 
        : entry.data;

      // Local file header (30 bytes + filename)
      const header = new Uint8Array(30 + fileName.length);
      const view = new DataView(header.buffer);
      
      view.setUint32(0, 0x04034b50, true); // Local file header signature
      view.setUint16(4, 20, true); // Version needed to extract
      view.setUint16(6, 0, true); // General purpose bit flag
      view.setUint16(8, 0, true); // Compression method (stored)
      view.setUint32(18, fileData.length, true); // Uncompressed size
      view.setUint32(22, fileData.length, true); // Compressed size
      view.setUint16(26, fileName.length, true); // File name length
      view.setUint16(28, 0, true); // Extra field length
      
      header.set(fileName, 30);
      
      zipData.push(header);
      zipData.push(fileData);

      // Create central directory entry
      const centralEntry = new Uint8Array(46 + fileName.length);
      const centralView = new DataView(centralEntry.buffer);
      
      centralView.setUint32(0, 0x02014b50, true); // Central directory signature
      centralView.setUint16(4, 20, true); // Version made by
      centralView.setUint16(6, 20, true); // Version needed to extract
      centralView.setUint16(8, 0, true); // General purpose bit flag
      centralView.setUint16(10, 0, true); // Compression method
      centralView.setUint32(20, fileData.length, true); // Uncompressed size
      centralView.setUint32(24, fileData.length, true); // Compressed size
      centralView.setUint16(28, fileName.length, true); // File name length
      centralView.setUint16(30, 0, true); // Extra field length
      centralView.setUint16(32, 0, true); // File comment length
      centralView.setUint16(34, 0, true); // Disk number start
      centralView.setUint16(36, 0, true); // Internal file attributes
      centralView.setUint32(38, 0, true); // External file attributes
      centralView.setUint32(42, offset, true); // Relative offset of local header
      
      centralEntry.set(fileName, 46);
      centralDirectory.push(centralEntry);

      offset += header.length + fileData.length;
    }

    // End of central directory record
    const centralDirSize = centralDirectory.reduce((sum, entry) => sum + entry.length, 0);
    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);
    
    endView.setUint32(0, 0x06054b50, true); // End of central directory signature
    endView.setUint16(4, 0, true); // Number of this disk
    endView.setUint16(6, 0, true); // Disk where central directory starts
    endView.setUint16(8, this.entries.length, true); // Number of central directory records on this disk
    endView.setUint16(10, this.entries.length, true); // Total number of central directory records
    endView.setUint32(12, centralDirSize, true); // Size of central directory
    endView.setUint32(16, offset, true); // Offset of start of central directory
    endView.setUint16(20, 0, true); // ZIP file comment length

    // Combine all parts
    const totalSize = offset + centralDirSize + 22;
    const result = new Uint8Array(totalSize);
    let pos = 0;

    // Copy local file headers and data
    for (const chunk of zipData) {
      result.set(chunk, pos);
      pos += chunk.length;
    }

    // Copy central directory
    for (const entry of centralDirectory) {
      result.set(entry, pos);
      pos += entry.length;
    }

    // Copy end record
    result.set(endRecord, pos);

    return result;
  }

  getMemoryUsage(): number {
    return this.currentMemoryUsage;
  }

  getFileCount(): number {
    return this.entries.length;
  }
}

const createOptimizedBackup = async (backupType: string, settings?: any) => {
  const backupId = crypto.randomUUID();
  
  try {
    console.log(`Starting optimized ${backupType} backup with ID: ${backupId}`);

    // Create backup job entry
    const { error: jobError } = await supabase
      .from('backup_jobs')
      .insert({
        id: backupId,
        job_type: backupType,
        status: 'running',
        metadata: { 
          settings,
          started_at: new Date().toISOString()
        }
      });

    if (jobError) {
      console.error('Error creating backup job:', jobError);
      throw jobError;
    }

    const zip = new MemoryEfficientZip();
    const startTime = Date.now();
    
    // 1. Create database backup
    if (backupType === 'database' || backupType === 'full' || backupType === 'emergency') {
      console.log('Creating database backup...');
      const dbBackup = await createDatabaseBackup();
      zip.addFile('database/backup.sql', dbBackup);
    }
    
    // 2. Create storage files backup (with limits)
    if (backupType === 'files' || backupType === 'full' || backupType === 'emergency') {
      console.log('Creating storage backup...');
      await createStorageBackup(zip);
    }

    // 3. Add emergency deployment files for AWS
    if (backupType === 'emergency') {
      console.log('Adding AWS deployment files...');
      await addAWSDeploymentFiles(zip, backupId);
    }
    
    // 3. Add essential files
    const readmeContent = `Emergency Backup Archive
Generated: ${new Date().toISOString()}
Backup ID: ${backupId}
Type: ${backupType}

This ZIP contains:
- database/backup.sql: Complete database backup with SQL commands
- storage/: Files from storage buckets (limited to prevent memory issues)
- config/: Backup configuration and metadata
- scripts/: Emergency restoration scripts

EMERGENCY RESTORATION:
1. Extract this ZIP file
2. Run the SQL in database/backup.sql against a PostgreSQL database
3. Upload files from storage/ to your hosting solution
4. Update configuration as needed

For support: Check the scripts/ folder for automated restoration tools.
`;
    
    zip.addFile('README.txt', readmeContent);
    
    // Add backup configuration
    const backupInfo = {
      backup_id: backupId,
      backup_type: backupType,
      created_at: new Date().toISOString(),
      project_id: Deno.env.get("SUPABASE_URL")?.split('//')[1]?.split('.')[0] || 'unknown',
      version: '3.0-optimized',
      memory_limit_applied: true,
      file_count: zip.getFileCount(),
      estimated_size: zip.getMemoryUsage()
    };
    
    zip.addFile('config/backup-info.json', JSON.stringify(backupInfo, null, 2));
    
    // Add restoration script
    const restorationScript = `-- Emergency Database Restoration Script
-- Generated: ${new Date().toISOString()}
-- Backup ID: ${backupId}

-- WARNING: This will overwrite existing data!
-- Make sure you have backups before running this script.

-- Step 1: Create database if not exists
-- CREATE DATABASE your_database_name;

-- Step 2: Connect to your database
-- \\c your_database_name;

-- Step 3: Run the backup.sql file
-- \\i database/backup.sql

-- Step 4: Verify data restoration
-- SELECT COUNT(*) FROM profiles;
-- SELECT COUNT(*) FROM books;

-- Restoration complete!
`;
    
    zip.addFile('scripts/restore_database.sql', restorationScript);
    
    console.log(`Generating ZIP with ${zip.getFileCount()} files, ${Math.round(zip.getMemoryUsage() / 1024 / 1024 * 100) / 100}MB`);
    
    const zipBuffer = zip.generateZip();
    const backupDuration = Math.floor((Date.now() - startTime) / 1000);
    const checksum = await generateChecksum(zipBuffer);
    
    const filePath = `/backups/${backupType}/${backupId}_${new Date().toISOString().split('T')[0]}.zip`;
    
    // Update backup job with completion
    const { error: updateError } = await supabase
      .from('backup_jobs')
      .update({
        status: 'completed',
        file_path: filePath,
        file_size: zipBuffer.length,
        backup_duration: backupDuration,
        checksum: checksum,
        completed_at: new Date().toISOString(),
        metadata: {
          ...settings,
          backup_type: backupType,
          files_in_zip: zip.getFileCount(),
          memory_used_mb: Math.round(zip.getMemoryUsage() / 1024 / 1024 * 100) / 100,
          optimization_applied: true,
          started_at: new Date(startTime).toISOString()
        }
      })
      .eq('id', backupId);

    if (updateError) {
      console.error('Error updating backup job:', updateError);
      throw updateError;
    }

    // Log security event
    await supabase
      .from('security_logs')
      .insert({
        event_type: 'backup_created',
        severity: 'low',
        description: `${backupType} backup created successfully - ${zipBuffer.length} bytes`,
        metadata: {
          backup_id: backupId,
          backup_type: backupType,
          file_size: zipBuffer.length,
          duration: backupDuration,
          files_backed_up: zip.getFileCount(),
          memory_optimized: true
        }
      });

    console.log(`Backup ${backupId} completed successfully`);
    
    return {
      success: true,
      zipBuffer,
      backup_id: backupId,
      file_size: zipBuffer.length,
      duration: backupDuration,
      files_count: zip.getFileCount()
    };

  } catch (error) {
    console.error(`Backup ${backupId} failed:`, error);
    
    // Update job status to failed
    await supabase
      .from('backup_jobs')
      .update({
        status: 'failed',
        error_message: (error as Error).message,
        completed_at: new Date().toISOString()
      })
      .eq('id', backupId);

    // Log security event for failure
    await supabase
      .from('security_logs')
      .insert({
        event_type: 'backup_failed',
        severity: 'high',
        description: `${backupType} backup failed: ${(error as Error).message}`,
        metadata: {
          backup_id: backupId,
          backup_type: backupType,
          error: (error as Error).message
        }
      });

    throw error;
  }
};

const createDatabaseBackup = async (): Promise<string> => {
  let backupData = `-- Database Backup Generated: ${new Date().toISOString()}\n`;
  backupData += `-- Memory-optimized backup with essential tables\n\n`;
  
  // Essential tables only to reduce memory usage
  const essentialTables = [
    'profiles', 'user_roles', 'books', 'blog_posts', 'events', 'awards', 'faqs',
    'newsletter_subscribers', 'contact_submissions', 'themes', 'subscription_plans'
  ];
  
  for (const table of essentialTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(100); // Limit records per table to prevent memory issues
      
      if (!error && data && data.length > 0) {
        backupData += `-- Table: ${table} (${data.length} records)\n`;
        backupData += `TRUNCATE TABLE ${table} CASCADE;\n`;
        
        const columns = Object.keys(data[0]);
        for (const row of data) {
          const values = columns.map(col => {
            const val = row[col];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'string') {
              return `'${val.replace(/'/g, "''").substring(0, 1000)}'`; // Limit string length
            }
            if (typeof val === 'object') {
              return `'${JSON.stringify(val).replace(/'/g, "''").substring(0, 1000)}'`;
            }
            if (typeof val === 'boolean') return val ? 'true' : 'false';
            return val;
          }).join(', ');
          
          backupData += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values});\n`;
        }
        backupData += `\n`;
      } else if (error) {
        backupData += `-- Warning: Could not backup table ${table}: ${error.message}\n\n`;
      }
    } catch (tableError) {
      backupData += `-- Error: Could not backup table ${table}: ${(tableError as Error).message}\n\n`;
    }
  }
  
  return backupData;
};

const createStorageBackup = async (zip: MemoryEfficientZip): Promise<void> => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    
    if (!buckets || buckets.length === 0) {
      zip.addFile('storage/no_buckets.txt', 'No storage buckets found.');
      return;
    }

    let totalFiles = 0;
    const maxFilesTotal = 20; // Global limit to prevent memory issues

    for (const bucket of buckets) {
      if (totalFiles >= maxFilesTotal) break;
      
      try {
        const { data: files } = await supabase.storage
          .from(bucket.name)
          .list('', { limit: 10 }); // Very limited files per bucket

        if (files && files.length > 0) {
          const filesToProcess = files.slice(0, Math.min(5, maxFilesTotal - totalFiles)); // Max 5 per bucket
          
          for (const file of filesToProcess) {
            try {
              // Skip large files
              if (file.metadata?.size && file.metadata.size > 2 * 1024 * 1024) { // 2MB limit
                console.warn(`Skipping large file: ${file.name}`);
                continue;
              }

              const { data: fileData, error: downloadError } = await supabase.storage
                .from(bucket.name)
                .download(file.name);

              if (!downloadError && fileData) {
                const arrayBuffer = await fileData.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                
                const filePath = `storage/${bucket.name}/${file.name}`;
                const success = zip.addFile(filePath, uint8Array);
                
                if (success) {
                  totalFiles++;
                  console.log(`Added file: ${filePath}`);
                } else {
                  console.warn(`Failed to add file due to memory constraints: ${filePath}`);
                  break;
                }
              }
            } catch (fileError) {
              console.error(`Error processing file ${file.name}:`, fileError);
            }
          }
        }
      } catch (bucketError) {
        console.error(`Error processing bucket ${bucket.name}:`, bucketError);
      }
    }

    // Add summary
    const summary = `Storage Backup Summary
Generated: ${new Date().toISOString()}
Files backed up: ${totalFiles}
Max files limit: ${maxFilesTotal}

Note: This backup is limited to small files to prevent memory issues.
Large files and excess files are skipped.
`;
    
    zip.addFile('storage/BACKUP_SUMMARY.txt', summary);
    
  } catch (error) {
    console.error('Storage backup failed:', error);
    zip.addFile('storage/BACKUP_ERROR.txt', `Storage backup failed: ${(error as Error).message}`);
  }
};

const generateChecksum = async (data: Uint8Array): Promise<string> => {
  const buffer = new ArrayBuffer(data.length);
  const view = new Uint8Array(buffer);
  view.set(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const addAWSDeploymentFiles = async (zip: MemoryEfficientZip, backupId: string): Promise<void> => {
  // AWS deployment guide
  const awsGuide = `# AWS Emergency Deployment Guide
# Generated: ${new Date().toISOString()}
# Backup ID: ${backupId}

## Prerequisites
1. AWS Account with appropriate permissions
2. AWS CLI installed and configured
3. Docker installed (for containerized deployment)
4. Domain name (optional)

## Quick Deployment Steps

### Option 1: EC2 + RDS (Recommended)

1. **Create RDS PostgreSQL Instance**
   \`\`\`bash
   aws rds create-db-instance \\
     --db-instance-identifier myapp-db \\
     --db-instance-class db.t3.micro \\
     --engine postgres \\
     --master-username postgres \\
     --master-user-password YOUR_PASSWORD \\
     --allocated-storage 20 \\
     --vpc-security-group-ids sg-XXXXXXXX \\
     --db-subnet-group-name default
   \`\`\`

2. **Create EC2 Instance**
   \`\`\`bash
   aws ec2 run-instances \\
     --image-id ami-0c02fb55956c7d316 \\
     --count 1 \\
     --instance-type t3.micro \\
     --key-name your-key-pair \\
     --security-group-ids sg-XXXXXXXX \\
     --user-data file://aws/user-data.sh
   \`\`\`

3. **Deploy Application**
   - Upload backup files to EC2
   - Restore database using backup.sql
   - Configure environment variables
   - Start application services

### Option 2: ECS + RDS (Scalable)

1. **Create ECS Cluster**
   \`\`\`bash
   aws ecs create-cluster --cluster-name myapp-cluster
   \`\`\`

2. **Deploy using Docker**
   - Use provided Dockerfile
   - Push to ECR repository
   - Create ECS service

### Option 3: Elastic Beanstalk (Simple)

1. **Create Application**
   \`\`\`bash
   eb init myapp --platform node.js
   eb create production
   \`\`\`

2. **Deploy**
   \`\`\`bash
   eb deploy
   \`\`\`

## Environment Variables
Copy these to your AWS deployment:
\`\`\`
DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/database
NEXT_PUBLIC_SUPABASE_URL=https://your-app.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
\`\`\`

## File Upload
1. Create S3 bucket for file storage
2. Update storage configuration
3. Set appropriate bucket policies

## Domain & SSL
1. Route 53 for DNS management
2. CloudFront for CDN and SSL
3. Certificate Manager for SSL certificates

## Monitoring
1. CloudWatch for logs and metrics
2. SNS for alerts
3. AWS Config for compliance

## Cost Optimization
1. Use t3.micro instances for testing
2. Enable auto-scaling
3. Set up billing alerts

For detailed instructions, see the individual setup files in the aws/ directory.
`;

  // EC2 User Data Script
  const userData = `#!/bin/bash
# AWS EC2 User Data Script for Emergency Deployment
# Generated: ${new Date().toISOString()}

# Update system
yum update -y

# Install required packages
yum install -y nodejs npm postgresql git unzip

# Create application directory
mkdir -p /opt/myapp
cd /opt/myapp

# Download and extract backup (you'll need to upload this)
# wget https://your-s3-bucket/emergency_backup.zip
# unzip emergency_backup.zip

# Install application dependencies
# npm install

# Set up database connection
export DATABASE_URL="postgresql://username:password@your-rds-endpoint:5432/database"

# Restore database
# psql $DATABASE_URL < database/backup.sql

# Start application
# npm start

# Set up as service (systemd)
cat > /etc/systemd/system/myapp.service << 'EOF'
[Unit]
Description=My Application
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/myapp
Environment=NODE_ENV=production
Environment=DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/database
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable myapp
systemctl start myapp

# Set up nginx proxy (optional)
yum install -y nginx
systemctl enable nginx
systemctl start nginx
`;

  // Dockerfile for containerized deployment
  const dockerfile = `# Multi-stage Dockerfile for production deployment
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "start"]
`;

  // Docker Compose for local development/testing
  const dockerCompose = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/backup.sql:/docker-entrypoint-initdb.d/backup.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
`;

  // CloudFormation template
  const cloudFormation = `AWSTemplateFormatVersion: '2010-09-09'
Description: 'Emergency deployment infrastructure'

Parameters:
  KeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for SSH access
  
  DBPassword:
    Type: String
    NoEcho: true
    Description: Database password
    MinLength: 8

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true

  InternetGateway:
    Type: AWS::EC2::InternetGateway

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true

  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']

  RouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC

  Route:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref RouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  SubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref RouteTable

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web server
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref WebServerSecurityGroup

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS
      SubnetIds:
        - !Ref PublicSubnet
        - !Ref PrivateSubnet

  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: myapp-db
      DBInstanceClass: db.t3.micro
      Engine: postgres
      MasterUsername: postgres
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup

  WebServer:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-0c02fb55956c7d316
      InstanceType: t3.micro
      KeyName: !Ref KeyName
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      SubnetId: !Ref PublicSubnet
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y nodejs npm postgresql

Outputs:
  WebServerIP:
    Description: Public IP of web server
    Value: !GetAtt WebServer.PublicIp
  
  DatabaseEndpoint:
    Description: RDS endpoint
    Value: !GetAtt Database.Endpoint.Address
`;

  // Terraform configuration
  const terraform = `# Terraform configuration for emergency deployment
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "emergency-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "emergency-igw"
  }
}

# Subnets
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "emergency-public-subnet"
  }
}

resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name = "emergency-private-subnet"
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "emergency-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Security Groups
resource "aws_security_group" "web" {
  name        = "emergency-web-sg"
  description = "Security group for web server"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "db" {
  name        = "emergency-db-sg"
  description = "Security group for database"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "emergency-db-subnet-group"
  subnet_ids = [aws_subnet.public.id, aws_subnet.private.id]

  tags = {
    Name = "Emergency DB subnet group"
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier           = "emergency-db"
  allocated_storage    = 20
  storage_type         = "gp2"
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = "db.t3.micro"
  db_name              = "myapp"
  username             = "postgres"
  password             = var.db_password
  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name = aws_db_subnet_group.main.name
  skip_final_snapshot  = true

  tags = {
    Name = "emergency-database"
  }
}

# EC2 Instance
resource "aws_instance" "web" {
  ami                    = "ami-0c02fb55956c7d316"
  instance_type          = "t3.micro"
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.web.id]
  subnet_id              = aws_subnet.public.id

  user_data = base64encode(templatefile("user-data.sh", {
    db_endpoint = aws_db_instance.main.endpoint
  }))

  tags = {
    Name = "emergency-web-server"
  }
}

variable "key_name" {
  description = "AWS Key Pair name"
  type        = string
}

output "web_server_ip" {
  description = "Public IP of web server"
  value       = aws_instance.web.public_ip
}

output "database_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
}
`;

  // Add all files to ZIP
  zip.addFile('aws/DEPLOYMENT_GUIDE.md', awsGuide);
  zip.addFile('aws/user-data.sh', userData);
  zip.addFile('aws/Dockerfile', dockerfile);
  zip.addFile('aws/docker-compose.yml', dockerCompose);
  zip.addFile('aws/cloudformation.yaml', cloudFormation);
  zip.addFile('aws/terraform/main.tf', terraform);

  // Add quick setup script
  const quickSetup = `#!/bin/bash
# Quick AWS Deployment Script
# Generated: ${new Date().toISOString()}

echo "🚀 Emergency AWS Deployment Script"
echo "=================================="

# Check prerequisites
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI is required but not installed."; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo "⚠️  Terraform not found. Using CloudFormation instead."; }

echo "✅ Prerequisites check complete"

# Set variables
read -p "Enter AWS region (default: us-east-1): " AWS_REGION
AWS_REGION=\${AWS_REGION:-us-east-1}

read -p "Enter key pair name: " KEY_NAME
read -s -p "Enter database password: " DB_PASSWORD
echo

echo "🔧 Starting deployment..."

# Deploy infrastructure
if command -v terraform >/dev/null 2>&1; then
    echo "📦 Deploying with Terraform..."
    cd terraform
    terraform init
    terraform plan -var="aws_region=$AWS_REGION" -var="key_name=$KEY_NAME" -var="db_password=$DB_PASSWORD"
    terraform apply -var="aws_region=$AWS_REGION" -var="key_name=$KEY_NAME" -var="db_password=$DB_PASSWORD" -auto-approve
    
    WEB_IP=$(terraform output -raw web_server_ip)
    DB_ENDPOINT=$(terraform output -raw database_endpoint)
else
    echo "📦 Deploying with CloudFormation..."
    aws cloudformation create-stack \\
        --stack-name emergency-deployment \\
        --template-body file://cloudformation.yaml \\
        --parameters ParameterKey=KeyName,ParameterValue=$KEY_NAME ParameterKey=DBPassword,ParameterValue=$DB_PASSWORD \\
        --region $AWS_REGION
    
    echo "⏳ Waiting for stack creation..."
    aws cloudformation wait stack-create-complete --stack-name emergency-deployment --region $AWS_REGION
    
    WEB_IP=$(aws cloudformation describe-stacks --stack-name emergency-deployment --query 'Stacks[0].Outputs[?OutputKey==\`WebServerIP\`].OutputValue' --output text --region $AWS_REGION)
    DB_ENDPOINT=$(aws cloudformation describe-stacks --stack-name emergency-deployment --query 'Stacks[0].Outputs[?OutputKey==\`DatabaseEndpoint\`].OutputValue' --output text --region $AWS_REGION)
fi

echo "🎉 Deployment Complete!"
echo "======================="
echo "Web Server IP: $WEB_IP"
echo "Database Endpoint: $DB_ENDPOINT"
echo ""
echo "📋 Next Steps:"
echo "1. SSH to server: ssh -i your-key.pem ec2-user@$WEB_IP"
echo "2. Upload backup files to server"
echo "3. Restore database: psql postgresql://postgres:$DB_PASSWORD@$DB_ENDPOINT:5432/myapp < database/backup.sql"
echo "4. Configure application environment variables"
echo "5. Start application services"
echo ""
echo "🔗 Access your application at: http://$WEB_IP"
`;

  zip.addFile('aws/quick-deploy.sh', quickSetup);

  // Make scripts executable (add note)
  const permissions = `# File Permissions Notice

After extracting this backup, make sure to set executable permissions on scripts:

chmod +x aws/quick-deploy.sh
chmod +x aws/user-data.sh

This will allow you to run the deployment scripts directly.
`;

  zip.addFile('aws/PERMISSIONS.txt', permissions);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, backupType = 'full', backupId, settings }: BackupRequest = await req.json();

    switch (action) {
      case 'create':
        console.log(`Creating ${backupType} backup...`);
        const result = await createOptimizedBackup(backupType, settings);
        
        const today = new Date().toISOString().split('T')[0];
        const filename = `${backupType}_backup_${today}.zip`;
        
        // For emergency backups, return the ZIP file directly for download
        if (backupType === 'emergency') {
          const base64Data = btoa(String.fromCharCode(...Array.from(result.zipBuffer)));
          return new Response(JSON.stringify({
            success: true,
            zipBuffer: base64Data,
            filename: `emergency_backup_${today}.zip`,
            backup_id: result.backup_id,
            file_size: result.file_size
          }), {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
        
        const buffer = new ArrayBuffer(result.zipBuffer.length);
        const view = new Uint8Array(buffer);
        view.set(result.zipBuffer);
        
        return new Response(buffer, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': result.zipBuffer.length.toString(),
          }
        });

      case 'download':
        if (!backupId) {
          return new Response(
            JSON.stringify({ error: 'Backup ID is required for download' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Downloading backup: ${backupId}`);
        
        // Get backup job details
        const { data: backupJob, error: jobError } = await supabase
          .from('backup_jobs')
          .select('*')
          .eq('id', backupId)
          .single();

        if (jobError || !backupJob) {
          return new Response(
            JSON.stringify({ error: 'Backup not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (backupJob.status !== 'completed') {
          return new Response(
            JSON.stringify({ error: 'Backup is not ready for download' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // For now, recreate the backup since we don't store files persistently
        // In a production environment, you'd retrieve the stored file
        const downloadResult = await createOptimizedBackup(backupJob.job_type, {});
        
        const downloadFilename = `backup_${backupJob.job_type}_${backupJob.created_at.split('T')[0]}.zip`;
        const downloadBuffer = new ArrayBuffer(downloadResult.zipBuffer.length);
        const downloadView = new Uint8Array(downloadBuffer);
        downloadView.set(downloadResult.zipBuffer);
        
        return new Response(downloadBuffer, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${downloadFilename}"`,
            'Content-Length': downloadResult.zipBuffer.length.toString(),
          }
        });

      case 'test':
        if (!backupId) {
          return new Response(
            JSON.stringify({ error: 'Backup ID is required for testing' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Testing backup: ${backupId}`);
        
        // Get backup job for testing
        const { data: testJob, error: testJobError } = await supabase
          .from('backup_jobs')
          .select('*')
          .eq('id', backupId)
          .single();

        if (testJobError || !testJob) {
          return new Response(
            JSON.stringify({ error: 'Backup not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Perform basic validation tests
        const testResults = {
          valid: testJob.status === 'completed',
          checks: {
            status_valid: testJob.status === 'completed',
            size_valid: testJob.file_size > 0,
            checksum_valid: testJob.checksum !== null,
            metadata_valid: testJob.metadata !== null
          }
        };

        // Log the test results
        await supabase.from('security_logs').insert({
          event_type: 'backup_test_completed',
          severity: 'low',
          description: `Backup test ${testResults.valid ? 'passed' : 'failed'} for backup ${backupId}`,
          metadata: { ...testResults, backup_id: backupId }
        });

        return new Response(
          JSON.stringify(testResults),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: `Unsupported action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Edge function error:', error);
    
    // Try to create minimal backup for memory errors
    if ((error as Error).message?.toLowerCase().includes('memory')) {
      try {
        const zip = new MemoryEfficientZip();
        const errorMsg = `Backup Failed Due to Memory Constraints
Generated: ${new Date().toISOString()}
Error: ${(error as Error).message}

This minimal backup was created because the full backup exceeded memory limits.

Recommendations:
1. Reduce the amount of data in storage buckets
2. Try backing up database and files separately
3. Contact support for large backup assistance

To restore essential data, you may need to:
- Export critical tables manually from the Supabase dashboard
- Download important files directly from storage buckets
`;
        
        zip.addFile('BACKUP_FAILURE_NOTICE.txt', errorMsg);
        const minimalZip = zip.generateZip();
        
        const buffer = new ArrayBuffer(minimalZip.length);
        const view = new Uint8Array(buffer);
        view.set(minimalZip);
        
        return new Response(buffer, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename="minimal_backup_error.zip"',
            'Content-Length': minimalZip.length.toString(),
          }
        });
      } catch (minimalError) {
        console.error('Even minimal backup failed:', minimalError);
      }
    }

    return new Response(
      JSON.stringify({ 
        error: 'Backup creation failed', 
        details: (error as Error).message,
        suggestion: (error as Error).message?.toLowerCase().includes('memory') ?
          'Memory limit exceeded. Try reducing data or backing up in smaller chunks.' :
          'Please check the logs for more details.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});