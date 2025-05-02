import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
  try {
    const { data, error } = await supabase
      .from('brokers')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Table structure:', data ? Object.keys(data[0]) : 'No data');
    console.log('Sample data:', data);
  } catch (error) {
    console.error('Failed to check table:', error);
  }
}

checkTable(); 