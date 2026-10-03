import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdminSwitch } from "@/components/admin/AdminSwitch"
import {
  AdminPageHeader,
  FilterTabs,
  Pager,
  SearchForm,
  StatusBadge,
  nprFromPaisa,
  shortDate,
  shortDateTime,
} from "@/features/admin/components/AdminUi"
import { PRODUCT_FILTERS, type ProductFilter, getProductFilterCounts, listProducts } from "@/features/admin/db/catalogue"
import { setProductFeatured } from "@/features/products/actions/featured"
import { ProductReviewActions } from "@/features/products/components/ProductReviewActions"
import { UnpublishProductButton } from "@/features/products/components/UnpublishProductButton"
import { getModerationQueue } from "@/features/products/lib/moderation"
import { requireAdmin } from "@/services/auth"

const LABELS: Record<ProductFilter, string> = {
  pending_review: "Waiting for review",
  public: "Live",
  private: "Private",
  all: "All",
}
const TAB_ORDER: ProductFilter[] = ["pending_review", "public", "private", "all"]
const price = (rupees: number) => (rupees === 0 ? "Free" : nprFromPaisa(rupees * 100))

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  await requireAdmin()
  const params = await searchParams
  const counts = await getProductFilterCounts()
  const status: ProductFilter = (PRODUCT_FILTERS as readonly string[]).includes(params.status ?? "")
    ? (params.status as ProductFilter)
    : counts.pending_review > 0
      ? "pending_review"
      : "public"
  const q = params.q?.trim() || undefined
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1)
  const href = (next: { status?: string; page?: number }) => {
    const search = new URLSearchParams({ status: next.status ?? status })
    if (q && !next.status) search.set("q", q)
    if (next.page && next.page > 1) search.set("page", String(next.page))
    return `/admin/products?${search}`
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        title="Products"
        description="What's on sale. Approve or reject what creators submit, feature courses on the home page, and take a live product off sale (the creator is emailed why; buyers keep access)."
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          label="Product status"
          current={status}
          hrefFor={(value) => href({ status: value })}
          options={TAB_ORDER.map((value) => ({ value, label: LABELS[value], count: counts[value] }))}
        />
        {status !== "pending_review" && <SearchForm placeholder="Product or creator" value={q} hidden={{ status }} />}
      </div>
      {status === "pending_review" ? <ReviewQueue /> : <ProductList status={status} q={q} page={page} href={href} />}
    </div>
  )
}

async function ProductList({ status, q, page, href }: { status: ProductFilter; q?: string; page: number; href: (n: { page: number }) => string }) {
  const { rows, hasMore } = await listProducts({ q, filter: status, page })
  if (rows.length === 0) {
    return <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{q ? `Nothing matches "${q}".` : "No products here."}</p>
  }
  return (
    <>
      {status === "public" && (
        <p className="text-sm text-muted-foreground">
          <strong>Featured</strong> courses are pinned to the top of the home page and the app&apos;s Featured row, most recently featured first.
        </p>
      )}
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Sales</TableHead>
              <TableHead className="text-right">Gross</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="max-w-xs">
                  <Link href={`/products/${p.id}`} className="font-medium hover:underline">
                    {p.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {p.courses} course{p.courses === 1 ? "" : "s"}
                    {p.category && ` · ${p.category}`} · added {shortDate(p.createdAt)}
                  </p>
                  {p.status === "private" && p.reviewNote && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">Note: {p.reviewNote}</p>}
                </TableCell>
                <TableCell className="text-sm">
                  <Link href={`/admin/users/${p.authorId}`} className="hover:underline">
                    {p.author}
                  </Link>
                </TableCell>
                <TableCell className="text-right tabular-nums">{price(p.priceInRupees)}</TableCell>
                <TableCell className="text-right tabular-nums">{p.sales}</TableCell>
                <TableCell className="text-right tabular-nums">{nprFromPaisa(p.grossPaisa)}</TableCell>
                <TableCell>
                  <StatusBadge status={p.status} label={p.status === "public" ? "live" : undefined} />
                </TableCell>
                <TableCell>
                  {p.status === "public" ? (
                    <AdminSwitch label={`Feature ${p.name}`} checked={p.featured} onChangeAction={setProductFeatured.bind(null, p.id)} />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">{p.status === "public" && <UnpublishProductButton productId={p.id} name={p.name} />}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pager page={page} hasMore={hasMore} hrefFor={(n) => href({ page: n })} />
    </>
  )
}

async function ReviewQueue() {
  const { pending, decided } = await getModerationQueue()
  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-3xl text-sm text-muted-foreground">
        Check the description, thumbnail and lessons (admins can open every lesson, including locked ones) for pirated, misleading or prohibited
        content under the Content Policy. The creator is emailed on approve and reject.
      </p>
      {pending.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nothing waiting for review.</p>
      ) : (
        <div className="rounded-xl border border-border">
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
              {pending.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="max-w-md text-sm">
                    <span className="font-medium">{product.name}</span> · {price(product.priceInRupees)}
                    {/* eslint-disable-next-line @next/next/no-img-element -- any stored URL, not only allowed next/image hosts */}
                    <img src={product.imageUrl} alt="" className="my-1 h-16 w-28 rounded object-cover" />
                    <p className="line-clamp-3 text-muted-foreground">{product.description}</p>
                  </TableCell>
                  <TableCell className="text-sm">
                    <Link href={`/admin/users/${product.author.id}`} className="hover:underline">
                      {product.author.name}
                    </Link>
                    <br />
                    <span className="text-muted-foreground">{product.author.email}</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {product.courseProducts.map(({ course }) => (
                      <details key={course.id}>
                        <summary className="cursor-pointer font-medium">{course.name}</summary>
                        {course.courseSections.map((section) => (
                          <div key={section.id} className="ml-3">
                            <span className="text-muted-foreground">
                              {section.name} ({section.status})
                            </span>
                            {section.lessons.map((lesson) => (
                              <div key={lesson.id} className="ml-3">
                                <Link href={`/courses/${course.id}/lessons/${lesson.id}`} className="underline">
                                  {lesson.name}
                                </Link>{" "}
                                <span className="text-muted-foreground">({lesson.status})</span>
                              </div>
                            ))}
                          </div>
                        ))}
                        <Link href={`/admin/courses/${course.id}`} className="ml-3 text-xs text-primary hover:underline">
                          Course details →
                        </Link>
                      </details>
                    ))}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{shortDateTime(product.submittedForReviewAt)}</TableCell>
                  <TableCell className="text-right">
                    <ProductReviewActions productId={product.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Recent decisions</h2>
        {decided.length === 0 ? (
          <p className="text-sm text-muted-foreground">None yet.</p>
        ) : (
          <div className="rounded-xl border border-border">
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
                {decided.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="text-sm">{product.name}</TableCell>
                    <TableCell className="text-sm">{product.author.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={product.status} label={product.status === "public" ? "live" : undefined} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{shortDateTime(product.reviewedAt)}</TableCell>
                    <TableCell className="max-w-xs whitespace-pre-wrap text-sm text-muted-foreground">{product.reviewNote ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  )
}
