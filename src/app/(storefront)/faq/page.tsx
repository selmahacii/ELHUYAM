import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";

export const metadata: Metadata = { title: "FAQ — EL HUYAM" };

// Static page — content never changes between deployments
export const revalidate = false;

const faqsEn = [
  { q: "How do I find my size?", a: "We provide a detailed size guide on each product page. Our abayas are available from XS to XXXL. For custom sizing requests, please contact us." },
  { q: "What materials do you use?", a: "We use premium fabrics: breathable linen, silky crepe de chine, luxurious chiffon, and soft cotton blends. Material details are specified on each product page." },
  { q: "What is the delivery time?", a: "Standard delivery in Algeria takes 3 to 5 business days. Express delivery takes 1 to 2 business days. International orders take 7 to 14 business days." },
  { q: "Is shipping free?", a: "Yes! We offer free standard shipping for all orders over 5,000 DZD in Algeria. Below this amount, flat shipping rates apply." },
  { q: "What is your return policy?", a: "We accept returns within 30 days of delivery. Items must be unworn, unwashed, in their original packaging with tags attached. Please check our return policy for full details." },
  { q: "Can I exchange an item?", a: "Yes, exchanges are possible for different sizes or colors, subject to availability. Contact our team within 30 days of receiving your order." },
  { q: "Do you deliver internationally?", a: "Yes, we ship worldwide. International shipping rates and times vary depending on the destination. Customs duties and taxes may apply." },
  { q: "How can I track my order?", a: "Once your order is shipped, you will receive a tracking number via email. You can also track your order from your account dashboard." },
  { q: "Do your products respect Islamic modesty?", a: "Absolutely. Each piece in our collection is designed with the principles of Islamic modesty in mind — fully loose, opaque, and non-form-fitting." },
  { q: "Do you offer gift wrapping?", a: "Yes! Select gift wrapping at checkout. Every order comes in our signature EL HUYAM box with tissue paper and a handwritten card option." },
];

const faqsAr = [
  { q: "كيف أجد مقاسي؟", a: "نوفر دليل مقاسات مفصل في صفحة كل منتج. عباياتنا متوفرة من XS إلى XXXL. للطلبات الخاصة والمقاسات المخصصة، يرجى التواصل معنا." },
  { q: "ما هي المواد التي تستخدمونها؟", a: "نستخدم أقمشة فاخرة: كتان مريح، كريب دي شين حريري، شيفون فاخر، وخامات قطنية ناعمة. تفاصيل الخامات موضحة في صفحة كل منتج." },
  { q: "ما هي مدة التوصيل؟", a: "التوصيل العادي في الجزائر يستغرق من 3 إلى 5 أيام عمل. التوصيل السريع يستغرق من يوم إلى يومين عمل. الطلبات الدولية تستغرق من 7 إلى 14 يوم عمل." },
  { q: "هل التوصيل مجاني؟", a: "نعم! نوفر توصيلاً عاديًا مجانيًا لجميع الطلبات التي تتجاوز 5,000 د.ج في الجزائر. للطلبات الأقل من هذه القيمة، تطبق رسوم شحن ثابتة." },
  { q: "ما هي سياسة الإرجاع لديكم؟", a: "نقبل الإرجاع خلال 30 يومًا من التوصيل. يجب أن تكون المنتجات غير ملبوسة، غير مغسولة، وفي تغليفها الأصلي مع البطاقات. يرجى مراجعة سياسة الإرجاع للتفاصيل الكاملة." },
  { q: "هل يمكنني استبدال منتج؟", a: "نعم، الاستبدال ممكن للمقاسات أو الألوان المختلفة، حسب توفرها. يرجى التواصل مع فريقنا خلال 30 يومًا من استلام طلبك." },
  { q: "هل تقومون بالشحن الدولي؟", a: "نعم، نشحن لجميع أنحاء العالم. تختلف أسعار ومدد الشحن الدولي حسب الوجهة. قد تطبق رسوم جمركية وضرائب." },
  { q: "كيف يمكنني تتبع طلبي؟", a: "بمجرد شحن طلبك، ستتلقين رقم التتبع عبر البريد الإلكتروني. يمكنك أيضًا تتبع طلبك من لوحة تحكم حسابك." },
  { q: "هل تحترم منتجاتكم ضوابط الحشمة الإسلامية؟", a: "بكل تأكيد. كل قطعة في مجموعتنا مصممة وفقًا لمبادئ الحشمة والستر — فضفاضة تمامًا، غير شفافة وغير واصفة." },
  { q: "هل توفرون تغليف هدايا؟", a: "نعم! يمكنك اختيار تغليف الهدايا عند الدفع. تأتي كل طلبية في علبة EL HUYAM المميزة مع ورق حريري وبطاقة إهداء مكتوبة بخط اليد." },
];

export default async function FAQPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  
  const faqs = isAr ? faqsAr : faqsEn;
  
  const heading = isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions";
  const subHeading = isAr ? "كل ما تحتاجين لمعرفته عن التسوق لدى EL HUYAM." : "Everything you need to know about shopping with EL HUYAM.";
  const ctaHeading = isAr ? "هل لديك أسئلة أخرى؟" : "Still have questions?";
  const ctaSub = isAr ? "فريقنا مستعد لمساعدتك عبر البريد الإلكتروني أو الواتساب." : "Our team is available to help you via email or WhatsApp.";
  const ctaBtn = isAr ? "تواصل معنا" : "Contact Us";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-14">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-400 mb-2 font-arabic">✦ FAQ ✦</p>
        <h1 className="font-display text-4xl md:text-5xl text-brand-900 mb-4">{heading}</h1>
        <p className="text-brand-400 text-sm">{subHeading}</p>
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
        <Link href="/contact" className="inline-flex items-center gap-2 border border-soft-gold text-soft-gold px-6 py-3 text-xs uppercase tracking-widest hover:bg-soft-gold hover:text-brand-900 transition-colors font-medium">
          {ctaBtn}
        </Link>
      </div>
    </div>
  );
}
