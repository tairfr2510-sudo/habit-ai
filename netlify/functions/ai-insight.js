// Netlify Function (v2) - מריץ את הקריאה ל-Gemini בצד שרת כדי שמפתח ה-API
// לעולם לא יגיע לדפדפן. מפתח השרת מוגדר ב-Netlify כמשתנה סביבה בשם GEMINI_API_KEY
// (לא VITE_GEMINI_API_KEY - זה שם מיועד למשתני צד לקוח בלבד).
//
// כותרות ה-CORS נחוצות כי הבקשה יכולה להגיע גם מהאפליקציה הנייטיבית (Capacitor),
// שרצה מקורית שונה (capacitor://localhost) מזו של האתר עצמו.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const jsonResponse = (body, status) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
  });

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: 'GEMINI_API_KEY לא מוגדר בסביבת השרת.' }, 500);
  }

  let habits = [];
  try {
    const body = await req.json();
    habits = Array.isArray(body?.habits) ? body.habits : [];
  } catch {
    return jsonResponse({ error: 'גוף הבקשה אינו JSON תקין.' }, 400);
  }

  const prompt = `
    אני מנהל מעקב אחרי ההרגלים שלי ב-HabitAI. נתונים ב-JSON: ${JSON.stringify(habits)}.
    1. תן לי חיזוק חיובי קצרצר.
    2. זהה אזורים בהם אני מתקשה והצע אסטרטגיה אחת מעשית.
    ענה בפסקה זורמת אחת בעברית חמה ומעודדת, ללא רשימות.
  `;

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

  try {
    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: 'אתה מאמן אישי ידידותי בעברית.' }] }
      })
    });

    const data = await geminiResponse.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return jsonResponse({ error: 'לא התקבלה תשובה תקינה מה-AI.' }, 502);
    }

    return jsonResponse({ text }, 200);
  } catch (error) {
    return jsonResponse({ error: 'שגיאה בתקשורת עם Gemini.' }, 502);
  }
};

export const config = {
  path: '/api/ai-insight'
};
