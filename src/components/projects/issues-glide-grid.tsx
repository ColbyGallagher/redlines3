"use client"

import * as React from "react"
import DataEditor, {
  type GridCell,
  GridCellKind,
  type GridColumn,
  type Item,
  type GridSelection,
  CompactSelection,
} from "@glideapps/glide-data-grid"
import "@glideapps/glide-data-grid/dist/index.css"

import type { ProjectIssueSummary, ProjectSummary } from "@/lib/data/projects"
import { buildGlideTheme } from "@/lib/theme/glide-theme"
import { allCells } from "@glideapps/glide-data-grid-cells"
import "@glideapps/glide-data-grid-cells/dist/index.css"

// ─── Column definitions ──────────────────────────────────────────────
const columns: GridColumn[] = [
  { title: "Issue", id: "issueNumber", width: 130 },
  { title: "Review", id: "reviewName", width: 180 },
  { title: "Review Status", id: "reviewSpecificStatus", width: 130 },
  { title: "Discipline", id: "discipline", width: 150 },
  { title: "Importance", id: "importance", width: 110 },
  { title: "Status", id: "status", width: 110 },
  { title: "State", id: "state", width: 110 },
  { title: "Classification", id: "classification", width: 130 },
  { title: "Milestone", id: "milestone", width: 130 },
  { title: "Author", id: "authorName", width: 150 },
  { title: "Age (days)", id: "ageDays", width: 90 },
  { title: "Comment", id: "comment", width: 260 },
]

/** Column‑ID → position lookup (built once, never changes). */
const COL_INDEX: Record<string, number> = {}
columns.forEach((c, i) => {
  if (c.id) COL_INDEX[c.id] = i
})

// ─── Helpers ─────────────────────────────────────────────────────────
function textCell(value: string): GridCell {
  return {
    kind: GridCellKind.Text,
    data: value,
    displayData: value,
    allowOverlay: false,
    readonly: true,
  }
}

function numberCell(value: number): GridCell {
  return {
    kind: GridCellKind.Number,
    data: value,
    displayData: String(value),
    allowOverlay: false,
    readonly: true,
  }
}

const EMPTY_CELL: GridCell = textCell("")

function dropdownCell(value: string, allowedValues: string[], readonly: boolean): GridCell {
  return {
    kind: GridCellKind.Custom,
    allowOverlay: !readonly,
    copyData: value,
    readonly: readonly,
    data: {
      kind: "dropdown-cell",
      allowedValues,
      value,
    },
  } as any
}

// ─── Component ───────────────────────────────────────────────────────
type IssuesGlideGridProps = {
  issues: ProjectIssueSummary[]
  onUpdate: (id: string, field: string, value: string) => Promise<void>
  onBulkUpdate: (field: string, value: string, ids: string[]) => Promise<void>
  canEditIssue: (issue: ProjectIssueSummary) => boolean
  settings: ProjectSummary["settings"]
}

export function IssuesGlideGrid({ issues, onUpdate, onBulkUpdate, canEditIssue, settings }: IssuesGlideGridProps) {
  const theme = React.useMemo(() => buildGlideTheme(), [])
  const [selection, setSelection] = React.useState<GridSelection>({
    columns: CompactSelection.empty(),
    rows: CompactSelection.empty(),
  })

  const getCellContent = React.useCallback(
    ([col, row]: Item): GridCell => {
      // Guard against out-of-bounds access
      if (row < 0 || row >= issues.length) return EMPTY_CELL
      if (col < 0 || col >= columns.length) return EMPTY_CELL

      const issue = issues[row]
      const colId = columns[col].id
      const readonly = !canEditIssue(issue)

      switch (colId) {
        case "issueNumber":
          return textCell(issue.issueNumber)
        case "reviewName":
          return textCell(issue.reviewName)
        case "reviewSpecificStatus":
          return textCell(issue.reviewSpecificStatus ?? "—")
        case "discipline":
          return dropdownCell(issue.discipline, settings.disciplines.map(d => d.name), readonly)
        case "importance":
          return dropdownCell(issue.importance, settings.importances.map(i => i.name), readonly)
        case "status":
          return dropdownCell(issue.status, settings.statuses.map(s => s.name), readonly)
        case "state":
          return dropdownCell(issue.state ?? "—", settings.states.map(s => s.name), readonly)
        case "classification":
          return dropdownCell(issue.classification ?? "—", settings.classifications.map(c => c.name), readonly)
        case "milestone":
          return dropdownCell(issue.milestone ?? "—", settings.availableMilestones.map(m => m.name), readonly)
        case "authorName":
          return textCell(issue.authorName)
        case "ageDays":
          return numberCell(issue.ageDays)
        case "comment":
          return textCell(issue.comment ?? "")
        default:
          return EMPTY_CELL
      }
    },
    [issues, canEditIssue, settings]
  )

  const onCellsEdited = React.useCallback(
    (newValues: readonly { location: Item; value: GridCell }[]) => {
      // Group by column and value to allow for bulk updates
      const groups = new Map<string, Map<string, string[]>>()

      for (const { location, value } of newValues) {
        if (value.kind !== GridCellKind.Custom || (value.data as any).kind !== "dropdown-cell") continue

        const colId = columns[location[0]].id as string
        if (!colId) continue

        const issue = issues[location[1]]
        if (!issue || !canEditIssue(issue)) continue

        const val = (value.data as any).value

        if (!groups.has(colId)) groups.set(colId, new Map())
        const valMap = groups.get(colId)!
        if (!valMap.has(val)) valMap.set(val, [])
        valMap.get(val)!.push(issue.id)
      }

      // Execute updates
      for (const [field, valMap] of groups) {
        for (const [value, ids] of valMap) {
          if (ids.length === 1) {
            onUpdate(ids[0], field, value)
          } else if (ids.length > 1) {
            onBulkUpdate(field, value, ids)
          }
        }
      }
    },
    [issues, onUpdate, onBulkUpdate, canEditIssue]
  )

  return (
    <div className="relative w-full h-[600px] rounded-md border overflow-hidden">
      <DataEditor
        getCellContent={getCellContent}
        columns={columns}
        rows={issues.length}
        theme={theme}
        customRenderers={allCells}
        onCellsEdited={onCellsEdited}
        onCellActivated={() => { }}
        gridSelection={selection}
        onGridSelectionChange={setSelection}
        fillHandle={true}
        smoothScrollX
        smoothScrollY
        getCellsForSelection={true}
        width="100%"
        height="100%"
        rowMarkers="number"
        headerHeight={40}
        rowHeight={36}
      />
    </div>
  )
}
