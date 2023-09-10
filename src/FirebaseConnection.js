import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB4m6-8Nf9YFWrByNf19xcw6G6y9385nYM",
  authDomain: "mymanager-1edff.firebaseapp.com",
  projectId: "mymanager-1edff",
  storageBucket: "mymanager-1edff.appspot.com",
  messagingSenderId: "250168340304",
  appId: "1:250168340304:web:74b2cc6655518075c4c655",
  measurementId: "G-H0MH1H0D8G",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
