import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No auth header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to verify identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user from token
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      console.log('User authentication failed:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    // Parse request body
    const { productId } = await req.json();
    
    if (!productId) {
      console.log('No productId provided');
      return new Response(
        JSON.stringify({ error: 'Product ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Checking purchase for product:', productId);

    // Create admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user has admin role (admins can download any product)
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    const isAdmin = !!roleData;
    console.log('Is admin:', isAdmin);

    // If not admin, verify the user has purchased this product
    if (!isAdmin) {
      const { data: purchaseData, error: purchaseError } = await supabaseAdmin
        .from('purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .limit(1);

      if (purchaseError) {
        console.log('Purchase check error:', purchaseError.message);
        return new Response(
          JSON.stringify({ error: 'Error verifying purchase' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!purchaseData || purchaseData.length === 0) {
        console.log('No purchase found for user:', user.id, 'product:', productId);
        return new Response(
          JSON.stringify({ error: 'Purchase not found - You must purchase this product first' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Purchase verified:', purchaseData[0].id);
    }

    // Get the product's PDF URL
    const { data: productData, error: productError } = await supabaseAdmin
      .from('products')
      .select('pdf_url, title, downloads')
      .eq('id', productId)
      .single();

    if (productError || !productData) {
      console.log('Product not found:', productError?.message);
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Product found:', productData.title, 'PDF:', productData.pdf_url);

    // Generate a short-lived signed URL (5 minutes)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('products-pdfs')
      .createSignedUrl(productData.pdf_url, 300); // 5 minutes expiry

    if (signedUrlError || !signedUrlData) {
      console.log('Signed URL generation failed:', signedUrlError?.message);
      return new Response(
        JSON.stringify({ error: 'Failed to generate download link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Signed URL generated successfully');

    // Update download count
    await supabaseAdmin
      .from('products')
      .update({ downloads: productData.downloads + 1 })
      .eq('id', productId);

    return new Response(
      JSON.stringify({ 
        downloadUrl: signedUrlData.signedUrl,
        title: productData.title,
        expiresIn: 300
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
