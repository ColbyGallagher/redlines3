import { notFound } from "next/navigation"

import { PDFMarkupViewer } from "@/components/reviews/pdf-markup-viewer"
import { getDocumentForReview, getReviewDetailById } from "@/lib/data/reviews"

type ReviewDocumentPageProps = {
  params: {
    id: string
    docId: string
  }
}

export default async function ReviewDocumentPage({ params }: ReviewDocumentPageProps) {
  const review = await getReviewDetailById(params.id)

  if (!review) {
    notFound()
  }

  const document = await getDocumentForReview(params.id, params.docId)

  if (!document) {
    notFound()
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{review.review_name}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{document.document_name}</h1>
          <p className="text-xs text-muted-foreground">
            {document.document_code} • {document.file_size ?? ""}
          </p>
        </div>
      </header>

      <section className="flex flex-1 overflow-hidden rounded-lg border bg-background shadow-sm">
        <PDFMarkupViewer
          reviewId={review.id}
          document={{
            id: document.id,
            name: document.document_name ?? "Untitled document",
            code: document.document_code ?? "",
            pdfUrl: document.pdf_url ?? "",
          }}
        />
      </section>
    </div>
  )
}


