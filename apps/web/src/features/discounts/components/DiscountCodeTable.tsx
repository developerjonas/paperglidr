import { ActionButton } from "@/components/ActionButton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DiscountCodeStatus } from "@/drizzle/schema/discountCode"
import { formatPlural, formatPrice } from "@/lib/formatters"
import { BanIcon, CheckCircle2Icon, InfinityIcon } from "lucide-react"
import Link from "next/link"
import { deleteDiscountCodeAction } from "../actions/discounts"

export function DiscountCodeTable({
  discountCodes,
}: {
  discountCodes: {
    id: string
    code: string
    scopeType: "product" | "storewide"
    productName: string | null
    discountType: "percentage" | "fixed"
    amount: number
    redemptionCount: number
    maxRedemptions: number | null
    status: DiscountCodeStatus
    expiresAt: Date | null
  }[]
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            {formatPlural(discountCodes.length, {
              singular: "discount code",
              plural: "discount codes",
            })}
          </TableHead>
          <TableHead>Applies to</TableHead>
          <TableHead>Usage</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {discountCodes.map(dc => (
          <TableRow key={dc.id}>
            <TableCell>
              <div className="flex flex-col gap-1">
                <div className="font-semibold font-mono">{dc.code}</div>
                <div className="text-muted-foreground">
                  {dc.discountType === "percentage"
                    ? `${dc.amount}% off`
                    : `${formatPrice(dc.amount)} off`}
                  {dc.expiresAt && ` • expires ${dc.expiresAt.toLocaleDateString()}`}
                </div>
              </div>
            </TableCell>
            <TableCell>
              {dc.scopeType === "storewide" ? "All products" : dc.productName ?? "—"}
            </TableCell>
            <TableCell>
              {dc.redemptionCount}
              {dc.maxRedemptions == null ? (
                <InfinityIcon className="inline size-4 ml-1" />
              ) : (
                ` / ${dc.maxRedemptions}`
              )}
            </TableCell>
            <TableCell>
              <Badge className="inline-flex items-center gap-2">
                {getStatusIcon(dc.status)} {dc.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href={`/teach/discounts/${dc.id}/edit`}>Edit</Link>
                </Button>
                <ActionButton
                  variant="destructiveOutline"
                  requireAreYouSure
                  action={deleteDiscountCodeAction.bind(null, dc.id)}
                >
                  <BanIcon />
                  <span className="sr-only">Delete</span>
                </ActionButton>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function getStatusIcon(status: DiscountCodeStatus) {
  const Icon = { active: CheckCircle2Icon, disabled: BanIcon }[status]
  return <Icon className="size-4" />
}
