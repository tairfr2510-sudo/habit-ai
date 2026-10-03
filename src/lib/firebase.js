import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserPopupRedirectResolver
} from 'firebase/auth';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

// הערכים האלה ציבוריים מטבעם (הם נשלחים לכל דפדפן שטוען את האפליקציה).
// ההגנה על הנתונים נעשית בחוקי האבטחה של Firestore - כל משתמש ניגש רק ל-users/{uid} שלו.
const firebaseConfig = {
  apiKey: 'AIzaSyBM2UcaC17M_IfXIHmKVrDTU3dDM1AImLk',
  authDomain: 'habit-ai-35ee3.firebaseapp.com',
  projectId: 'habit-ai-35ee3',
  storageBucket: 'habit-ai-35ee3.firebasestorage.app',
  messagingSenderId: '1051942806475',
  appId: '1:1051942806475:web:2ce357f5af1bda227a4c4e'
};

export const firebaseApp = initializeApp(firebaseConfig);

// initializeAuth במקום getAuth: מאפשר לשמור את ההתחברות ב-IndexedDB גם בתוך ה-WebView של Capacitor
export const auth = initializeAuth(firebaseApp, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  popupRedirectResolver: browserPopupRedirectResolver
});

// מטמון מקומי: כתיבות שנעשות בלי אינטרנט נשמרות ונשלחות אוטומטית כשהחיבור חוזר
export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache()
});
