
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Fetching sellers.json data from ShowHeroes...')
    
    // Fetch the sellers.json data from ShowHeroes
    const response = await fetch('https://platform.showheroes.com/app/sellers.json', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DataViewer/1.0)',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('Successfully fetched sellers.json data')

    return new Response(
      JSON.stringify(data),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    )
  } catch (error) {
    console.error('Error fetching sellers.json:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch sellers.json data',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    )
  }
})
