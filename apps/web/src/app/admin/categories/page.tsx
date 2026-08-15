import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Pencil, Trash2, FolderOpen } from "lucide-react";
import { db } from "@/drizzle/db";
import { CategoryTable } from "@/drizzle/schema";
import { getCategoryGlobalTag } from "@/features/categories/db/cache";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { deleteCategory } from "@/features/categories/actions/categories"; // Action to handle category deletion

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="container my-6 space-y-6">
      {/* ---------------- HEADER & ACTIONS ---------------- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Manage course and product categories.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/categories/new">
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Link>
        </Button>
      </div>

      {/* ---------------- CATEGORIES TABLE ---------------- */}
      {categories.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {category.slug}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/categories/${category.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        {/* Action handler for deletion */}
                        <form action={deleteCategory.bind(null, category.id)}>
                          <DropdownMenuItem
                            asChild
                            className="text-destructive focus:text-destructive"
                          >
                            <button
                              type="submit"
                              className="w-full flex items-center"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </button>
                          </DropdownMenuItem>
                        </form>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* ---------------- EMPTY STATE ---------------- */
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <h3 className="mt-4 text-lg font-semibold">No categories found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first category to start organizing products and courses.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/categories/new">
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

async function getCategories() {
  "use cache";
  cacheTag(getCategoryGlobalTag());

  return await db.select().from(CategoryTable).orderBy(CategoryTable.name);
}
