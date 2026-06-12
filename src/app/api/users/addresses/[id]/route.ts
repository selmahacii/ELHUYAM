import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { addressSchema } from "@/lib/validations";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json();
    const parsed = addressSchema.partial().safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    if (parsed.data.isDefault) {
      await db.address.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } });
    }

    const address = await db.address.update({
      where: { id, userId: session.user.id },
      data: parsed.data,
    });
    return successResponse(address);
  } catch {
    return errorResponse("Failed to update address.", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    await db.address.delete({ where: { id, userId: session.user.id } });
    return successResponse({ message: "Address deleted." });
  } catch {
    return errorResponse("Failed to delete address.", 500);
  }
}
