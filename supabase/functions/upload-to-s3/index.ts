import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHash } from "https://deno.land/std@0.160.0/hash/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadRequest {
  bucketName: string;
  region: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  files: Array<{
    path: string;
    content: string; // base64 encoded
  }>;
}

async function signRequest(
  method: string,
  url: URL,
  headers: Record<string, string>,
  payload: string,
  awsAccessKeyId: string,
  awsSecretAccessKey: string,
  region: string
) {
  const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = timestamp.substring(0, 8);
  
  const encoder = new TextEncoder();
  
  // Create canonical request
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
  
  // Create string to sign
  const credentialScope = `${date}/${region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    timestamp,
    credentialScope,
    canonicalRequestHash
  ].join('\n');
  
  // Calculate signature
  const kDate = await crypto.subtle.importKey(
    'raw',
    encoder.encode(`AWS4${awsSecretAccessKey}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const dateKey = new Uint8Array(
    await crypto.subtle.sign('HMAC', kDate, encoder.encode(date))
  );
  
  const kRegion = await crypto.subtle.importKey(
    'raw',
    dateKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const regionKey = new Uint8Array(
    await crypto.subtle.sign('HMAC', kRegion, encoder.encode(region))
  );
  
  const kService = await crypto.subtle.importKey(
    'raw',
    regionKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const serviceKey = new Uint8Array(
    await crypto.subtle.sign('HMAC', kService, encoder.encode('s3'))
  );
  
  const kSigning = await crypto.subtle.importKey(
    'raw',
    serviceKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signingKey = new Uint8Array(
    await crypto.subtle.sign('HMAC', kSigning, encoder.encode('aws4_request'))
  );
  
  const kSignature = await crypto.subtle.importKey(
    'raw',
    signingKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = Array.from(
    new Uint8Array(
      await crypto.subtle.sign('HMAC', kSignature, encoder.encode(stringToSign))
    )
  )
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `AWS4-HMAC-SHA256 Credential=${awsAccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      bucketName,
      region,
      awsAccessKeyId,
      awsSecretAccessKey,
      files
    }: UploadRequest = await req.json();

    console.log(`Starting upload of ${files.length} files to S3 bucket: ${bucketName}`);

    const uploadedFiles: string[] = [];
    const failedFiles: Array<{ path: string; error: string }> = [];

    for (const file of files) {
      try {
        console.log(`Uploading: ${file.path}`);
        
        // Decode base64 content
        const binaryContent = Uint8Array.from(atob(file.content), c => c.charCodeAt(0));
        
        // Prepare S3 request
        const url = new URL(`https://${bucketName}.s3.${region}.amazonaws.com/${file.path}`);
        const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
        
        const headers: Record<string, string> = {
          'host': `${bucketName}.s3.${region}.amazonaws.com`,
          'x-amz-date': timestamp,
          'x-amz-content-sha256': createHash("sha256").update(binaryContent).toString(),
        };
        
        const authorization = await signRequest(
          'PUT',
          url,
          headers,
          new TextDecoder().decode(binaryContent),
          awsAccessKeyId,
          awsSecretAccessKey,
          region
        );
        
        headers['authorization'] = authorization;
        
        // Upload to S3
        const response = await fetch(url.toString(), {
          method: 'PUT',
          headers,
          body: binaryContent,
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

    return new Response(
      JSON.stringify({
        success: failedFiles.length === 0,
        uploadedFiles,
        failedFiles,
        message: `Uploaded ${uploadedFiles.length}/${files.length} files successfully`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: failedFiles.length > 0 ? 207 : 200,
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
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
