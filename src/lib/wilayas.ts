export interface Wilaya {
  code: string;
  name: string;
  nameAr: string;
  domicile: number;
  stopdesk: number;
}

export const WILAYAS: Wilaya[] = [
  { code: "01", name: "Adrar", nameAr: "أدرار", domicile: 1400, stopdesk: 970 },
  { code: "02", name: "Chlef", nameAr: "الشلف", domicile: 750, stopdesk: 520 },
  { code: "03", name: "Laghouat", nameAr: "الأغواط", domicile: 950, stopdesk: 670 },
  { code: "04", name: "Oum El Bouaghi", nameAr: "أم البواقي", domicile: 800, stopdesk: 520 },
  { code: "05", name: "Batna", nameAr: "باتنة", domicile: 800, stopdesk: 520 },
  { code: "06", name: "Béjaïa", nameAr: "بجاية", domicile: 800, stopdesk: 520 },
  { code: "07", name: "Biskra", nameAr: "بسكرة", domicile: 950, stopdesk: 670 },
  { code: "08", name: "Béchar", nameAr: "بشار", domicile: 1100, stopdesk: 720 },
  { code: "09", name: "Blida", nameAr: "البليدة", domicile: 400, stopdesk: 370 },
  { code: "10", name: "Bouira", nameAr: "البويرة", domicile: 750, stopdesk: 520 },
  { code: "11", name: "Tamanrasset", nameAr: "تمنراست", domicile: 1600, stopdesk: 1120 },
  { code: "12", name: "Tébessa", nameAr: "تبسة", domicile: 850, stopdesk: 520 },
  { code: "13", name: "Tlemcen", nameAr: "تلمسان", domicile: 850, stopdesk: 570 },
  { code: "14", name: "Tiaret", nameAr: "تيارت", domicile: 800, stopdesk: 520 },
  { code: "15", name: "Tizi Ouzou", nameAr: "تيزي وزو", domicile: 750, stopdesk: 520 },
  { code: "16", name: "Alger", nameAr: "الجزائر", domicile: 500, stopdesk: 420 },
  { code: "17", name: "Djelfa", nameAr: "الجلفة", domicile: 950, stopdesk: 670 },
  { code: "18", name: "Jijel", nameAr: "جيجل", domicile: 800, stopdesk: 520 },
  { code: "19", name: "Sétif", nameAr: "سطيف", domicile: 750, stopdesk: 520 },
  { code: "20", name: "Saïda", nameAr: "سعيدة", domicile: 800, stopdesk: 570 },
  { code: "21", name: "Skikda", nameAr: "سكيكدة", domicile: 800, stopdesk: 520 },
  { code: "22", name: "Sidi Bel Abbès", nameAr: "سيدي بلعباس", domicile: 800, stopdesk: 520 },
  { code: "23", name: "Annaba", nameAr: "عنابة", domicile: 800, stopdesk: 520 },
  { code: "24", name: "Guelma", nameAr: "قالمة", domicile: 800, stopdesk: 520 },
  { code: "25", name: "Constantine", nameAr: "قسنطينة", domicile: 800, stopdesk: 520 },
  { code: "26", name: "Médéa", nameAr: "المدية", domicile: 750, stopdesk: 520 },
  { code: "27", name: "Mostaganem", nameAr: "مستغانم", domicile: 800, stopdesk: 520 },
  { code: "28", name: "M'Sila", nameAr: "المسيلة", domicile: 850, stopdesk: 570 },
  { code: "29", name: "Mascara", nameAr: "معسكر", domicile: 800, stopdesk: 520 },
  { code: "30", name: "Ouargla", nameAr: "ورقلة", domicile: 950, stopdesk: 670 },
  { code: "31", name: "Oran", nameAr: "وهران", domicile: 800, stopdesk: 520 },
  { code: "32", name: "El Bayadh", nameAr: "البيض", domicile: 1100, stopdesk: 670 },
  { code: "33", name: "Illizi", nameAr: "إليزي", domicile: 0, stopdesk: 0 },
  { code: "34", name: "Bordj Bou Arréridj", nameAr: "برج بوعريريج", domicile: 750, stopdesk: 520 },
  { code: "35", name: "Boumerdès", nameAr: "بومرداس", domicile: 750, stopdesk: 520 },
  { code: "36", name: "El Tarf", nameAr: "الطارف", domicile: 800, stopdesk: 520 },
  { code: "37", name: "Tindouf", nameAr: "تندوف", domicile: 0, stopdesk: 0 },
  { code: "38", name: "Tissemsilt", nameAr: "تيسمسيلت", domicile: 800, stopdesk: 520 },
  { code: "39", name: "El Oued", nameAr: "الوادي", domicile: 950, stopdesk: 670 },
  { code: "40", name: "Khenchela", nameAr: "خنشلة", domicile: 800, stopdesk: 520 },
  { code: "41", name: "Souk Ahras", nameAr: "سوق أهراس", domicile: 800, stopdesk: 520 },
  { code: "42", name: "Tipaza", nameAr: "تيبازة", domicile: 750, stopdesk: 520 },
  { code: "43", name: "Mila", nameAr: "ميلة", domicile: 800, stopdesk: 520 },
  { code: "44", name: "Aïn Defla", nameAr: "عين الدفلى", domicile: 750, stopdesk: 520 },
  { code: "45", name: "Naâma", nameAr: "النعامة", domicile: 1100, stopdesk: 670 },
  { code: "46", name: "Aïn Témouchent", nameAr: "عين تموشنت", domicile: 800, stopdesk: 520 },
  { code: "47", name: "Ghardaïa", nameAr: "غرداية", domicile: 950, stopdesk: 670 },
  { code: "48", name: "Relizane", nameAr: "غليزان", domicile: 800, stopdesk: 520 },
  { code: "49", name: "Timimoun", nameAr: "تميمون", domicile: 1400, stopdesk: 0 },
  { code: "50", name: "Bordj Badji Mokhtar", nameAr: "برج باجي مختار", domicile: 0, stopdesk: 0 },
  { code: "51", name: "Ouled Djellal", nameAr: "أولاد جلال", domicile: 950, stopdesk: 670 },
  { code: "52", name: "Béni Abbès", nameAr: "بني عباس", domicile: 1000, stopdesk: 970 },
  { code: "53", name: "In Salah", nameAr: "عين صالح", domicile: 1600, stopdesk: 0 },
  { code: "54", name: "In Guezzam", nameAr: "عين قزام", domicile: 1600, stopdesk: 0 },
  { code: "55", name: "Touggourt", nameAr: "تقرت", domicile: 950, stopdesk: 670 },
  { code: "56", name: "Djanet", nameAr: "جانت", domicile: 0, stopdesk: 0 },
  { code: "57", name: "El M'Ghair", nameAr: "المغير", domicile: 950, stopdesk: 0 },
  { code: "58", name: "El Meniaa", nameAr: "المنيعة", domicile: 1000, stopdesk: 0 },
];

export function getShippingCost(wilayaCode: string, deliveryType: "DOMICILE" | "STOPDESK", subtotal: number): number {
  const wilaya = WILAYAS.find((w) => w.code === wilayaCode);
  if (!wilaya) return deliveryType === "STOPDESK" ? 300 : 500;
  return deliveryType === "STOPDESK" ? wilaya.stopdesk : wilaya.domicile;
}

export function getWilayaByCode(code: string): Wilaya | undefined {
  return WILAYAS.find((w) => w.code === code);
}
