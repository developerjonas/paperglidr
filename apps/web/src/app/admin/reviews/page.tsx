import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { getCurrentUser } from "@/services/clerk";
import { getReviewsForInstructor } from "@/features/reviews/db/reviews";
import { AdminReviewRowActions } from "@/features/reviews/components/AdminReviewRowActions";
import { StarRatingDisplay } from "@/features/reviews/components/StarRatingDisplay";

export default async function AdminReviewsPage() {
  const { userId, role } = await getCurrentUser();
  const reviews = await getReviewsForInstructor({ userId: userId!, role });

  return (
    <div className="container my-6 flex flex-col gap-6">
      <PageHeader title="All Course Reviews" />
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell>{review.course.name}</TableCell>
                <TableCell>{review.user.name}</TableCell>
                <TableCell>
                  <StarRatingDisplay rating={review.rating} size={14} />
                </TableCell>
                <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                  {review.content ?? "—"}
                </TableCell>
                <TableCell>
                  {review.isHidden ? (
                    <span className="text-xs rounded bg-destructive/10 text-destructive px-2 py-1">
                      Hidden
                    </span>
                  ) : (
                    <span className="text-xs rounded bg-green-500/10 text-green-600 px-2 py-1">
                      Visible
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <AdminReviewRowActions
                    reviewId={review.id}
                    isHidden={review.isHidden}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
