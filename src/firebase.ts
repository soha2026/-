import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot, collection } from "firebase/firestore";
import { UserChecklist } from "./types";

let db: any = null;

// Initialize firebase dynamically or return null if config is missing
export async function getFirebaseDB() {
  if (db) return db;
  try {
    const response = await fetch("/firebase-applet-config.json");
    if (!response.ok) {
      return null;
    }
    const config = await response.json();
    if (!config || !config.apiKey) {
      return null;
    }
    
    let app;
    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
    return db;
  } catch (e) {
    console.warn("Firebase is not initialized or config not found. Falling back to local storage.", e);
    return null;
  }
}

// Save a checklist to Firestore
export async function saveUserChecklist(userId: string, data: UserChecklist) {
  const database = await getFirebaseDB();
  if (!database) {
    // Fallback: save to localStorage
    const saved = localStorage.getItem("book_rotation_checklists");
    const current = saved ? JSON.parse(saved) : {};
    current[userId] = data;
    localStorage.setItem("book_rotation_checklists", JSON.stringify(current));
    return;
  }

  try {
    const userDocRef = doc(database, "checklists", userId);
    await setDoc(userDocRef, data, { merge: true });
  } catch (e) {
    console.error(`Failed to save checklist for ${userId} to Firestore:`, e);
  }
}

// Subscribe to all checklists in Firestore
export function subscribeToChecklists(
  onUpdate: (data: Record<string, UserChecklist>) => void,
  fallbackData: Record<string, UserChecklist>
) {
  let unsubscribe: (() => void) | null = null;

  getFirebaseDB().then((database) => {
    if (!database) {
      // If no database, trigger update with fallback immediately
      onUpdate(fallbackData);
      return;
    }

    try {
      const colRef = collection(database, "checklists");
      unsubscribe = onSnapshot(colRef, (snapshot) => {
        const updated: Record<string, UserChecklist> = { ...fallbackData };
        snapshot.forEach((doc) => {
          updated[doc.id] = doc.data() as UserChecklist;
        });
        onUpdate(updated);
      }, (error) => {
        console.error("Firestore onSnapshot error, falling back to local storage:", error);
        onUpdate(fallbackData);
      });
    } catch (e) {
      console.error("Failed to setup Firestore subscription:", e);
      onUpdate(fallbackData);
    }
  });

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}
