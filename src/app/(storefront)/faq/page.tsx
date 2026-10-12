import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";

export const metadata: Metadata = { title: "FAQ — EL HUYAM" };

// Static page — content never changes between deployments
export const revalidate = false;

const faqsEn = [
  {
    q: "What is EL HUYAM?",
    a: "EL HUYAM is a modest fashion house offering refined abayas and modest attire, crafted with quality fabrics and elegant cuts.",
  },
  {
    q: "Do your creations respect Islamic modesty?",
    a: "Yes, our designs feature loose, opaque, and modest silhouettes suitable for modern modest wear.",
  },
  {
    q: "How do I choose my size?",
    a: "You can refer to the size indications on each product page, or contact our team if you need guidance.",
  },
  {
    q: "How does the ordering process work?",
    a: "Select your piece, add it to your cart, and enter your details. Our team will contact you directly on WhatsApp to confirm everything before dispatch.",
  },
  {
    q: "How is delivery carried out?",
    a: "Once confirmed on WhatsApp, parcels are prepared and handed over to our partner delivery company for transport to your address or Stop Desk.",
  },
  {
    q: "How does the Claims Service (Service de Réclamation) work?",
    a: "Our customer service is here to assist you. Simply reach out via WhatsApp or email with your order details so our team can help you find an appropriate solution.",
  },
  {
    q: "Can I exchange an item?",
    a: "Yes, you can contact our customer support team directly to review your request.",
  },
  {
    q: "What payment methods are available?",
    a: "We offer Cash on Delivery in Algeria, as well as secure online card payment for international orders.",
  },
];

const faqsAr = [
  {
    q: "ما هي علامة EL HUYAM؟",
    a: "دار أزياء محتشمة تقدم عبايات وتصاميم راقية تجمع بين الأناقة والستر.",
  },
  {
    q: "هل التصاميم محتشمة وساترة؟",
    a: "نعم، جميع تصاميمنا واسعة وفضفاضة وبأقمشة غير شفافة تراعي الحشمة والوقار.",
  },
  {
    q: "كيف أختار مقاسي؟",
    a: "يمكنكِ مراجعة تفاصيل المقاس في صفحة المنتج، أو التواصل مع فريقنا لمساعدتكِ في الاختيار.",
  },
  {
    q: "كيف تتم عملية الطلب؟",
    a: "اختاري قطعتكِ وقومي بطلبها، ثم يتواصل معكِ فريقنا عبر الواتساب لتأكيد التفاصيل قبل الإرسال.",
  },
  {
    q: "كيف يتم التوصيل؟",
    a: "بعد تأكيد الطلب، يُسلَّم الطرد إلى شركة التوصيل المعتمدة لنقله إلى عنوانكِ أو مكتب الاستلام.",
  },
  {
    q: "كيف تعمل مصلحة الشكاوى في حال وجود أي مشكلة؟",
    a: "فريق خدمة الزبائن والشكاوى في خدمتكم دائماً؛ يكفي التواصل عبر الواتساب أو البريد الإلكتروني لمراجعة طلبكم وتقديم الحل المناسب.",
  },
  {
    q: "هل يمكن استبدال منتج؟",
    a: "نعم، يمكنكِ التواصل مع فريق الدعم لمتابعة طلبكِ وإرشادكِ لأفضل خيار.",
  },
  {
    q: "ما هي طرق الدفع المتوفرة؟",
    a: "الدفع عند الاستلام داخل الجزائر، والدفع الإلكتروني الآمن للطلبات الدولية.",
  },
];

export default async function FAQPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  const faqs = isAr ? faqsAr : faqsEn;

  const heading = isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions";
  const subHeading = isAr
    ? "كل ما تحتاجين لمعرفته عن علامة EL HUYAM، طريقة الطلب وخدمة الشكاوى."
    : "Everything you need to know about EL HUYAM, our order process, and customer claims.";
  const ctaHeading = isAr ? "هل لديكِ استفسار آخر؟" : "Still have questions?";
  const ctaSub = isAr
    ? "فريق مصلحة الزبائن متواجد لمساعدتكِ عبر الواتساب أو البريد الإلكتروني."
    : "Our customer service team is available to assist you via WhatsApp or email.";
  const ctaBtn = isAr ? "تواصل معنا" : "Contact Us";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-14">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-400 mb-2 font-arabic">✦ FAQ ✦</p>
        <h1 className="font-display text-4xl md:text-5xl text-brand-900 mb-4">{heading}</h1>
        <p className="text-brand-400 text-sm max-w-xl mx-auto">{subHeading}</p>
        <div className="flex items-center gap-3 mt-6 max-w-xs mx-auto">
          <div className="h-px flex-1 bg-brand-100" />
          <span className="text-soft-gold">✦</span>
          <div className="h-px flex-1 bg-brand-100" />
        </div>
      </div>

      <div className="space-y-0 divide-y divide-brand-100">
        {faqs.map(({ q, a }) => (
          <details key={q} className="group py-6">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <h3 className="font-display text-lg text-brand-900 pr-8">{q}</h3>
              <div className="w-5 h-5 shrink-0 border border-brand-300 flex items-center justify-center text-brand-500 group-open:rotate-45 transition-transform duration-200">
                +
              </div>
            </summary>
            <p className="mt-4 text-brand-500 leading-relaxed text-sm">{a}</p>
          </details>
        ))}
      </div>

      <div className="mt-16 bg-brand-900 p-8 text-center">
        <h3 className="font-display text-xl text-white mb-3">{ctaHeading}</h3>
        <p className="text-white/60 text-sm mb-6">{ctaSub}</p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 border border-soft-gold text-soft-gold px-6 py-3 text-xs uppercase tracking-widest hover:bg-soft-gold hover:text-brand-900 transition-colors font-medium"
        >
          {ctaBtn}
        </Link>
      </div>
    </div>
  );
}
