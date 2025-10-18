import type { RowData } from "@tanstack/react-table"

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    navigateReview?: (id: string, row?: TData) => void
    navigateProject?: (projectId: string, row?: TData) => void
  }
}

