export type ReviewRecord = {
  id: string
  reviewName: string
  project: {
    id: string
    name: string
    number?: string
    location?: string
  }
  dueDate: string
  milestone: string
  coordinator: string
  status: "Draft" | "In Review" | "Awaiting Client" | "Approved" | "Flagged"
}

export const reviewData: ReviewRecord[] = [
  {
    id: "1",
    reviewName: "Lobby Revamp R3",
    project: {
      id: "p1",
      name: "Downtown Offices",
    },
    dueDate: "2025-10-04",
    milestone: "Design Coordination",
    coordinator: "Amelia Chen",
    status: "In Review",
  },
  {
    id: "2",
    reviewName: "MEP Clash Report",
    project: {
      id: "p2",
      name: "Healthcare Campus",
    },
    dueDate: "2025-10-07",
    milestone: "Systems Alignment",
    coordinator: "Trevor Miles",
    status: "Awaiting Client",
  },
  {
    id: "3",
    reviewName: "Envelope QA",
    project: {
      id: "p3",
      name: "Harbor Residences",
    },
    dueDate: "2025-10-12",
    milestone: "QA Sign-off",
    coordinator: "Sofia Patel",
    status: "Draft",
  },
  {
    id: "4",
    reviewName: "Parking Deck Update",
    project: {
      id: "p4",
      name: "Uptown Mixed Use",
    },
    dueDate: "2025-10-15",
    milestone: "Structural Review",
    coordinator: "Hector Ramirez",
    status: "Flagged",
  },
  {
    id: "5",
    reviewName: "Facade Mockups",
    project: {
      id: "p5",
      name: "Innovation Hub",
    },
    dueDate: "2025-10-21",
    milestone: "Client Preview",
    coordinator: "Priya Singh",
    status: "Approved",
  },
  {
    id: "6",
    reviewName: "Interior Punchlist",
    project: {
      id: "p6",
      name: "City Hall Annex",
    },
    dueDate: "2025-10-28",
    milestone: "Close-out",
    coordinator: "Marcus Allen",
    status: "In Review",
  },
]

