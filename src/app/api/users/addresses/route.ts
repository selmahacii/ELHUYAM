import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { addressSchema } from "@/lib/validations";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const addresses = await db.address.findMany({
      where: { userId: session.user.id },
      orderBy: { isDefault: "desc" },
    });
    return successResponse(addresses);
  } catch {
    return errorResponse("Failed to fetch addresses.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    // If new address is default, unset others
    if (parsed.data.isDefault) {
      await db.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      });
    }

    const address = await db.address.create({
      data: { ...parsed.data, userId: session.user.id },
    });
    return successResponse(address, 201);
  } catch {
    return errorResponse("Failed to create address.", 500);
  }
}
