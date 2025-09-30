export type ReviewRecord = {
  id: string
  reviewName: string
  project: string
  dueDate: string
  milestone: string
  coordinator: string
  status: "Draft" | "In Review" | "Awaiting Client" | "Approved" | "Flagged"
}

export const reviewData: ReviewRecord[] = [
  {
    id: "1",
    reviewName: "Lobby Revamp R3",
    project: "Downtown Offices",
    dueDate: "2025-10-04",
    milestone: "Design Coordination",
    coordinator: "Amelia Chen",
    status: "In Review",
  },
  {
    id: "2",
    reviewName: "MEP Clash Report",
    project: "Healthcare Campus",
    dueDate: "2025-10-07",
    milestone: "Systems Alignment",
    coordinator: "Trevor Miles",
    status: "Awaiting Client",
  },
  {
    id: "3",
    reviewName: "Envelope QA",
    project: "Harbor Residences",
    dueDate: "2025-10-12",
    milestone: "QA Sign-off",
    coordinator: "Sofia Patel",
    status: "Draft",
  },
  {
    id: "4",
    reviewName: "Parking Deck Update",
    project: "Uptown Mixed Use",
    dueDate: "2025-10-15",
    milestone: "Structural Review",
    coordinator: "Hector Ramirez",
    status: "Flagged",
  },
  {
    id: "5",
    reviewName: "Facade Mockups",
    project: "Innovation Hub",
    dueDate: "2025-10-21",
    milestone: "Client Preview",
    coordinator: "Priya Singh",
    status: "Approved",
  },
  {
    id: "6",
    reviewName: "Interior Punchlist",
    project: "City Hall Annex",
    dueDate: "2025-10-28",
    milestone: "Close-out",
    coordinator: "Marcus Allen",
    status: "In Review",
  },
]

