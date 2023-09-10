import { toast } from "react-toastify";
import { db } from "../../FirebaseConnection";
import { doc, updateDoc } from "firebase/firestore";
import { useContext } from "react";
import { UserContext } from "../../contexts/user";

export default function BtnSolve({ setState, dataUser }) {
  const { setLoading } = useContext(UserContext);

  async function handleDoneTransaction() {
    const docRef = doc(db, "transactions", dataUser.id);
    const isDone = dataUser.done;
    const obj = { ...dataUser, done: !isDone };

    setLoading(true);
    await updateDoc(docRef, obj).then(() => {
      const transactionLs = localStorage.getItem("@transactions");
      const parseTransactionsLs = JSON.parse(transactionLs);
      const solveTransaction = parseTransactionsLs.filter(
        (e) => e.id !== dataUser.id
      );

      solveTransaction.push(obj);

      localStorage.setItem("@transactions", JSON.stringify(solveTransaction));

      setLoading(false);
      setState(false);
      toast.success(isDone ? "Transação não resolvida" : "Transação resolvida");
    });
  }

  return (
    <button className="bg-normal" onClick={handleDoneTransaction}>
      Sim
    </button>
  );
}
