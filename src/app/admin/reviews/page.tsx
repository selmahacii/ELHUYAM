export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import ReviewActions from "./review-actions";
import { Star, MessageSquare, ShieldCheck, CheckCircle2, AlertCircle, BarChart3 } from "lucide-react";

interface SearchParams { searchParams: Promise<{ status?: string; page?: string }> }

export default async function AdminReviewsPage({ searchParams }: SearchParams) {
  const sp = await searchParams;
  const status = sp.status ?? "PENDING";
  const page = Math.max(1, Number(sp.page ?? 1));
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = { status: status as "PENDING" | "APPROVED" | "REJECTED" };

  const [reviews, total, counts, ratingAgg] = await Promise.all([
    db.review.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.review.count({ where }),
    Promise.all([
      db.review.count({ where: { status: "PENDING" } }),
      db.review.count({ where: { status: "APPROVED" } }),
      db.review.count({ where: { status: "REJECTED" } }),
    ]),
    db.review.aggregate({
      _avg: { rating: true },
      _count: { id: true }
    })
  ]);

  const [pendingCount, approvedCount, rejectedCount] = counts;
  const totalPages = Math.ceil(total / limit);

  const averageRating = ratingAgg._avg.rating ? Math.round(ratingAgg._avg.rating * 10) / 10 : 0;
  const totalReviewsCount = ratingAgg._count.id;

  const tabs = [
    { key: "PENDING", label: "En attente", count: pendingCount },
    { key: "APPROVED", label: "Approuvés", count: approvedCount },
    { key: "REJECTED", label: "Rejetés", count: rejectedCount },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="font-display text-2xl text-slate-900 font-bold tracking-tight">Avis & Évaluations</h1>
          <p className="text-slate-500 text-xs font-medium mt-1 leading-relaxed">
            Modérez les retours d&apos;expérience clients, gérez la réputation publique et validez les achats certifiés.
          </p>
        </div>
      </div>

      {/* ── Reviews Metrics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Moyenne générale */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Note moyenne</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <h3 className="text-xl font-bold text-slate-900">{averageRating} / 5</h3>
              <div className="flex items-center">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              </div>
            </div>
          </div>
          <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-amber-600">
            <BarChart3 className="w-4 h-4" />
          </div>
        </div>

        {/* En attente */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">En attente de modération</p>
            <h3 className="text-xl font-bold text-amber-600">{pendingCount}</h3>
          </div>
          <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-amber-600">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>

        {/* Approuvés */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Approuvés (En ligne)</p>
            <h3 className="text-xl font-bold text-emerald-600">{approvedCount}</h3>
          </div>
          <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Total Avis */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total commentaires reçus</p>
            <h3 className="text-xl font-bold text-slate-900">{totalReviewsCount}</h3>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-700">
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ── Tabs Filter Selector ── */}
      <div className="flex gap-2 bg-slate-100/70 p-1 border border-slate-200/50 rounded-2xl shrink-0 self-start max-w-max">
        {tabs.map((tab) => {
          const isActive = status === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/admin/reviews?status=${tab.key}`}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/40"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-md ${
                isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-650"
              }`}>
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* ── Feed List ── */}
      <div className="space-y-4">
        {reviews.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-3xl px-5 py-16 text-center text-slate-400 text-xs font-semibold italic shadow-sm">
            Aucun avis {status === "PENDING" ? "en attente" : status === "APPROVED" ? "approuvé" : "rejeté"} pour le moment.
          </div>
        )}
        
        {reviews.map((review: any) => {
          const resolvedName = review.user?.name || review.name || "Client Invité";
          const reviewerInitial = resolvedName.charAt(0).toUpperCase();
          return (
            <div 
              key={review.id} 
              className="bg-white border border-gray-200 rounded-3xl p-5 hover:shadow-md transition-all duration-300 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0 space-y-3.5">
                  
                  {/* Rating Stars & Target Product */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400 drop-shadow-xs" : "text-slate-200"}`} 
                        />
                      ))}
                    </div>
                    
                    <span className="text-slate-350 font-bold select-none">·</span>
                    
                    <Link 
                      href={`/shop/${review.product.slug}`} 
                      target="_blank"
                      className="text-xs sm:text-sm font-bold text-slate-800 hover:text-brand-900 hover:underline decoration-1 underline-offset-2 transition-colors truncate max-w-[240px]"
                    >
                      {review.product.title}
                    </Link>
                    
                    <span className="text-slate-300 font-bold select-none hidden sm:inline">·</span>
                    
                    <span className="text-xs text-slate-400 font-semibold">{formatDate(review.createdAt)}</span>
                  </div>

                  {/* Comment text body */}
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium pl-1">
                    {review.comment ? (
                      review.comment
                    ) : (
                      <span className="text-slate-400 italic">Aucun avis rédigé, évaluation par étoiles uniquement.</span>
                    )}
                  </p>

                  {/* Reviewer Details card */}
                  <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 rounded-2xl p-2.5 max-w-max">
                    {/* Initials Circle */}
                    <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center font-bold text-xs text-[#FAF9F6] shrink-0">
                      {reviewerInitial}
                    </div>
                    
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800">{resolvedName}</p>
                      {review.user?.email ? (
                        <p className="text-[10px] text-slate-450 font-mono truncate max-w-[170px]">{review.user.email}</p>
                      ) : (
                        <span className="inline-flex items-center bg-violet-50 border border-violet-100 text-violet-750 text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-2xs">
                          Avis Invité / Anonyme
                        </span>
                      )}
                    </div>

                    {review.verified && (
                      <div className="flex items-center gap-1.5 ml-2.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg shadow-2xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Achat vérifié</span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Moderation Actions button bar */}
                <ReviewActions reviewId={review.id} status={review.status} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-2xl">
          <p className="text-xs text-slate-500 font-medium">Page <span className="font-bold text-slate-900">{page}</span> sur <span className="font-bold text-slate-900">{totalPages}</span></p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map((p) => (
              <Link 
                key={p} 
                href={`?status=${status}&page=${p}`}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                  p === page 
                    ? "bg-slate-900 text-white border border-slate-900" 
                    : "border border-gray-200 hover:bg-white text-slate-650 bg-slate-50/50"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
