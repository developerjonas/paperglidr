import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, DollarSign, Package, Wallet } from "lucide-react"
import Link from "next/link"
export default function TeachPage() {
  return (
    <div className="container my-6 flex flex-col gap-6">
      <PageHeader title="Instructor Dashboard" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/teach/courses" className="transition-transform hover:scale-[1.02]">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold">Courses</CardTitle>
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create, edit, and organize your courses, sections, and video lessons.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
        <Link href="/teach/products" className="transition-transform hover:scale-[1.02]">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold">Products</CardTitle>
              <Package className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Bundle your courses together into products and set pricing tiers.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
        <Link href="/teach/sales" className="transition-transform hover:scale-[1.02]">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold">Sales</CardTitle>
              <DollarSign className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                View your purchase history, revenue, and student enrollments.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
        <Link href="/teach/payouts" className="transition-transform hover:scale-[1.02]">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold">Payouts</CardTitle>
              <Wallet className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Request payouts of your available balance and track past requests.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
