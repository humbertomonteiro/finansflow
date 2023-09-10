import { useContext } from "react";
import { UserContext } from "../../contexts/user";
import { toast } from "react-toastify";

const currentDate = new Date();

export default function BtnDeleteMultiples({ setState, dataUser }) {
  const { deleteFirebase } = useContext(UserContext);

  function handleDeleteTransactions() {
    const getTransactionsLs = localStorage.getItem("@transactions");
    const transactionsLs = JSON.parse(getTransactionsLs);

    const idTransaction = dataUser.idTransaction;
    const thisAndNexts = transactionsLs
      .filter((e) => e.idTransaction === idTransaction)
      .filter((e) => {
        const filterDate = new Date(e.date);
        return filterDate >= currentDate;
      });

    thisAndNexts.forEach((doc) => {
      deleteFirebase(doc.id, "transactions");
    });
    setState(false);
    toast.success("Transações deletadas com sucesso!");
  }

  return (
    <button className="bg-normal" onClick={handleDeleteTransactions}>
      Apagar esta e as próximas.
    </button>
  );
}
