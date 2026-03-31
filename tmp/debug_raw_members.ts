import { createServerSupabaseClient } from "./src/lib/supabase/server.ts";

async function debugMembers() {
  const supabase = await createServerSupabaseClient();
  
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

debugMembers();
