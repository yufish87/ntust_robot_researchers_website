import { proxyToGas } from "@/lib/api/gas-server";
import { NextRequest } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

function purgeAnnouncementCache() {
  try {
    revalidatePath("/api/announcements");
    revalidatePath("/");
    revalidatePath("/dashboard/announcements");
    (revalidateTag as any)("announcements");
  } catch (err) {
    console.warn("Announcement cache purge failed:", err);
  }
}

export async function GET(request: NextRequest) {
  return proxyToGas(request, "admin/announcement/list");
}

export async function POST(request: NextRequest) {
  const res = await proxyToGas(request, "admin/announcement/create");
  if (res.ok) purgeAnnouncementCache();
  return res;
}

export async function PUT(request: NextRequest) {
  const res = await proxyToGas(request, "admin/announcement/update");
  if (res.ok) purgeAnnouncementCache();
  return res;
}

export async function DELETE(request: NextRequest) {
  const res = await proxyToGas(request, "admin/announcement/delete");
  if (res.ok) purgeAnnouncementCache();
  return res;
}
