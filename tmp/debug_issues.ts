import { createServerSupabaseClient } from "./src/lib/supabase/server.ts";

async function checkIssues() {
  const supabase = await createServerSupabaseClient();
  const userId = "4405308e-83d9-4570-9615-3dbcd9b78883";
  
  console.log("Checking issues for user:", userId);
  
  const { data: issues, error } = await supabase
    .from("issues")
    .select("*")
    .eq("created_by_user_id", userId);
    
  if (error) {
    console.error("Error fetching issues:", error);
    return;
  }
  
  console.log(`Found ${issues?.length || 0} issues.`);
  if (issues && issues.length > 0) {
    console.log("First issue:", JSON.stringify(issues[0], null, 2));
  }
  
  const { data: projects, error: pError } = await supabase
    .from("projects")
    .select("id, project_name");
    
  if (pError) {
    console.error("Error fetching projects:", pError);
    return;
  }
  
  console.log(`User has access to ${projects?.length || 0} projects.`);
}

checkIssues();
