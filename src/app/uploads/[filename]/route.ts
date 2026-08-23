import { NextResponse } from "next/server";
import { readUpload } from "@/lib/uploads";

export async function GET(
  _request: Request,
  context: RouteContext<"/uploads/[filename]">,
) {
  const { filename } = await context.params;
  const file = await readUpload(filename);
  if (!file) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(Uint8Array.from(file.data), {
    headers: {
      "Content-Type": file.type,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
