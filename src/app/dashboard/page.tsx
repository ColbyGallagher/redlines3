import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ReviewsDataTable } from "@/components/dashboard/reviews-table/data-table"
import { reviewData } from "@/components/dashboard/reviews-table/data"

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex w-full items-center justify-between gap-2 px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Overview</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-w-[160px] justify-between">
                    Team Portfolio
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Select workspace</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>All teams</DropdownMenuItem>
                  <DropdownMenuItem>Design / Engineering</DropdownMenuItem>
                  <DropdownMenuItem>Construction Partners</DropdownMenuItem>
                  <DropdownMenuItem>Clients</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-w-[140px] justify-between">
                    Last 30 days
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Time range</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Today</DropdownMenuItem>
                  <DropdownMenuItem>This week</DropdownMenuItem>
                  <DropdownMenuItem>This month</DropdownMenuItem>
                  <DropdownMenuItem>Quarter to date</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6 pt-4">
          <section className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome to Redlines Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Placeholder metrics to illustrate how project reviews, approvals, and upcoming checkpoints will surface here after login.
            </p>
          </section>
          <section className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Open Reviews</CardTitle>
                <CardDescription>Items awaiting engineer feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">12</p>
                <p className="text-muted-foreground text-xs">+3 since last check-in</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Ready for client sign-off</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">5</p>
                <div className="mt-2 space-y-1 text-muted-foreground text-xs">
                  <p>2 with requested clarifications</p>
                  <p>3 on hold for scheduling</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
                <CardDescription>Next milestone reminders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="flex items-center justify-between">
                  <span>Site plan package</span>
                  <span className="text-muted-foreground">Oct 04</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>MEP coordination</span>
                  <span className="text-muted-foreground">Oct 07</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Final markups</span>
                  <span className="text-muted-foreground">Oct 12</span>
                </p>
              </CardContent>
            </Card>
          </section>
          <section className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Review Activity</CardTitle>
                  <CardDescription>High-level stream of recent updates</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="justify-start">
                      Filter activity
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Show updates for</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>All projects</DropdownMenuItem>
                    <DropdownMenuItem>Assigned to me</DropdownMenuItem>
                    <DropdownMenuItem>Flagged items</DropdownMenuItem>
                    <DropdownMenuItem>Archived</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-medium">Lobby renovation package</p>
                  <p className="text-muted-foreground">Placeholder note describing recent markups and requested revisions.</p>
                </div>
                <Separator />
                <div>
                  <p className="font-medium">Mechanical coordination</p>
                  <p className="text-muted-foreground">Placeholder summary showing collaboration comments from engineers.</p>
                </div>
                <Separator />
                <div>
                  <p className="font-medium">Client handoff</p>
                  <p className="text-muted-foreground">Placeholder reminder for shared punch list and export actions.</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Use the dropdowns below to imagine workflow steps</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="w-full justify-between" variant="secondary">
                      Start new review
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Select template</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Architectural set</DropdownMenuItem>
                    <DropdownMenuItem>Structural markup</DropdownMenuItem>
                    <DropdownMenuItem>Client comments</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="w-full justify-between" variant="outline">
                      Share with team
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuItem>Invite engineer</DropdownMenuItem>
                    <DropdownMenuItem>Invite contractor</DropdownMenuItem>
                    <DropdownMenuItem>Generate guest link</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="w-full justify-between" variant="outline">
                      Export package
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuItem>Download PDF</DropdownMenuItem>
                    <DropdownMenuItem>Send to BIM 360</DropdownMenuItem>
                    <DropdownMenuItem>Email summary</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          </section>
          <section className="rounded-lg border bg-card p-6">
            <div className="mb-4 space-y-1">
              <h2 className="text-xl font-semibold">Review Tracker</h2>
              <p className="text-muted-foreground text-sm">
                Explore reviews with column controls, row selection, and quick filters.
              </p>
            </div>
            <ReviewsDataTable data={reviewData} />
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
