import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHash } from "https://deno.land/std@0.160.0/hash/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoDeployRequest {
  gitRepoUrl?: string;
  gitBranch?: string;
  uploadMethod: 's3' | 'sftp';
  // S3 credentials
  s3BucketName?: string;
  s3Region?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  // SFTP credentials
  sftpHost?: string;
  sftpPort?: number;
  sftpUsername?: string;
  sftpPassword?: string;
  sftpPath?: string;
}

async function signS3Request(
  method: string,
  url: URL,
  headers: Record<string, string>,
  payload: Uint8Array,
  awsAccessKeyId: string,
  awsSecretAccessKey: string,
  region: string
) {
  const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = timestamp.substring(0, 8);
  const encoder = new TextEncoder();
  
  const canonicalHeaders = Object.entries(headers)
    .map(([k, v]) => `${k.toLowerCase()}:${v}`)
    .sort()
    .join('\n');
  
  const signedHeaders = Object.keys(headers)
    .map(k => k.toLowerCase())
    .sort()
    .join(';');
  
  const payloadHash = createHash("sha256").update(payload).toString();
  
  const canonicalRequest = [
    method,
    url.pathname,
    url.search.slice(1),
    canonicalHeaders + '\n',
    signedHeaders,
    payloadHash
  ].join('\n');
  
  const canonicalRequestHash = createHash("sha256").update(canonicalRequest).toString();
  const credentialScope = `${date}/${region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    timestamp,
    credentialScope,
    canonicalRequestHash
  ].join('\n');
  
  const kDate = await crypto.subtle.importKey(
    'raw',
    encoder.encode(`AWS4${awsSecretAccessKey}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const dateKey = new Uint8Array(await crypto.subtle.sign('HMAC', kDate, encoder.encode(date)));
  const kRegion = await crypto.subtle.importKey('raw', dateKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const regionKey = new Uint8Array(await crypto.subtle.sign('HMAC', kRegion, encoder.encode(region)));
  const kService = await crypto.subtle.importKey('raw', regionKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const serviceKey = new Uint8Array(await crypto.subtle.sign('HMAC', kService, encoder.encode('s3')));
  const kSigning = await crypto.subtle.importKey('raw', serviceKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signingKey = new Uint8Array(await crypto.subtle.sign('HMAC', kSigning, encoder.encode('aws4_request')));
  const kSignature = await crypto.subtle.importKey('raw', signingKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  
  const signature = Array.from(
    new Uint8Array(await crypto.subtle.sign('HMAC', kSignature, encoder.encode(stringToSign)))
  ).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `AWS4-HMAC-SHA256 Credential=${awsAccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

async function cloneAndPackageRepo(gitRepoUrl: string, branch: string = 'main') {
  console.log(`Cloning repository: ${gitRepoUrl} (branch: ${branch})`);
  
  const tempDir = await Deno.makeTempDir();
  
  try {
    // Clone the repository
    const cloneProcess = new Deno.Command("git", {
      args: ["clone", "-b", branch, "--depth", "1", gitRepoUrl, tempDir],
      stdout: "piped",
      stderr: "piped",
    });
    
    const cloneOutput = await cloneProcess.output();
    
    if (!cloneOutput.success) {
      throw new Error(`Git clone failed: ${new TextDecoder().decode(cloneOutput.stderr)}`);
    }
    
    console.log("Repository cloned successfully");
    
    // Read all files recursively
    const files: Array<{ path: string; content: Uint8Array }> = [];
    
    async function readDir(dir: string, baseDir: string = tempDir) {
      for await (const entry of Deno.readDir(dir)) {
        const fullPath = `${dir}/${entry.name}`;
        const relativePath = fullPath.replace(`${baseDir}/`, '');
        
        // Skip .git directory and node_modules
        if (entry.name === '.git' || entry.name === 'node_modules') {
          continue;
        }
        
        if (entry.isDirectory) {
          await readDir(fullPath, baseDir);
        } else if (entry.isFile) {
          const content = await Deno.readFile(fullPath);
          files.push({ path: relativePath, content });
        }
      }
    }
    
    await readDir(tempDir);
    
    console.log(`Packaged ${files.length} files`);
    
    return files;
  } finally {
    // Cleanup
    try {
      await Deno.remove(tempDir, { recursive: true });
    } catch (e) {
      console.error("Failed to cleanup temp directory:", e);
    }
  }
}

async function uploadToS3(
  files: Array<{ path: string; content: Uint8Array }>,
  bucketName: string,
  region: string,
  awsAccessKeyId: string,
  awsSecretAccessKey: string
) {
  console.log(`Uploading ${files.length} files to S3 bucket: ${bucketName}`);
  
  const uploadedFiles: string[] = [];
  const failedFiles: Array<{ path: string; error: string }> = [];
  
  for (const file of files) {
    try {
      const url = new URL(`https://${bucketName}.s3.${region}.amazonaws.com/${file.path}`);
      const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
      
      const headers: Record<string, string> = {
        'host': `${bucketName}.s3.${region}.amazonaws.com`,
        'x-amz-date': timestamp,
        'x-amz-content-sha256': createHash("sha256").update(file.content).toString(),
      };
      
      const authorization = await signS3Request(
        'PUT',
        url,
        headers,
        file.content,
        awsAccessKeyId,
        awsSecretAccessKey,
        region
      );
      
      headers['authorization'] = authorization;
      
      const response = await fetch(url.toString(), {
        method: 'PUT',
        headers,
        body: file.content,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`S3 upload failed: ${response.status} - ${errorText}`);
      }
      
      uploadedFiles.push(file.path);
      console.log(`✓ Uploaded: ${file.path}`);
    } catch (error) {
      console.error(`Failed to upload ${file.path}:`, error);
      failedFiles.push({
        path: file.path,
        error: error.message,
      });
    }
  }
  
  return { uploadedFiles, failedFiles };
}

async function uploadToSFTP(
  files: Array<{ path: string; content: Uint8Array }>,
  host: string,
  port: number,
  username: string,
  password: string,
  remotePath: string
) {
  console.log(`Uploading ${files.length} files to SFTP: ${host}`);
  
  // Create a temporary directory with all files
  const tempDir = await Deno.makeTempDir();
  
  try {
    // Write all files to temp directory
    for (const file of files) {
      const fullPath = `${tempDir}/${file.path}`;
      const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
      
      if (dir) {
        await Deno.mkdir(dir, { recursive: true });
      }
      
      await Deno.writeFile(fullPath, file.content);
    }
    
    // Use sshpass and scp to upload
    const scpProcess = new Deno.Command("sshpass", {
      args: [
        "-p", password,
        "scp",
        "-P", port.toString(),
        "-r",
        `${tempDir}/*`,
        `${username}@${host}:${remotePath}`
      ],
      stdout: "piped",
      stderr: "piped",
    });
    
    const scpOutput = await scpProcess.output();
    
    if (!scpOutput.success) {
      throw new Error(`SFTP upload failed: ${new TextDecoder().decode(scpOutput.stderr)}`);
    }
    
    console.log("SFTP upload completed successfully");
    
    return {
      uploadedFiles: files.map(f => f.path),
      failedFiles: []
    };
  } finally {
    // Cleanup
    try {
      await Deno.remove(tempDir, { recursive: true });
    } catch (e) {
      console.error("Failed to cleanup temp directory:", e);
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: AutoDeployRequest = await req.json();
    
    // Validate request
    if (!request.gitRepoUrl) {
      throw new Error("Git repository URL is required for auto-packaging");
    }
    
    // Clone and package repository
    const files = await cloneAndPackageRepo(request.gitRepoUrl, request.gitBranch || 'main');
    
    let result;
    
    // Upload based on method
    if (request.uploadMethod === 's3') {
      if (!request.s3BucketName || !request.s3Region || !request.awsAccessKeyId || !request.awsSecretAccessKey) {
        throw new Error("S3 credentials are required");
      }
      
      result = await uploadToS3(
        files,
        request.s3BucketName,
        request.s3Region,
        request.awsAccessKeyId,
        request.awsSecretAccessKey
      );
    } else if (request.uploadMethod === 'sftp') {
      if (!request.sftpHost || !request.sftpUsername || !request.sftpPassword || !request.sftpPath) {
        throw new Error("SFTP credentials are required");
      }
      
      result = await uploadToSFTP(
        files,
        request.sftpHost,
        request.sftpPort || 22,
        request.sftpUsername,
        request.sftpPassword,
        request.sftpPath
      );
    } else {
      throw new Error("Invalid upload method");
    }
    
    return new Response(
      JSON.stringify({
        success: result.failedFiles.length === 0,
        uploadedFiles: result.uploadedFiles,
        failedFiles: result.failedFiles,
        message: `Uploaded ${result.uploadedFiles.length}/${files.length} files successfully`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: result.failedFiles.length > 0 ? 207 : 200,
      }
    );
  } catch (error) {
    console.error('Auto-deploy error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
