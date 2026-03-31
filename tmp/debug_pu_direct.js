const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function getEnv() {
    try {
        const envPath = 'c:/Projects/redlines3/.env.local';
        const content = fs.readFileSync(envPath, 'utf8');
        const env = {};
        content.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) env[key.trim()] = value.trim();
        });
        return env;
    } catch (e) {
        return process.env;
    }
}

async function debug() {
    const env = getEnv();
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check project_users count
    const { count, error } = await supabase
        .from("project_users")
        .select("*", { count: "exact", head: true });
        
    console.log(`Total project_users visible: ${count}`);
    
    const { data: pu, error: puError } = await supabase
        .from("project_users")
        .select("id, project_id, user_id, user_name")
        .limit(5);
        
    console.log("Sample project_users:", JSON.stringify(pu, null, 2));
}

debug();
