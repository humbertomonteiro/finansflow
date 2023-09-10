import { createContext, useState, useEffect } from "react";
import { auth, db } from "../FirebaseConnection";
import {
  createUserWithEmailAndPassword,
  signOut,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  collection,
  deleteDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const UserContext = createContext({});

export default function UserProvider({ children }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const currentDate = new Date();
  let [monthSearch, setMonthSearch] = useState(currentDate.getMonth() + 1);
  let [yearSearch, setYearSearch] = useState(currentDate.getFullYear());

  const [showAddTransactions, setShowAddTransactions] = useState(false);

  useEffect(() => {
    async function handleTransactions() {
      const transactionsFs = collection(db, "transactions");
      const q = query(
        transactionsFs,
        where("user", "==", user ? user.uid : null)
      );

      await getDocs(q).then((snapshot) => {
        let listTransactions = [];

        snapshot.forEach((doc) => {
          listTransactions.push({
            id: doc.id,
            value: Number(doc.data().value).toFixed(2),
            name: doc.data().name,
            date: doc.data().date,
            category: doc.data().category,
            times: doc.data().times,
            adress: doc.data().adress,
            number: doc.data().number,
            done: doc.data().done,
            infos: doc.data().infos,
            idTransaction: doc.data().idTransaction,
          });
        });

        localStorage.setItem("@transactions", JSON.stringify(listTransactions));
        setTransactions(listTransactions);
      });
    }
    handleTransactions();
  }, [user]);

  useEffect(() => {
    async function checkLogin() {
      const lSUser = localStorage.getItem("@dataUserManager");

      if (lSUser) {
        setUser(JSON.parse(lSUser));
        setLoading(false);
      }

      setLoading(false);
    }

    checkLogin();
  }, []);

  function setTransactionsLs() {
    const getTransactionsLs = localStorage.getItem("@transactions");
    setTransactions(JSON.parse(getTransactionsLs));
  }

  async function signUp(name, email, password) {
    setLoadingAuth(true);

    await createUserWithEmailAndPassword(auth, email, password)
      .then(async (value) => {
        let uid = value.user.uid;

        await setDoc(doc(db, "users", uid), {
          name: name,
          avatarUrl: null,
        }).then(() => {
          let data = {
            uid: uid,
            name: name,
            email: value.user.email,
            avatarUrl: null,
          };

          setUser(data);
          storageUser(data);
          setLoadingAuth(false);
          navigate("/dashboard");
          toast.success(`Seja bem-vindo(a) ao nosso sistema ${data.name}`);
        });
      })
      .catch((error) => {
        toast.error(`Erro ao cadastrar! ${error}`);
        setLoadingAuth(false);
      });
  }

  async function signIn(email, password) {
    setLoadingAuth(true);

    await signInWithEmailAndPassword(auth, email, password)
      .then(async (value) => {
        let uid = value.user.uid;

        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        let data = {
          uid: uid,
          name: docSnap.data().name,
          email: value.user.email,
          avatarUrl: docSnap.data().avatarUrl,
        };

        if (localStorage.getItem("@transactions") === null) {
          localStorage.setItem("@transactions", JSON.stringify([]));
        }

        setUser(data);
        storageUser(data);
        setLoadingAuth(false);
        toast.success(`Bem-vindo(a) de volta!`);
        navigate("/dashboard");
      })
      .catch((error) => {
        setLoadingAuth(false);
        toast.error(`Erro ao fazer login! Error: ${error}`);
      });
  }

  async function logOut() {
    setLoadingAuth(true);

    await signOut(auth)
      .then(() => {
        localStorage.removeItem("@dataUserManager");
        localStorage.removeItem("@transactions");
        setUser(null);
        toast.success("Vecê está deslogado!");
        setLoadingAuth(false);
        navigate("/");
      })
      .catch((error) => toast.error("Error" + error));
  }

  function storageUser(data) {
    localStorage.setItem("@dataUserManager", JSON.stringify(data));
  }

  async function deleteFirebase(id, fb) {
    const docRef = doc(db, fb, id);

    const transactionsLs = localStorage.getItem("@transactions");
    let parseTransactionsLs = JSON.parse(transactionsLs);

    const currentData = parseTransactionsLs.filter((e) => e.id !== id);

    localStorage.setItem("@transactions", JSON.stringify(currentData));

    setLoading(true);
    await deleteDoc(docRef).then(() => {
      setLoading(false);
    });
  }

  return (
    <UserContext.Provider
      value={{
        signed: !!user,
        user,
        loadingAuth,
        loading,
        setLoading,
        signUp,
        signIn,
        logOut,
        storageUser,
        setUser,
        transactions,
        setTransactions,
        deleteFirebase,
        monthSearch,
        setMonthSearch,
        yearSearch,
        setYearSearch,
        setTransactionsLs,
        showAddTransactions,
        setShowAddTransactions,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
