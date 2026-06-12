"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { Star, Send, ChevronDown } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";

interface PublicReview {
  id: string;
  name: string | null;
  rating: number;
  comment: string;
  createdAt: string;
}

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}) {
  const [hovered, setHovered] = useState(0);
  const dim = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            dim,
            "transition-colors",
            readonly ? "cursor-default" : "cursor-pointer",
            s <= (hovered || value) ? "fill-soft-gold text-soft-gold" : "text-brand-200"
          )}
          onMouseEnter={() => !readonly && setHovered(s)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => !readonly && onChange?.(s)}
        />
      ))}
    </div>
  );
}

export default function CatalogReviews() {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({ name: "", rating: 5, comment: "" });
  const { data: session, status } = useSession();
  const t = useTranslations("shop");
  const locale = useLocale();
  const isAr = locale === "ar";

  const fetchReviews = useCallback(async (p: number, append = false) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const res = await fetch(`/api/public-reviews?page=${p}&limit=6`);
      const data = await res.json();
      if (data.success) {
        setReviews((prev) => append ? [...prev, ...data.data] : data.data);
        setTotal(data.pagination?.total ?? 0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchReviews(1); }, [fetchReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      toast.error(t("toastLoginRequired"));
      return;
    }
    if (!form.comment.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/public-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim() || null,
          rating: form.rating,
          comment: form.comment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? t("toastError"));
      } else {
        setSubmitted(true);
        setForm({ name: "", rating: 5, comment: "" });
        toast.success(t("toastSuccess"));
      }
    } catch {
      toast.error(t("toastError"));
    } finally {
      setSubmitting(false);
    }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchReviews(next, true);
  };

  const hasMore = reviews.length < total;

  return (
    <section className="border-t border-brand-100 mt-20 pt-16 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="ornament-divider max-w-xs mx-auto mb-6">
            <span className="text-soft-gold text-xs">✦</span>
          </div>
          <h2 className={`font-display text-brand-900 mb-2 ${isAr ? "font-bold text-4xl md:text-5xl text-black leading-tight" : "text-3xl md:text-4xl font-light"}`}>
            {t("clientReviewsTitle")}
          </h2>
          <p className="text-brand-400 text-sm tracking-wide">
            {total > 0 ? (total === 1 ? t("reviewCountSingle") : t("reviewCount", { count: total })) : t("beFirstReview")}
          </p>
          <div className="ornament-divider max-w-xs mx-auto mt-6">
            <span className="text-soft-gold text-xs">✦</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* ── Left: Reviews list ── */}
          <div>
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse space-y-2 border-b border-brand-100 pb-6">
                    <div className="h-3 w-24 bg-brand-100 rounded" />
                    <div className="h-3 w-full bg-brand-100 rounded" />
                    <div className="h-3 w-3/4 bg-brand-100 rounded" />
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 text-brand-400">
                <span className="text-4xl block mb-4 text-soft-gold opacity-40">✦</span>
                <p className="font-display italic text-lg">{t("noReviewsYet")}</p>
                <p className="text-sm mt-1">{t("leaveFirstReviewHint")}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-brand-100 pb-6 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-brand-900">
                          {review.name ?? t("anonymous")}
                        </p>
                        <p className="text-xs text-brand-400">{formatDate(review.createdAt)}</p>
                      </div>
                      <StarRating value={review.rating} readonly size="sm" />
                    </div>
                    <p className="text-sm text-brand-600 leading-relaxed">{review.comment}</p>
                  </div>
                ))}

                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 text-xs uppercase tracking-widest text-brand-500 hover:text-soft-gold transition-colors mt-4"
                  >
                    {loadingMore ? t("loading") : t("viewMoreReviews")}
                    {!loadingMore && <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Submit form ── */}
          <div>
            <div className="bg-brand-50 border border-brand-100 p-6 md:p-8">
              {submitted ? (
                <div className="text-center py-8">
                  <span className="text-soft-gold text-3xl block mb-4">✦</span>
                  <h3 className="font-display text-xl text-brand-900 mb-2">
                    {t("thankYouReview")}
                  </h3>
                  <p className="text-sm text-brand-500">
                    {t("moderationNotice")}
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 text-xs uppercase tracking-widest text-brand-500 hover:text-soft-gold transition-colors border-b border-brand-300 hover:border-soft-gold pb-0.5"
                  >
                    {t("leaveAnotherReview")}
                  </button>
                </div>
              ) : !session ? (
                <div className="space-y-4">
                  <p className="text-sm text-brand-500">
                    {t("loginToReview")}
                  </p>
                  <button
                    type="button"
                    onClick={() => signIn()}
                    className="inline-flex items-center justify-center rounded border border-brand-900 bg-brand-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white hover:bg-brand-800 transition-colors"
                  >
                    {t("loginBtn")}
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="font-display text-xl text-brand-900 mb-1">
                    {t("shareYourExperience")}
                  </h3>
                  <p className="text-xs text-brand-400 mb-6 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-soft-gold inline-block" />
                    {t("verifiedReviewsOnly")}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name (optional) */}
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-brand-500 mb-1.5">
                        {t("firstNameLabel")} <span className="normal-case text-brand-300">{t("optionalLabel")}</span>
                      </label>
                      <input
                        type="text"
                        maxLength={100}
                        placeholder={t("firstPseudonymPlaceholder")}
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full border border-brand-200 bg-white px-3 py-2.5 text-sm text-brand-900 placeholder:text-brand-300 focus:outline-none focus:border-soft-gold transition-colors"
                      />
                    </div>

                    {/* Rating */}
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-brand-500 mb-2">
                        {t("ratingLabel")}
                      </label>
                      <StarRating
                        value={form.rating}
                        onChange={(v) => setForm((f) => ({ ...f, rating: v }))}
                      />
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-brand-500 mb-1.5">
                        {t("yourReviewLabel")} <span className="text-brand-700">*</span>
                      </label>
                      <textarea
                        required
                        minLength={5}
                        maxLength={1000}
                        rows={4}
                        placeholder={t("commentPlaceholder")}
                        value={form.comment}
                        onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                        className="w-full border border-brand-200 bg-white px-3 py-2.5 text-sm text-brand-900 placeholder:text-brand-300 focus:outline-none focus:border-soft-gold transition-colors resize-none"
                      />
                      <p className="text-[10px] text-brand-300 mt-1 text-right">
                        {form.comment.length}/1000
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || !form.comment.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-brand-900 text-white text-xs uppercase tracking-widest py-3 hover:bg-soft-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        t("submitting")
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          {t("publishReviewBtn")}
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
