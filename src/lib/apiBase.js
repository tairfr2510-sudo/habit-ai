import { isNativePlatform } from './nativeReminders';

// כתובת ברירת המחדל של האתר ב-Netlify - משמשת רק כשהאפליקציה רצה כאפליקציה
// נייטיבית (Capacitor), כי שם אין שרת מקומי שמריץ את ה-Netlify Functions.
// אפשר לדרוס אותה בזמן build עם משתנה הסביבה VITE_API_BASE_URL אם הדומיין משתנה.
const DEFAULT_NATIVE_API_BASE = 'https://habitsai1.netlify.app';

// בדפדפן רגיל (כולל כשהאתר עצמו רץ על Netlify) משתמשים בנתיב יחסי, כי שם יש
// שרת אמיתי מאחורי אותו מקור (origin) שמריץ את ה-Function.
export const getApiBaseUrl = () => {
  if (!isNativePlatform()) return '';
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_NATIVE_API_BASE;
};
