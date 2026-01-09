
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ulvbvgchjrmsqaoidsuc.supabase.co';
const supabaseAnonKey = 'sb_publishable_T8UApHVZ8WxVzyfW0qmWyw_52SD3bew';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
