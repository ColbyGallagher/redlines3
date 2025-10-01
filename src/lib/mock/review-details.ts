export type ReviewUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  jobTitle: string
  role: string
  avatarFallback: string
}

export type ReviewDocument = {
  id: string
  documentName: string
  documentCode: string
  state: string
  milestone: string
  suitability: string
  version: string
  revision: string
  pdfUrl: string
  fileSize: string
  uploadedAt: string
}

export type ReviewIssue = {
  id: string
  issueNumber: string
  dateCreated: string
  dateModified: string
  createdByUserId: string
  modifiedByUserId: string
  comment: string
  discipline: string
  importance: string
  documentId: string
  reviewId: string
  projectId: string
  commentCoordinates: string
  pageNumber: number
  ifcElementId: string
  status: "Open" | "In Progress" | "Resolved" | "Closed"
}

export type ReviewDetail = {
  id: string
  reviewName: string
  reviewNumber: string
  milestone: string
  status: "Draft" | "In Review" | "Awaiting Client" | "Approved" | "Flagged"
  dueDateClientSmeComments: string
  dueDateIssueCommentsConsultant: string
  dueDateIssueRepliesClient: string
  project: {
    id: string
    projectNumber: string
    projectName: string
    projectLocation: string
  }
  reviewers: ReviewUser[]
  documents: ReviewDocument[]
  issues: ReviewIssue[]
  summary: string
  lastUpdated: string
}

export const reviewDetails: ReviewDetail[] = [
  {
    id: "1",
    reviewName: "Lobby Revamp R3",
    reviewNumber: "REV-LOBBY-003",
    milestone: "Design Coordination",
    status: "In Review",
    dueDateClientSmeComments: "2025-10-05",
    dueDateIssueCommentsConsultant: "2025-10-11",
    dueDateIssueRepliesClient: "2025-10-18",
    project: {
      id: "p1",
      projectNumber: "PROJ-1042",
      projectName: "Downtown Offices",
      projectLocation: "40.7128° N, 74.0060° W",
    },
    reviewers: [
      {
        id: "u1",
        firstName: "Amelia",
        lastName: "Chen",
        email: "amelia.chen@example.com",
        jobTitle: "Lead Architect",
        role: "Lead Reviewer",
        avatarFallback: "AC",
      },
      {
        id: "u2",
        firstName: "Trevor",
        lastName: "Miles",
        email: "trevor.miles@example.com",
        jobTitle: "MEP Engineer",
        role: "Discipline Reviewer",
        avatarFallback: "TM",
      },
      {
        id: "u3",
        firstName: "Priya",
        lastName: "Singh",
        email: "priya.singh@example.com",
        jobTitle: "Client Representative",
        role: "Client SME",
        avatarFallback: "PS",
      },
    ],
    documents: [
      {
        id: "d1",
        documentName: "Architectural Plan - Level 01",
        documentCode: "ARCH-PLN-01",
        state: "For Review",
        milestone: "Design Coordination",
        suitability: "S2 - Suitable for information",
        version: "3",
        revision: "B",
        pdfUrl: "/documents/arch-plan-level-01.pdf",
        fileSize: "12.4 MB",
        uploadedAt: "2025-09-28T10:15:00Z",
      },
      {
        id: "d2",
        documentName: "Lobby Reflected Ceiling Plan",
        documentCode: "ARCH-RCP-05",
        state: "For Review",
        milestone: "Design Coordination",
        suitability: "S3 - Suitable for coordination",
        version: "2",
        revision: "A",
        pdfUrl: "/documents/lobby-rcp.pdf",
        fileSize: "8.9 MB",
        uploadedAt: "2025-09-27T14:42:00Z",
      },
      {
        id: "d3",
        documentName: "Mechanical Layout - Lobby",
        documentCode: "MEP-MECH-12",
        state: "For Review",
        milestone: "Systems Alignment",
        suitability: "S3 - Suitable for coordination",
        version: "1",
        revision: "A",
        pdfUrl: "/documents/mech-layout-lobby.pdf",
        fileSize: "6.3 MB",
        uploadedAt: "2025-09-26T09:08:00Z",
      },
    ],
    issues: [
      {
        id: "iss1",
        issueNumber: "ISS-045",
        dateCreated: "2025-09-28T16:24:00Z",
        dateModified: "2025-09-30T11:12:00Z",
        createdByUserId: "u1",
        modifiedByUserId: "u2",
        comment: "Ceiling height conflicts with mechanical duct routing near the main entrance.",
        discipline: "Architectural",
        importance: "High",
        documentId: "d2",
        reviewId: "1",
        projectId: "p1",
        commentCoordinates: "412,268",
        pageNumber: 5,
        ifcElementId: "IFC-2231",
        status: "In Progress",
      },
      {
        id: "iss2",
        issueNumber: "ISS-052",
        dateCreated: "2025-09-29T09:41:00Z",
        dateModified: "2025-09-29T09:41:00Z",
        createdByUserId: "u2",
        modifiedByUserId: "u2",
        comment: "Mechanical supply diffuser missing in zone 3 seating area.",
        discipline: "Mechanical",
        importance: "Medium",
        documentId: "d3",
        reviewId: "1",
        projectId: "p1",
        commentCoordinates: "188,402",
        pageNumber: 3,
        ifcElementId: "IFC-9982",
        status: "Open",
      },
      {
        id: "iss3",
        issueNumber: "ISS-039",
        dateCreated: "2025-09-25T13:05:00Z",
        dateModified: "2025-09-29T15:22:00Z",
        createdByUserId: "u3",
        modifiedByUserId: "u1",
        comment: "Client requested updated finishes legend for lobby seating.",
        discipline: "Interior",
        importance: "Low",
        documentId: "d1",
        reviewId: "1",
        projectId: "p1",
        commentCoordinates: "92,154",
        pageNumber: 9,
        ifcElementId: "IFC-1101",
        status: "Resolved",
      },
      {
        id: "iss4",
        issueNumber: "ISS-060",
        dateCreated: "2025-09-20T08:30:00Z",
        dateModified: "2025-09-28T17:45:00Z",
        createdByUserId: "u1",
        modifiedByUserId: "u3",
        comment: "Updated lobby signage package approved by client representative.",
        discipline: "Interior",
        importance: "Medium",
        documentId: "d1",
        reviewId: "1",
        projectId: "p1",
        commentCoordinates: "134,212",
        pageNumber: 4,
        ifcElementId: "IFC-5678",
        status: "Closed",
      },
    ],
    summary:
      "Coordinating final lobby layout updates with mechanical and interior changes before client sign-off. Focus on clearing high-priority clashes and aligning finish schedules.",
    lastUpdated: "2025-09-30T11:12:00Z",
  },
  {
    id: "2",
    reviewName: "MEP Clash Report",
    reviewNumber: "REV-MEP-021",
    milestone: "Systems Alignment",
    status: "Awaiting Client",
    dueDateClientSmeComments: "2025-10-09",
    dueDateIssueCommentsConsultant: "2025-10-15",
    dueDateIssueRepliesClient: "2025-10-22",
    project: {
      id: "p2",
      projectNumber: "PROJ-2208",
      projectName: "Healthcare Campus",
      projectLocation: "34.0522° N, 118.2437° W",
    },
    reviewers: [
      {
        id: "u4",
        firstName: "Trevor",
        lastName: "Miles",
        email: "trevor.miles@example.com",
        jobTitle: "Senior MEP Coordinator",
        role: "Lead Reviewer",
        avatarFallback: "TM",
      },
      {
        id: "u5",
        firstName: "Sofia",
        lastName: "Patel",
        email: "sofia.patel@example.com",
        jobTitle: "Structural Engineer",
        role: "Structural Reviewer",
        avatarFallback: "SP",
      },
      {
        id: "u6",
        firstName: "Marcus",
        lastName: "Allen",
        email: "marcus.allen@example.com",
        jobTitle: "Client Representative",
        role: "Client SME",
        avatarFallback: "MA",
      },
    ],
    documents: [
      {
        id: "d10",
        documentName: "Main Hospital Wing - Mechanical Plan",
        documentCode: "MEP-MECH-21",
        state: "For Approval",
        milestone: "Systems Alignment",
        suitability: "S4 - Suitable for approval",
        version: "5",
        revision: "C",
        pdfUrl: "/documents/main-hospital-mech.pdf",
        fileSize: "14.1 MB",
        uploadedAt: "2025-09-24T08:55:00Z",
      },
      {
        id: "d11",
        documentName: "Electrical Riser Diagram",
        documentCode: "MEP-ELC-18",
        state: "For Approval",
        milestone: "Systems Alignment",
        suitability: "S4 - Suitable for approval",
        version: "4",
        revision: "B",
        pdfUrl: "/documents/electrical-riser.pdf",
        fileSize: "9.7 MB",
        uploadedAt: "2025-09-23T16:20:00Z",
      },
    ],
    issues: [
      {
        id: "iss10",
        issueNumber: "ISS-210",
        dateCreated: "2025-09-22T13:10:00Z",
        dateModified: "2025-09-25T18:05:00Z",
        createdByUserId: "u4",
        modifiedByUserId: "u4",
        comment: "Clash detected between sprinkler main and electrical tray on level 5.",
        discipline: "MEP",
        importance: "High",
        documentId: "d10",
        reviewId: "2",
        projectId: "p2",
        commentCoordinates: "502,320",
        pageNumber: 7,
        ifcElementId: "IFC-4527",
        status: "Open",
      },
      {
        id: "iss11",
        issueNumber: "ISS-214",
        dateCreated: "2025-09-24T09:33:00Z",
        dateModified: "2025-09-27T10:02:00Z",
        createdByUserId: "u5",
        modifiedByUserId: "u5",
        comment: "Structural beam alignment update required for mechanical clearance.",
        discipline: "Structural",
        importance: "Medium",
        documentId: "d10",
        reviewId: "2",
        projectId: "p2",
        commentCoordinates: "225,190",
        pageNumber: 10,
        ifcElementId: "IFC-3311",
        status: "In Progress",
      },
      {
        id: "iss12",
        issueNumber: "ISS-219",
        dateCreated: "2025-09-20T07:18:00Z",
        dateModified: "2025-09-26T14:20:00Z",
        createdByUserId: "u5",
        modifiedByUserId: "u4",
        comment: "Electrical tray relocation complete; coordination item closed.",
        discipline: "Electrical",
        importance: "Low",
        documentId: "d11",
        reviewId: "2",
        projectId: "p2",
        commentCoordinates: "301,266",
        pageNumber: 6,
        ifcElementId: "IFC-7654",
        status: "Closed",
      },
    ],
    summary:
      "Consolidating clash detection findings for MEP coordination. Awaiting client confirmation on mitigation approach for high-priority conflicts.",
    lastUpdated: "2025-09-27T10:02:00Z",
  },
]

export function getReviewDetailById(id: string) {
  return reviewDetails.find((review) => review.id === id)
}

export function getReviewsByProjectId(projectId: string) {
  return reviewDetails.filter((review) => review.project.id === projectId)
}

