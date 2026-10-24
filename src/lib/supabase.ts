import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgkwmkxykxycplhbbyyl.supabase.co';
const supabaseKey = 'sb_publishable_cyf7eAL5C1oFJMtu3_V7Ww_4eLM1F2m';

export const supabase = createClient(supabaseUrl, supabaseKey);
