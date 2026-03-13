import Link from "next/link"
import { notFound } from "next/navigation"

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { PDFMarkupViewerClient } from "@/components/reviews/pdf-markup-client-wrapper"
import { getAnnotationsForDocument, getChildDocuments, getDocumentForReview, getReviewDetailById } from "@/lib/data/reviews"

type ReviewDocumentPageProps = {
  params: Promise<{
    id: string
    docId: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ReviewDocumentPage({ params, searchParams }: ReviewDocumentPageProps) {
  const { id, docId } = await params
  const { page } = await searchParams
  const initialPage = typeof page === "string" ? parseInt(page, 10) : undefined

  const [review, document, initialAnnotations, childDocuments] = await Promise.all([
    getReviewDetailById(id),
    getDocumentForReview(id, docId),
    getAnnotationsForDocument(docId),
    getChildDocuments(docId)
  ])

  if (!review || !document) {
    notFound()
  }

  return (
    <div className="flex h-screen flex-col gap-4 p-4 overflow-hidden">
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
          childDocuments={childDocuments}
          initialAnnotations={initialAnnotations}
          initialPage={initialPage}
        />
      </section>
    </div>
  )
}
