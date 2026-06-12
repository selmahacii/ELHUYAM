import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse, paginatedResponse, getPaginationParams } from "@/lib/api-response";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["CUSTOMER", "CONFIRMATRICE", "ADMIN"]),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const { name, email, password, role, phone } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return errorResponse("Un compte avec cet email existe déjà.", 400);

    const hashed = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: { name, email, password: hashed, role, phone: phone ?? null, emailVerified: new Date() },
      select: { id: true, name: true, email: true, role: true },
    });
    return successResponse(user, 201);
  } catch {
    return errorResponse("Échec de la création du compte.", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const sp = req.nextUrl.searchParams;
    const { page, limit, skip } = getPaginationParams(sp);
    const search = sp.get("search");
    const isBanned = sp.get("isBanned");

    const where = {
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
      ...(isBanned !== null ? { isBanned: isBanned === "true" } : {}),
    };

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, image: true, role: true,
          isBanned: true, createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return paginatedResponse(users, total, page, limit);
  } catch {
    return errorResponse("Failed to fetch users.", 500);
  }
}
