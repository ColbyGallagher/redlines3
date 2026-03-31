import { createServerSupabaseClient } from "./src/lib/supabase/server.ts";

async function debugDataMapping() {
  const supabase = await createServerSupabaseClient();
  const userId = "4405308e-83d9-4570-9615-3dbcd9b78883";
  
  // 1. Fetch all projects this user is part of
  const { data: projectUsers, error: puError } = await supabase
    .from("project_users")
    .select("project_id")
    .eq("user_id", userId);
    
  if (puError) {
    console.error("Error fetching project_users:", puError);
    return;
  }
  
  const projectIds = projectUsers?.map(pu => pu.project_id) || [];
  console.log("User is member of projects:", projectIds);
  
  if (projectIds.length === 0) {
    console.log("User has NO project memberships. This is likely why getProjectSummaries is empty for them.");
    
    // Check if user has ANY issues in the DB
    const { data: issueStats, error: isError } = await supabase
      .from("issues")
      .select("project_id", { count: "exact" })
      .eq("created_by_user_id", userId);
      
    if (isError) {
      console.error("Error checking issues:", isError);
    } else {
      console.log(`User has created ${issueStats?.length || 0} issues.`);
      if (issueStats && issueStats.length > 0) {
          console.log("Projects these issues belong to:", Array.from(new Set(issueStats.map(i => i.project_id))));
      }
    }
  }
}

debugDataMapping();
