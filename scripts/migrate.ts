import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrate() {
  try {
    // Check if table exists
    const { error } = await supabase.from('brokers').select('*').limit(1);
    
    if (error?.code === 'PGRST204') {
      console.log('Creating brokers table...');
      
      // Create table using REST API
      const { error: createError } = await supabase
        .from('brokers')
        .insert([
          {
            name: 'Test Broker',
            email: 'test@example.com',
            status: 'active'
          }
        ])
        .select();

      if (createError) {
        throw createError;
      }
      
      console.log('Migration completed successfully');
    } else {
      console.log('Brokers table already exists');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate(); 