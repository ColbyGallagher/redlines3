import Link from "next/link"
import { notFound } from "next/navigation"

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { PDFMarkupViewerClient } from "@/components/reviews/pdf-markup-client-wrapper"
import { getAnnotationsForDocument, getDocumentForReview, getReviewDetailById } from "@/lib/data/reviews"

type ReviewDocumentPageProps = {
  params: {
    id: string
    docId: string
  }
}

export default async function ReviewDocumentPage({ params }: ReviewDocumentPageProps) {
  const [review, document, initialAnnotations] = await Promise.all([
    getReviewDetailById(params.id),
    getDocumentForReview(params.id, params.docId),
    getAnnotationsForDocument(params.docId)
  ])

  if (!review || !document) {
    notFound()
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <Breadcrumb className="text-sm">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/projects/${review.project.id}`}>
                {review.project.projectName || "Project"}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/reviews/${review.id}`}>{review.reviewName}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{document.documentName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <section className="flex flex-1 overflow-hidden rounded-lg border bg-background shadow-sm">
        <PDFMarkupViewerClient
          reviewId={review.id}
          document={{
            id: document.id,
            name: document.documentName ?? "Untitled document",
            code: document.documentCode ?? "",
            pdfUrl: document.pdfUrl ?? "",
            projectId: review.project.id,
          }}
          initialAnnotations={initialAnnotations}
        />
      </section>
    </div>
  )
}
