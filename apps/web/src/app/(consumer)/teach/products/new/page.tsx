import { PageHeader } from "@/components/PageHeader";
import { db } from "@/drizzle/db";
import { CategoryTable, CourseTable, TagTable } from "@/drizzle/schema";
import { getCourseGlobalTag } from "@/features/courses/db/cache/courses";
import { ProductForm } from "@/features/products/components/ProductForm";
import { asc } from "drizzle-orm";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";

export default async function NewProductPage() {
  const [courses, categories, tags] = await Promise.all([
    getCourses(),
    getCategories(),
    getTags(),
  ]);

  return (
    <div className="container my-6">
      <PageHeader title="New Product" />
      <ProductForm courses={courses} categories={categories} tags={tags} />
    </div>
  );
}

async function getCourses() {
  "use cache";
  cacheTag(getCourseGlobalTag());

  return db.query.CourseTable.findMany({
    orderBy: asc(CourseTable.name),
    columns: { id: true, name: true },
  });
}

async function getCategories() {
  return db.query.CategoryTable.findMany({
    orderBy: asc(CategoryTable.name),
    columns: { id: true, name: true },
  });
}

async function getTags() {
  return db.query.TagTable.findMany({
    orderBy: asc(TagTable.name),
    columns: { id: true, name: true },
  });
}
