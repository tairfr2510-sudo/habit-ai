import { useState, useEffect, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  signOut as firebaseSignOut,
  GoogleAuthProvider
} from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { collection, doc, getDocsFromServer, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { isNativePlatform } from './nativeReminders';

// המכשיר שכבר סונכרן מול החשבון הזה. כל עוד הוא לא מוגדר (מכשיר חדש / החלפת חשבון)
// עושים יישור ראשוני מול הענן לפני שמתחילים לשלוח ולקבל שינויים.
const SYNCED_UID_KEY = 'habitSync_uid';

const readSyncedUid = () => {
  try { return localStorage.getItem(SYNCED_UID_KEY); } catch { return null; }
};
const writeSyncedUid = (uid) => {
  try {
    if (uid) localStorage.setItem(SYNCED_UID_KEY, uid);
    else localStorage.removeItem(SYNCED_UID_KEY);
  } catch { /* אין גישה ל-localStorage - נעשה יישור ראשוני שוב בפעם הבאה */ }
};

// סנכרון הנתונים מול Firestore. כל מפתח נשמר כמסמך נפרד ב-users/{uid}/state/{key}
// (כמחרוזת JSON, כדי לא להיתקל במגבלות של Firestore על undefined ומערכים מקוננים).
// values / setters: אובייקטים עם אותם מפתחות, למשל { habits }, { habits: setHabits }.
// status: 'signed-out' | 'syncing' | 'synced' | 'offline' | 'error'
export function useCloudSync({ isLoaded, values, setters, showToast }) {
  const [user, setUser] = useState(undefined); // undefined = עוד לא ידוע
  const [status, setStatus] = useState('signed-out');
  const [ready, setReady] = useState(false);
  const [conflict, setConflict] = useState(null); // { remote: { [key]: { json, updatedAt } } }

  const valuesJson = {};
  for (const key of Object.keys(values)) valuesJson[key] = JSON.stringify(values[key]);

  const currentJsonRef = useRef(valuesJson);
  currentJsonRef.current = valuesJson;
  const settersRef = useRef(setters);
  settersRef.current = setters;
  // ה-JSON האחרון שידוע שזהה בין המכשיר לענן, לכל מפתח - מונע שליחה חוזרת של מה שהגיע מהענן
  const lastSyncedRef = useRef({});

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const applyRemote = (remote) => {
    for (const [key, { json }] of Object.entries(remote)) {
      if (!settersRef.current[key]) continue;
      lastSyncedRef.current[key] = json;
      if (json !== currentJsonRef.current[key]) settersRef.current[key](JSON.parse(json));
    }
  };

  const pushKeys = (uid, keys) => {
    for (const key of keys) {
      const json = currentJsonRef.current[key];
      lastSyncedRef.current[key] = json;
      setDoc(doc(db, 'users', uid, 'state', key), { json, updatedAt: Date.now() })
        .catch(err => {
          console.error('שמירה לענן נכשלה', key, err);
          setStatus('error');
        });
    }
  };

  // יישור ראשוני מול הענן במכשיר שעוד לא סונכרן
  useEffect(() => {
    setReady(false);
    setConflict(null);
    lastSyncedRef.current = {};
    if (!user) {
      setStatus('signed-out');
      return;
    }
    if (!isLoaded) return;

    // מכשיר שכבר סונכרן: לא צריך יישור - ההאזנה למטה תביא את הגרסה העדכנית מהענן,
    // ושינויים שנעשו בלי אינטרנט כבר מחכים בתור של Firestore
    if (readSyncedUid() === user.uid) {
      setReady(true);
      return;
    }

    let cancelled = false;
    const reconcile = async () => {
      setStatus('syncing');
      let snap;
      try {
        // דווקא מהשרת: מטמון ריק במכשיר חדש ייראה כמו ענן ריק ויגרום לדריסת הנתונים בענן
        snap = await getDocsFromServer(collection(db, 'users', user.uid, 'state'));
      } catch (err) {
        console.warn('אין חיבור לענן, ננסה שוב כשהאינטרנט יחזור', err);
        if (!cancelled) setStatus('offline');
        return;
      }
      if (cancelled) return;

      const remote = {};
      snap.forEach(d => {
        if (d.id in currentJsonRef.current) remote[d.id] = d.data();
      });
      const keys = Object.keys(currentJsonRef.current);
      const remoteKeys = Object.keys(remote);
      const differs = remoteKeys.some(k => remote[k].json !== currentJsonRef.current[k]);

      if (remoteKeys.length === 0) {
        // ענן ריק - המכשיר הזה הוא הראשון, מעלים את מה שיש בו
        pushKeys(user.uid, keys);
      } else if (!differs) {
        applyRemote(remote);
        pushKeys(user.uid, keys.filter(k => !(k in remote)));
      } else {
        // מכשיר חדש עם נתונים אחרים מהענן - המשתמש מחליט מה לשמור
        setConflict({ remote });
        return;
      }
      writeSyncedUid(user.uid);
      setReady(true);
    };

    reconcile();
    const onOnline = () => { if (!cancelled) reconcile(); };
    window.addEventListener('online', onOnline);
    return () => {
      cancelled = true;
      window.removeEventListener('online', onOnline);
    };
  }, [user, isLoaded]);

  const resolveConflict = (choice) => {
    if (!conflict || !user) return;
    const keys = Object.keys(currentJsonRef.current);
    if (choice === 'cloud') {
      applyRemote(conflict.remote);
      pushKeys(user.uid, keys.filter(k => !(k in conflict.remote)));
    } else {
      pushKeys(user.uid, keys);
    }
    setConflict(null);
    writeSyncedUid(user.uid);
    setReady(true);
  };

  // האזנה לשינויים שמגיעים ממכשירים אחרים
  useEffect(() => {
    if (!ready || !user) return;
    setStatus('synced');
    const unsubs = Object.keys(currentJsonRef.current).map(key =>
      onSnapshot(
        doc(db, 'users', user.uid, 'state', key),
        (d) => {
          if (!d.exists()) {
            // אין עדיין מסמך כזה בענן - מעלים את הגרסה המקומית
            if (!d.metadata.fromCache) pushKeys(user.uid, [key]);
            return;
          }
          const data = d.data();
          if (d.metadata.hasPendingWrites) {
            // כתיבה שלנו שעוד לא אושרה (למשל מהפעם הקודמת, בלי אינטרנט)
            if (lastSyncedRef.current[key] === undefined) lastSyncedRef.current[key] = data.json;
            return;
          }
          applyRemote({ [key]: data });
        },
        (err) => {
          console.error('האזנה לענן נכשלה', key, err);
          setStatus('error');
        }
      )
    );
    return () => unsubs.forEach(u => u());
  }, [ready, user]);

  // שליחת שינויים מקומיים לענן. מפתח שעוד לא התקבלה עבורו גרסה מהענן לא נשלח,
  // כדי שמכשיר שנפתח עם נתונים ישנים לא ידרוס שינויים שנעשו במכשיר אחר
  const valuesSignature = Object.values(valuesJson).join('\u0000');
  useEffect(() => {
    if (!ready || !user) return;
    const changed = Object.keys(currentJsonRef.current).filter(k =>
      lastSyncedRef.current[k] !== undefined && currentJsonRef.current[k] !== lastSyncedRef.current[k]
    );
    if (changed.length) pushKeys(user.uid, changed);
  }, [valuesSignature, ready, user]);

  const signIn = async () => {
    if (isNativePlatform()) {
      // בטלפון: בחירת החשבון נעשית בחלון של אנדרואיד, ואת הטוקן שמתקבל מעבירים ל-SDK של הדפדפן
      // (skipNativeAuth ב-capacitor.config.json), כך שהסנכרון עובד בדיוק כמו במחשב
      try {
        const result = await FirebaseAuthentication.signInWithGoogle();
        const credential = GoogleAuthProvider.credential(result.credential?.idToken);
        await signInWithCredential(auth, credential);
      } catch (err) {
        console.error('התחברות נכשלה', err);
        if (!/cancel/i.test(String(err?.message))) showToast?.('ההתחברות נכשלה, נסה שוב');
      }
      return;
    }
    const provider = new GoogleAuthProvider();
    // תמיד להציג את רשימת החשבונות של Google, כדי לבחור חשבון בלחיצה אחת
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      if (err?.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, provider);
      } else if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        console.error('התחברות נכשלה', err);
        showToast?.('ההתחברות נכשלה, נסה שוב');
      }
    }
  };

  const signOut = async () => {
    // הנתונים נשארים במכשיר; בהתחברות הבאה ייעשה יישור ראשוני מחדש
    writeSyncedUid(null);
    if (isNativePlatform()) await FirebaseAuthentication.signOut().catch(() => {});
    await firebaseSignOut(auth);
  };

  return { user, status, conflict, resolveConflict, signIn, signOut };
}
