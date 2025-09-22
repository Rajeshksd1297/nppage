import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Setting up demo users...')

    // Create admin user
    const { data: adminUser, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@demo.com',
      password: 'demo123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Demo Admin'
      }
    })

    if (adminError) {
      console.error('Error creating admin user:', adminError)
      if (adminError.message.includes('already registered')) {
        console.log('Admin user already exists, continuing...')
      } else {
        throw adminError
      }
    } else {
      console.log('Admin user created:', adminUser.user?.email)
      
      // Assign admin role
      if (adminUser.user) {
        const { error: adminRoleError } = await supabaseAdmin
          .from('user_roles')
          .upsert({
            user_id: adminUser.user.id,
            role: 'admin'
          })
        
        if (adminRoleError) {
          console.error('Error assigning admin role:', adminRoleError)
        } else {
          console.log('Admin role assigned successfully')
        }
      }
    }

    // Create regular user
    const { data: regularUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: 'user@demo.com',
      password: 'demo123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Demo User'
      }
    })

    if (userError) {
      console.error('Error creating regular user:', userError)
      if (userError.message.includes('already registered')) {
        console.log('Regular user already exists, continuing...')
      } else {
        throw userError
      }
    } else {
      console.log('Regular user created:', regularUser.user?.email)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Demo users setup completed',
        users: [
          { email: 'admin@demo.com', password: 'demo123', role: 'admin' },
          { email: 'user@demo.com', password: 'demo123', role: 'user' }
        ]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Setup error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to setup demo users'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})