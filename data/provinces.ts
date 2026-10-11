// The 31 provinces and how far each one is from the shop (Neyshabur, Khorasan Razavi).
// Carriers (Post, Tipax) price a parcel by weight and by distance in three steps:
// same province, a neighbouring province, a far province.

export type Zone = 'same' | 'near' | 'far';

export const ORIGIN_PROVINCE = 'خراسان رضوی';

// Provinces that touch Khorasan Razavi. If a carrier counts a province differently, change it here.
const NEAR_PROVINCES = ['خراسان شمالی', 'خراسان جنوبی', 'سمنان', 'یزد'];

export const PROVINCES: string[] = [
  'آذربایجان شرقی',
  'آذربایجان غربی',
  'اردبیل',
  'اصفهان',
  'البرز',
  'ایلام',
  'بوشهر',
  'تهران',
  'چهارمحال و بختیاری',
  'خراسان جنوبی',
  'خراسان رضوی',
  'خراسان شمالی',
  'خوزستان',
  'زنجان',
  'سمنان',
  'سیستان و بلوچستان',
  'فارس',
  'قزوین',
  'قم',
  'کردستان',
  'کرمان',
  'کرمانشاه',
  'کهگیلویه و بویراحمد',
  'گلستان',
  'گیلان',
  'لرستان',
  'مازندران',
  'مرکزی',
  'هرمزگان',
  'همدان',
  'یزد',
];

export function isProvince(value: unknown): value is string {
  return typeof value === 'string' && PROVINCES.includes(value);
}

export function provinceZone(province: string): Zone {
  if (province === ORIGIN_PROVINCE) return 'same';
  return NEAR_PROVINCES.includes(province) ? 'near' : 'far';
}
