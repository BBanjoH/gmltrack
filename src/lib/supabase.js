import { createClient } from '@supabase/supabase-js'

// Hardcoded on purpose: this is a static GitHub Pages build with no env vars.
// The anon key is public by design — access is controlled by Supabase RLS policies.
const SUPABASE_URL = 'https://uplszvvhfqojtsrqukjg.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwbHN6dnZoZnFvanRzcnF1a2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMjczNjksImV4cCI6MjEwNDcwMzM2OX0.yuOApYbPw21V4QWcmqYCxqIwVfDot6iyTRqe82GTuYs'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
