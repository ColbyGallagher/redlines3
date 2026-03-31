const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually read env from .env.local if possible
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
    
    const { data: projects, error } = await supabase
        .from("projects")
        .select("id, project_name, project_users(*, user:users(*))")
        .limit(1);
        
    if (error) {
        console.error("Error:", error);
        return;
    }
    
    console.log("Project Users Raw data:");
    console.log(JSON.stringify(projects?.[0]?.project_users, null, 2));
}

debug();
