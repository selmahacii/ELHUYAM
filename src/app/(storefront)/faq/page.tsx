import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";

export const metadata: Metadata = { title: "FAQ — EL HUYAM" };

// Static page — content never changes between deployments
export const revalidate = false;

const faqsEn = [
  {
    q: "What is EL HUYAM?",
    a: "EL HUYAM is a modest fashion house offering refined abayas, niqabs, gloves, and complete Islamic modest attire, crafted with quality fabrics and elegant cuts.",
  },
  {
    q: "Do your creations respect Islamic modesty?",
    a: "Yes, our designs strictly follow the principles of Islamic modesty — featuring loose, opaque, and elegant silhouettes.",
  },
  {
    q: "How do I choose my size?",
    a: "You can refer to the size indications on each product page, or contact our team if you need guidance.",
  },
  {
    q: "How does the ordering process work?",
    a: "Select your items, add them to your cart, and submit your details. Our team will contact you directly on WhatsApp to confirm your order details before preparation.",
  },
  {
    q: "How is delivery carried out?",
    a: "Once confirmed on WhatsApp, parcels are handed over to our partner delivery company for transport to your home address or pickup desk.",
  },
  {
    q: "How does the Claims Service (Service de Réclamation) work?",
    a: "Our customer service is at your service: contact us directly on WhatsApp at +213 772 51 54 48 or by email at contact@elhuyaam.com with your order details so our team can assist you.",
  },
  {
    q: "Can I exchange an item?",
    a: "Yes, you can contact our customer service team directly to review your request and guide you.",
  },
  {
    q: "What payment methods are available?",
    a: "We offer Cash on Delivery in Algeria. For international orders, payment details and instructions will be communicated directly via WhatsApp once you place your order.",
  },
];

const faqsAr = [
  {
    q: "ما هي علامة EL HUYAM؟",
    a: "دار أزياء إسلامية محتشمة تقدم عبايات راقية، نقابات، قفازات، وكل ما يتعلق باللباس الشرعي الساتر، بأقمشة فاخرة وقصات أنيقة.",
  },
  {
    q: "هل التصاميم محتشمة وساترة وفق الضوابط الشرعية؟",
    a: "نعم، جميع تصاميمنا واسعة، فضفاضة، وبأقمشة غير شفافة تراعي الحشمة والوقار التام.",
  },
  {
    q: "كيف أختار مقاسي؟",
    a: "يمكنكِ مراجعة تفاصيل المقاس في صفحة المنتج، أو التواصل مع فريقنا لمساعدتكِ في الاختيار المناسب.",
  },
  {
    q: "كيف تتم عملية الطلب؟",
    a: "اختاري قطعكِ وسجلي طلبكِ عبر الموقع، وسيتواصل معكِ فريقنا مباشرة عبر الواتساب لتأكيد التفاصيل قبل التجهيز والإرسال.",
  },
  {
    q: "كيف يتم التوصيل؟",
    a: "بعد تأكيد الطلب، يُسلَّم الطرد إلى شركة التوصيل المعتمدة لنقله إلى باب منزلكِ أو مكتب الاستلام.",
  },
  {
    q: "كيف تعمل مصلحة الشكاوى في حال وجود أي استفسار أو مشكلة؟",
    a: "فريق مصلحة الزبائن والشكاوى في خدمتكم دائماً: تواصلوا معنا مباشرة عبر الواتساب على الرقم 48 54 51 772 213+ أو عبر البريد الإلكتروني contact@elhuyaam.com لمتابعة طلبكم وتقديم الحل الأنسب.",
  },
  {
    q: "هل يمكن استبدال منتج؟",
    a: "نعم، يمكنكِ التواصل مع فريق الدعم لمراجعة طلبكِ وإرشادكِ بكل سهولة.",
  },
  {
    q: "ما هي طرق الدفع المتوفرة؟",
    a: "نوفر الدفع عند الاستلام داخل الجزائر. أما للطلبات الدولية، فسيتم إرسال تفاصيل وإجراءات الدفع مباشرة عبر الواتساب فور تسجيل الطلب.",
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
