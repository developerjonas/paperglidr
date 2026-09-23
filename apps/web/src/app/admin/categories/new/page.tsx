import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryForm } from "@/features/categories/components/CategoryForm";
import { requireAdmin } from "@/services/auth";

export default async function NewCategoryPage() {
  await requireAdmin();
  return (
    <div className="container max-w-xl my-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Category</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm />
        </CardContent>
      </Card>
    </div>
  );
}
