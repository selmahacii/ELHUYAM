import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";

export const metadata: Metadata = { title: "FAQ — EL HUYAM" };

// Static page — content never changes between deployments
export const revalidate = false;

const faqsEn = [
  // ── About EL HUYAM ──
  {
    q: "What is EL HUYAM?",
    a: "EL HUYAM is a modest fashion house dedicated to creating luxury abayas and refined modest wear. We unite timeless elegance with authentic Islamic modesty, using only premium fabrics and meticulous craftsmanship.",
  },
  {
    q: "Do your creations strictly respect Islamic modesty?",
    a: "Yes, absolutely. Every piece is designed according to Islamic modesty standards: loose-fitting silhouettes, opaque non-transparent fabrics, and flowing cuts that do not reveal body contours.",
  },
  {
    q: "What fabrics and quality standards does EL HUYAM use?",
    a: "We carefully select high-grade fabrics, including premium crepe, breathable linen, fluid chiffon, and luxury blends, ensuring lasting quality, comfort, and an elegant drape.",
  },

  // ── How It Works ──
  {
    q: "How does the ordering process work?",
    a: "Browse our collection, select your desired piece, choose your size and color, add it to your shopping bag, and enter your details at checkout with a valid phone number linked to WhatsApp.",
  },
  {
    q: "Why is WhatsApp confirmation mandatory?",
    a: "To ensure accuracy and avoid errors, our team contacts you directly on WhatsApp to confirm your order details and delivery information before preparation. An official receipt and order summary are also sent immediately to your email address.",
  },
  {
    q: "How does delivery work?",
    a: "Once your order is confirmed with you on WhatsApp, your parcel is carefully prepared and handed over to our delivery partner company to be transported directly to your address (home delivery) or to your selected Stop Desk pickup point.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept Cash on Delivery (COD) across all wilayas in Algeria, as well as secure online credit/debit card payments for international orders.",
  },

  // ── Claims Service (Service de Réclamation) ──
  {
    q: "How does the Claims Service (Service de Réclamation) work?",
    a: "Customer satisfaction and trust are our utmost priorities. If you notice any issue upon receiving your parcel (manufacturing defect, incorrect item, or sizing concern), contact our dedicated Claims Service immediately via WhatsApp or email with your order number and clear photos of the item.",
  },
  {
    q: "What solutions does the Claims Service provide?",
    a: "Our customer care team reviews your claim promptly to provide the most appropriate resolution: exchange, replacement, or rectification of the issue, ensuring a worry-free experience.",
  },
  {
    q: "How can I contact the customer support and claims team?",
    a: "You can reach our team directly via our official WhatsApp number or by sending an email to contact@elhuyam.com. We are at your service to assist you at every step.",
  },
];

const faqsAr = [
  // ── عن EL HUYAM ──
  {
    q: "ما هي دار EL HUYAM؟",
    a: "EL HUYAM هي علامة أزياء محتشمة متخصصة في تصميم العبايات الفاخرة والملابس الراقية. نجمع بين الحشمة الإسلامية الأصيلة والأناقة الرفيعة، معتمدين على أقمشة فاخرة وخياطة متقنة بأعلى معايير الجودة.",
  },
  {
    q: "هل تحترم تصاميمكم ضوابط الحشمة الإسلامية؟",
    a: "بكل تأكيد. جميع تصاميمنا مطابقة لضوابط الحشمة والستر: قصات فضفاضة وواسعة، أقمشة غير شفافة وغير واصفة لتمنحكِ وقارًا وأناقة تليق بكِ.",
  },
  {
    q: "ما هي نوعية الأقمشة وجودة الخياطة لدى EL HUYAM؟",
    a: "نختار بعناية فائقة أرقى الخامات التي تشمل الكريب الفاخر، الكتان الطبيعي المريح، الشيفون الانسيابي والمنسوجات الناعمة، مع عناية دقيقة بأدق التفاصيل والتشطيبات.",
  },

  // ── كيف تتم عملية الطلب؟ ──
  {
    q: "كيف تتم عملية الطلب؟",
    a: "اختاري الموديل المفضل لديكِ، حددي المقاس واللون، أضيفي المنتج إلى سلة التسوق ثم أكملي إدخال معلوماتكِ في صفحة الدفع مع التأكد من إدخال رقم هاتف مرتبط بحساب واتساب نشط.",
  },
  {
    q: "لماذا يعد تأكيد الطلب عبر الواتساب إلزاميًا؟",
    a: "لضمان دقة البيانات وتفادي أي خطأ، يتواصل معكِ فريقنا مباشرة عبر الواتساب لتأكيد تفاصيل الطلب وعنوان الاستلام قبل تجهيزه. كما يصلكِ إشعار فوري وفاتورة رسمية عبر بريدكِ الإلكتروني.",
  },
  {
    q: "كيف تتم معالجة الشحن والتوصيل؟",
    a: "بمجرد تأكيد طلبكِ عبر الواتساب، يتم تجهيز الطرد بعناية وتسليمه لشركة التوصيل الشريكة لنقله بأمان إلى باب منزلكِ (توصيل للمنزل) أو إلى مكتب الاستلام المختار (Stop Desk).",
  },
  {
    q: "ما هي طرق الدفع المتاحة؟",
    a: "نوفر خدمة الدفع عند الاستلام (COD) في جميع الولايات، بالإضافة إلى خيارات الدفع الإلكتروني الآمن بالبطاقة البنكية لطلبات زبائننا الدوليين.",
  },

  // ── مصلحة الشكاوى وخدمة الزبائن ──
  {
    q: "كيف تعمل مصلحة الشكاوى (Service de Réclamation) في حال وجود مشكلة؟",
    a: "رضاكِ التام وثقتكِ بنا هما أولويتنا القصوى. إذا واجهتِ أي مشكلة عند استلام طردكِ (عيب مصنعي، خطأ في المقاس أو الموديل)، يرجى التواصل فورًا مع مصلحة الشكاوى عبر الواتساب أو البريد الإلكتروني مع إرفاق رقم الطلب وصور واضحة للمنتج.",
  },
  {
    q: "ما هي الحلول التي تقدمها مصلحة الشكاوى؟",
    a: "يقوم فريق خدمة ما بعد البيع بمعالجة طلبكِ على الفور لتقديم الحل الأنسب: استبدال المنتج، معالجة الخلل أو تصحيح الطلب بما يضمن راحة بالكِ التامة.",
  },
  {
    q: "كيف يمكنني التواصل مع خدمة الزبائن وقسم الشكاوى؟",
    a: "يمكنكِ التواصل معنا مباشرة عبر رقم الواتساب المخصص أو عبر البريد الإلكتروني contact@elhuyam.com. فريقنا مستعد دائمًا لمساعدتكِ والإجابة على استفساراتكِ.",
  },
];

export default async function FAQPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  const faqs = isAr ? faqsAr : faqsEn;

  const heading = isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions";
  const subHeading = isAr
    ? "كل ما تحتاجين لمعرفته عن علامة EL HUYAM، طريقة الطلب ومصلحة الشكاوى."
    : "Everything you need to know about EL HUYAM, our ordering process, and our claims service.";
  const ctaHeading = isAr ? "هل لديكِ استفسار آخر؟" : "Still have questions?";
  const ctaSub = isAr
    ? "فريق مصلحة الزبائن والشكاوى متواجد لمساعدتكِ بكل سرور عبر الواتساب أو البريد الإلكتروني."
    : "Our customer service and claims team is available to assist you via WhatsApp or email.";
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
