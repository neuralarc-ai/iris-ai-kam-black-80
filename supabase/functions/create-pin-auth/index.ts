
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { pin } = await req.json()

    if (!pin || pin.length !== 6) {
      return new Response(
        JSON.stringify({ error: 'Invalid PIN format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if profile with PIN exists
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('pin', pin)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Invalid PIN' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // If profile already has a user_id, return success
    if (profile.user_id) {
      return new Response(
        JSON.stringify({ success: true, user_id: profile.user_id }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create auth user
    const email = `pin_${pin}@iris.internal`
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password: pin,
      email_confirm: true,
      user_metadata: {
        pin: pin,
        name: profile.name
      }
    })

    if (authError || !authUser.user) {
      console.error('Auth user creation error:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to create auth user' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update profile with user_id
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ user_id: authUser.user.id })
      .eq('pin', pin)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to link profile' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, user_id: authUser.user.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
