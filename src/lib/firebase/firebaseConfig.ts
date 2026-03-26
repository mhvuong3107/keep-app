import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCDyiWQnerwpKfhjPSO9CI-l0wz9xLQb3A",
  authDomain: "keep-notes-demo.firebaseapp.com",
  projectId: "keep-notes-demo",
  storageBucket: "keep-notes-demo.firebasestorage.app",
  messagingSenderId: "908492139455",
  appId: "1:908492139455:web:636c100a1f18fb7c8ccf0a",
  measurementId: "G-8SPPH2W61E"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app)
