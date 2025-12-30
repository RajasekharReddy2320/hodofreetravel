import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the user from the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const userId = user.id;
    console.log(`Deleting account for user: ${userId}`);

    // Delete user data from all tables (order matters due to foreign keys)
    const tablesToClean = [
      'post_comments',
      'post_likes',
      'post_saves',
      'posts',
      'messages',
      'typing_indicators',
      'user_connections',
      'user_follows',
      'travel_group_members',
      'group_messages',
      'travel_groups',
      'bookings',
      'trip_segments',
      'trip_shares',
      'trip_likes',
      'bucket_list',
      'trips',
      'photos',
      'photo_albums',
      'articles',
      'reviews',
      'sensitive_user_data',
      'ticket_verifications',
      'user_roles',
      'profiles',
    ];

    for (const table of tablesToClean) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('user_id', userId);
      
      if (error) {
        console.log(`Note: Could not delete from ${table}: ${error.message}`);
      } else {
        console.log(`Deleted user data from ${table}`);
      }
    }

    // Also delete where user might be referenced by different column names
    await supabaseAdmin.from('user_connections').delete().eq('requester_id', userId);
    await supabaseAdmin.from('user_connections').delete().eq('addressee_id', userId);
    await supabaseAdmin.from('user_follows').delete().eq('follower_id', userId);
    await supabaseAdmin.from('user_follows').delete().eq('following_id', userId);
    await supabaseAdmin.from('messages').delete().eq('sender_id', userId);
    await supabaseAdmin.from('messages').delete().eq('recipient_id', userId);
    await supabaseAdmin.from('travel_groups').delete().eq('creator_id', userId);
    await supabaseAdmin.from('trip_shares').delete().eq('owner_id', userId);
    await supabaseAdmin.from('trip_shares').delete().eq('shared_with_user_id', userId);

    // Finally, delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      throw new Error(`Failed to delete auth user: ${deleteError.message}`);
    }

    console.log(`Successfully deleted account for user: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting account:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
