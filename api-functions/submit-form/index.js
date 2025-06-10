const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = async function handler(context, req) {
  context.res.headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  if (req.method === 'OPTIONS') {
    context.res = {
      status: 200,
      headers: context.res.headers
    }
    return
  }

  if (req.method !== 'POST') {
    context.res = {
      status: 405,
      headers: context.res.headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
    return
  }

  try {
    const { organization, name, email, purpose, accounts, message } = req.body

    // Validate required fields
    if (!organization || !name || !email || !purpose) {
      context.res = {
        status: 400,
        headers: context.res.headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: organization, name, email, purpose' 
        })
      }
      return
    }

    // Get client info
    const userAgent = req.headers['user-agent'] || ''
    const clientIP = req.headers['x-forwarded-for'] || req.headers['x-client-ip'] || ''

    // Insert form submission to Supabase
    const { data, error } = await supabase
      .from('form_submissions')
      .insert({
        organization,
        name,
        email,
        purpose,
        accounts: parseInt(accounts) || 1,
        message: message || '',
        user_agent: userAgent,
        ip_address: clientIP || null
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      context.res = {
        status: 500,
        headers: context.res.headers,
        body: JSON.stringify({ 
          error: 'Failed to save form submission',
          details: error.message 
        })
      }
      return
    }

    // Return success response with PDF URL
    context.res = {
      status: 200,
      headers: context.res.headers,
      body: JSON.stringify({
        success: true,
        message: 'お問い合わせを受け付けました',
        submissionId: data.id,
        pdfUrl: '/PDF_DL.pdf'
      })
    }

  } catch (error) {
    console.error('Submit form error:', error)
    context.res = {
      status: 500,
      headers: context.res.headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    }
  }
}