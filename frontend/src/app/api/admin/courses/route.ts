import { proxyToGas } from "@/lib/api/gas-server";
import { NextRequest } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

function purgeCourseCache() {
  try {
    revalidatePath("/api/courses");
    revalidatePath("/api/courses/public");
    revalidatePath("/api/announcements");
    revalidatePath("/");
    revalidatePath("/dashboard/courses");
    (revalidateTag as any)("courses");
    (revalidateTag as any)("announcements");
  } catch (err) {
    console.warn("Course cache purge failed:", err);
  }
}

export async function POST(request: NextRequest) {
  const res = await proxyToGas(request, "admin/course/create");
  if (res.ok) purgeCourseCache();
  return res;
}

export async function PUT(request: NextRequest) {
  const res = await proxyToGas(request, "admin/course/update");
  if (res.ok) purgeCourseCache();
  return res;
}

export async function DELETE(request: NextRequest) {
  const res = await proxyToGas(request, "admin/course/delete");
  if (res.ok) purgeCourseCache();
  return res;
}
