const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedAdmin() {
  console.log("Seeding admin user...")
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@competitour.app',
    password: 'admin123',
    options: {
      data: {
        full_name: 'Platform Administrator'
      }
    }
  })

  if (error) {
    if (error.message.includes('User already registered')) {
        console.log("Admin user already registered in Supabase.")
    } else {
        console.error("Error signing up admin:", error.message)
        process.exit(1)
    }
  } else {
    console.log("Admin user registered successfully in Supabase.")
    console.log("ID:", data.user?.id)
  }
}

seedAdmin()
