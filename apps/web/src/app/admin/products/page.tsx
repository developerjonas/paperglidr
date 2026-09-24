import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/PageHeader"
import { getModerationQueue } from "@/features/products/lib/moderation"
import { ProductReviewActions } from "@/features/products/components/ProductReviewActions"
import { requireAdmin } from "@/services/auth"

const when = (date: Date | null) => (date ? new Date(date).toLocaleString() : "—")
const npr = (rupees: number) => (rupees === 0 ? "Free" : `NPR ${rupees.toLocaleString("en-IN")}`)

export default async function AdminProductsPage() {
  await requireAdmin()
  const { pending, decided } = await getModerationQueue()

  return (
    <div className="container my-6 flex flex-col gap-6">
      <PageHeader title="Product Review" />
      <p className="max-w-3xl text-sm text-muted-foreground">
        Products creators have asked to publish. Check the description,
        thumbnail and lessons (admins can open every lesson, including locked
        ones) for pirated, misleading or prohibited content under the Content
        Policy. The creator is emailed on approve and reject.
      </p>

      <h2 className="text-lg font-semibold">Waiting for review ({pending.length})</h2>
      {pending.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing waiting for review.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pending.map(product => (
              <TableRow key={product.id}>
                <TableCell className="max-w-md text-sm">
                  <span className="font-medium">{product.name}</span> · {npr(product.priceInRupees)}
                  {/* eslint-disable-next-line @next/next/no-img-element -- any stored URL, not only allowed next/image hosts */}
                  <img src={product.imageUrl} alt="" className="my-1 h-16 w-28 rounded object-cover" />
                  <p className="line-clamp-3 text-muted-foreground">{product.description}</p>
                </TableCell>
                <TableCell className="text-sm">
                  {product.author.name}
                  <br />
                  <span className="text-muted-foreground">{product.author.email}</span>
                </TableCell>
                <TableCell className="text-sm">
                  {product.courseProducts.map(({ course }) => (
                    <details key={course.id}>
                      <summary className="cursor-pointer font-medium">{course.name}</summary>
                      {course.courseSections.map(section => (
                        <div key={section.id} className="ml-3">
                          <span className="text-muted-foreground">
                            {section.name} ({section.status})
                          </span>
                          {section.lessons.map(lesson => (
                            <div key={lesson.id} className="ml-3">
                              <Link href={`/courses/${course.id}/lessons/${lesson.id}`} className="underline">
                                {lesson.name}
                              </Link>{" "}
                              <span className="text-muted-foreground">({lesson.status})</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </details>
                  ))}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{when(product.submittedForReviewAt)}</TableCell>
                <TableCell className="text-right">
                  <ProductReviewActions productId={product.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <h2 className="text-lg font-semibold">Recent decisions</h2>
      {decided.length === 0 ? (
        <p className="text-sm text-muted-foreground">None yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Now</TableHead>
              <TableHead>Reviewed</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {decided.map(product => (
              <TableRow key={product.id}>
                <TableCell className="text-sm">{product.name}</TableCell>
                <TableCell className="text-sm">{product.author.name}</TableCell>
                <TableCell className="text-sm">{product.status}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{when(product.reviewedAt)}</TableCell>
                <TableCell className="max-w-xs whitespace-pre-wrap text-sm text-muted-foreground">
                  {product.reviewNote ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
