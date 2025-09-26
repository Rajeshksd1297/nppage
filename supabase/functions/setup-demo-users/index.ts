import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DemoUser {
  email: string;
  password: string;
  role: 'admin' | 'user';
  full_name: string;
}

const demoUsers: DemoUser[] = [
  {
    email: 'admin@demo.com',
    password: 'admin123',
    role: 'admin',
    full_name: 'Admin User'
  },
  {
    email: 'user@demo.com', 
    password: 'user123',
    role: 'user',
    full_name: 'Demo User'
  }
];

Deno.serve(async (req) => {
  console.log('Setup demo users function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client for user management
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const results = [];

    for (const demoUser of demoUsers) {
      console.log(`Creating user: ${demoUser.email}`);
      
      try {
        // Check if user already exists
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === demoUser.email);
        
        let userId: string;
        
        if (existingUser) {
          console.log(`User ${demoUser.email} already exists, updating password and role...`);
          
          // Update the user's password
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: demoUser.password }
          );
          
          if (updateError) {
            console.error(`Error updating password for ${demoUser.email}:`, updateError);
          }
          
          userId = existingUser.id;
        } else {
          // Create new user
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: demoUser.email,
            password: demoUser.password,
            email_confirm: true,
            user_metadata: {
              full_name: demoUser.full_name
            }
          });

          if (createError) {
            console.error(`Error creating user ${demoUser.email}:`, createError);
            results.push({
              email: demoUser.email,
              status: 'error',
              error: createError.message
            });
            continue;
          }

          console.log(`User ${demoUser.email} created successfully`);
          userId = newUser.user.id;

          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              email: demoUser.email,
              full_name: demoUser.full_name
            });

          if (profileError) {
            console.error(`Error creating profile for ${demoUser.email}:`, profileError);
          }
        }

        // Always update/create the role
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: userId,
            role: demoUser.role
          });

        if (roleError) {
          console.error(`Error assigning role to ${demoUser.email}:`, roleError);
        }

        results.push({
          email: demoUser.email,
          status: existingUser ? 'updated' : 'created',
          role: demoUser.role,
          password: demoUser.password
        });

        } catch (error: any) {
          console.error(`Unexpected error with user ${demoUser.email}:`, error);
          results.push({
            email: demoUser.email,
            status: 'error',
            error: error?.message || 'Unknown error'
          });
      }
    }

    console.log('Demo users setup completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Demo users setup completed',
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

    } catch (error: any) {
      console.error('Setup demo users error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error?.message || 'Unknown error'
        }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});