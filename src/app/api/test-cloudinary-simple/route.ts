import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    console.log('🔍 Cloudinary Config Check:');
    console.log('Cloud Name:', cloudName ? '✅ Set' : '❌ Missing');
    console.log('API Key:', apiKey ? '✅ Set' : '❌ Missing');
    console.log('API Secret:', apiSecret ? '✅ Set' : '❌ Missing');

    if (!cloudName || !apiKey || !apiSecret) {
      return Response.json({
        success: false,
        error: "Missing Cloudinary environment variables",
        config: {
          cloudName: !!cloudName,
          apiKey: !!apiKey,
          apiSecret: !!apiSecret
        }
      });
    }

    // Test a simple API call to Cloudinary
    try {
      const testResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/image`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
        }
      });

      console.log('📡 Cloudinary API Test Status:', testResponse.status);

      if (testResponse.ok) {
        return Response.json({
          success: true,
          message: "Cloudinary configuration is working!",
          apiTest: "✅ Success"
        });
      } else {
        const errorData = await testResponse.text();
        console.log('❌ Cloudinary API Error:', errorData);
        return Response.json({
          success: false,
          error: "Cloudinary API test failed",
          status: testResponse.status,
          details: errorData
        });
      }
    } catch (apiError) {
      console.log('❌ Cloudinary API Connection Error:', apiError);
      return Response.json({
        success: false,
        error: "Failed to connect to Cloudinary API",
        details: apiError instanceof Error ? apiError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    return Response.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 });
  }
} 