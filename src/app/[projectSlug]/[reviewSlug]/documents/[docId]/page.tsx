import Link from "next/link"
import { notFound } from "next/navigation"

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { PDFMarkupViewerClient } from "@/components/reviews/pdf-markup-client-wrapper"
import { IFCModelViewerClient } from "@/components/reviews/ifc-model-client-wrapper"
import { ActiveProjectTracker } from "@/components/projects/active-project-tracker"
import { getAnnotationsForDocument, getChildDocuments, getDocumentForReview, getReviewDetailBySlug } from "@/lib/data/reviews"

type ReviewDocumentPageProps = {
  params: Promise<{
    projectSlug: string
    reviewSlug: string
    docId: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ReviewDocumentPage({ params, searchParams }: ReviewDocumentPageProps) {
  const { projectSlug, reviewSlug, docId } = await params
  const { page, annotationId } = await searchParams
  const initialPage = typeof page === "string" ? parseInt(page, 10) : undefined
  const initialAnnotationId = typeof annotationId === "string" ? annotationId : undefined

  const review = await getReviewDetailBySlug(reviewSlug)

  if (!review || review.project.slug !== projectSlug) {
    notFound()
  }

  const [document, initialAnnotations, childDocuments] = await Promise.all([
    getDocumentForReview(review.id, docId),
    getAnnotationsForDocument(docId),
    getChildDocuments(docId)
  ])

  if (!document) {
    notFound()
  }

  return (
    <div className="flex h-screen flex-col gap-4 p-4 overflow-hidden">
      <ActiveProjectTracker projectId={review.project.id} />
      <Breadcrumb className="text-sm">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/${projectSlug}`}>
                {review.project.projectName || "Project"}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/${projectSlug}/${review.slug}`}>{review.reviewName}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{document.documentName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <section className="flex flex-1 overflow-hidden rounded-lg border bg-background shadow-sm">
        {document.documentName?.toLowerCase().endsWith('.ifc') || document.pdfUrl?.toLowerCase().endsWith('.ifc') ? (
          <IFCModelViewerClient
            document={{
              id: document.id,
              name: document.documentName ?? "Untitled document",
              code: document.documentCode ?? "",
              pdfUrl: document.pdfUrl ?? "",
              projectId: review.project.id,
            }}
          />
        ) : (
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
            initialAnnotationId={initialAnnotationId}
          />
        )}
      </section>
    </div>
  )
}
