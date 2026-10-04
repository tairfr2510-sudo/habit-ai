# HabitAI לשעון גרמין (Forerunner 265)

אפליקציית Connect IQ: glance עם ההתקדמות של היום, ובלחיצה עליו רשימת ההרגלים
הפתוחים להיום עם אפשרות לסמן. הנתונים מגיעים מהאפליקציה בטלפון
(`android/.../GarminBridge.java`) דרך Garmin Connect - זה אותו snapshot שהוויג'ט
במסך הבית מציג.

## בנייה

1. להתקין את [Connect IQ SDK Manager](https://developer.garmin.com/connect-iq/sdk/),
   להתחבר עם חשבון גרמין, ולהוריד את ה-SDK העדכני ואת המכשיר Forerunner 265.
2. מפתח מפתח (`developer_key.der`) נמצא בתיקייה הזו ולא עולה לגיט. אם הוא חסר:
   ```sh
   openssl genrsa -out developer_key.pem 4096
   openssl pkcs8 -topk8 -inform PEM -outform DER -in developer_key.pem -out developer_key.der -nocrypt
   ```
3. בנייה (`-r` = גרסה לשעון; בלי `-r` נטענים נתוני דוגמה לסימולטור, ראה `DebugSeed.mc`):
   ```sh
   monkeyc -d fr265 -f monkey.jungle -o bin/HabitAI.prg -y developer_key.der -r
   ```
4. התקנה: לחבר את השעון בכבל ולהעתיק את `bin/HabitAI.prg` לתיקייה `GARMIN/APPS` בשעון.

ה-id ב-`manifest.xml` חייב להתאים ל-`WATCH_APP_ID` ב-`GarminBridge.java`.
