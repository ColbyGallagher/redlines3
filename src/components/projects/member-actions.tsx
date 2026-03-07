"use client"

import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { EditProjectMemberRoleDialog } from "./edit-project-member-role-dialog"
import { removeProjectMember } from "@/lib/actions/projects"

interface MemberActionsProps {
    projectId: string
    userId: string
    userName: string
    currentRoleId?: string
    roles: any[]
}

export function MemberActions({
    projectId,
    userId,
    userName,
    currentRoleId,
    roles
}: MemberActionsProps) {
    const handleRemove = async () => {
        if (!confirm(`Are you sure you want to remove ${userName} from the project?`)) {
            return
        }

        try {
            const result = await removeProjectMember(projectId, userId)
            if (result.success) {
                toast.success(result.message)
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Failed to remove member")
        }
    }

    return (
        <div className="flex items-center gap-1">
            <EditProjectMemberRoleDialog
                projectId={projectId}
                userId={userId}
                userName={userName}
                currentRoleId={currentRoleId}
                roles={roles}
            />
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={handleRemove}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    )
}
