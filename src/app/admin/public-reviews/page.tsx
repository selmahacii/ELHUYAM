export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import PublicReviewActions from "./public-review-actions";
import { Star, MessageSquare, CheckCircle2, AlertCircle, User } from "lucide-react";

interface SearchParams { searchParams: Promise<{ status?: string; page?: string }> }

export default async function PublicReviewsAdminPage({ searchParams }: SearchParams) {
  const sp = await searchParams;
  const status = sp.status ?? "PENDING";
  const page = Math.max(1, Number(sp.page ?? 1));
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = { status: status as "PENDING" | "APPROVED" | "REJECTED" };

  const [reviews, total, counts] = await Promise.all([
    db.publicReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.publicReview.count({ where }),
    Promise.all([
      db.publicReview.count({ where: { status: "PENDING" } }),
      db.publicReview.count({ where: { status: "APPROVED" } }),
      db.publicReview.count({ where: { status: "REJECTED" } }),
    ]),
  ]);

  const [pendingCount, approvedCount, rejectedCount] = counts;
  const totalPages = Math.ceil(total / limit);

  const tabs = [
    { key: "PENDING", label: "En attente", count: pendingCount },
    { key: "APPROVED", label: "Approuvés", count: approvedCount },
    { key: "REJECTED", label: "Rejetés", count: rejectedCount },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="font-display text-2xl text-slate-900 font-bold tracking-tight">
            Avis boutique (anonymes)
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Avis laissés librement par les visiteurs depuis le catalogue — sans connexion requise.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">En attente</p>
            <h3 className="text-xl font-bold text-amber-600 mt-0.5">{pendingCount}</h3>
          </div>
          <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-amber-600">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Approuvés</p>
            <h3 className="text-xl font-bold text-emerald-600 mt-0.5">{approvedCount}</h3>
          </div>
          <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total reçus</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{pendingCount + approvedCount + rejectedCount}</h3>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-700">
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100/70 p-1 border border-slate-200/50 rounded-2xl shrink-0 self-start max-w-max">
        {tabs.map((tab) => {
          const isActive = status === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/admin/public-reviews?status=${tab.key}`}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/40"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
              }`}>
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucun avis dans cette catégorie</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review: typeof reviews[number]) => (
            <div
              key={review.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-start gap-4"
            >
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-800">
                      {review.name ?? <span className="italic text-slate-400">Anonyme</span>}
                    </span>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                      />
                    ))}
                  </div>
                  <Badge
                    variant={
                      review.status === "APPROVED" ? "default" :
                      review.status === "REJECTED" ? "destructive" : "secondary"
                    }
                    className="text-[10px]"
                  >
                    {review.status === "APPROVED" ? "Approuvé" :
                     review.status === "REJECTED" ? "Rejeté" : "En attente"}
                  </Badge>
                  <span className="text-[11px] text-slate-400">{formatDate(review.createdAt.toISOString())}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
              </div>
              <PublicReviewActions reviewId={review.id} status={review.status} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5 pt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/public-reviews?status=${status}&page=${p}`}
              className={`w-9 h-9 flex items-center justify-center text-xs rounded-xl border transition-all ${
                p === page
                  ? "bg-slate-950 text-white border-slate-950"
                  : "border-gray-200 text-slate-600 hover:border-slate-400"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
