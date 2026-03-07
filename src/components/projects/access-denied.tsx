"use client"

import { useState } from "react"
import { ShieldAlert, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { requestAccess } from "@/lib/actions/access-requests"

interface AccessDeniedProps {
    projectId: string
    projectName?: string
}

export function AccessDenied({ projectId, projectName }: AccessDeniedProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isSent, setIsSent] = useState(false)

    const handleRequestAccess = async () => {
        setIsLoading(true)
        try {
            const result = await requestAccess(projectId)
            if (result.success) {
                toast.success(result.message)
                setIsSent(true)
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Failed to send access request.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-[60vh] p-6">
            <Card className="max-w-md w-full border-2 border-muted shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <ShieldAlert className="size-8 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Access Restricted</CardTitle>
                    <CardDescription className="text-base mt-2">
                        You don&apos;t have permission to view {projectName ? <span className="font-semibold text-foreground">{projectName}</span> : "this project"}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                    <p>
                        This project is private. If you believe you should have access, you can request it from the project administrator.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button
                        onClick={handleRequestAccess}
                        disabled={isLoading || isSent}
                        className="w-full gap-2 transition-all"
                        variant={isSent ? "secondary" : "default"}
                    >
                        {isSent ? (
                            <>
                                <Send className="size-4" />
                                Request Sent
                            </>
                        ) : (
                            <>
                                {isLoading ? "Sending..." : "Request Access"}
                            </>
                        )}
                    </Button>
                    <Button variant="ghost" asChild className="w-full">
                        <a href="/projects">Go back to projects</a>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
