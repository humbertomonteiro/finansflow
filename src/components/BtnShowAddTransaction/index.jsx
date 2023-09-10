import "./btnShowAddTransaction.css";
import { useContext } from "react";
import { UserContext } from "../../contexts/user";
import { AiOutlinePlus, AiOutlineMinus } from "react-icons/ai";

export default function BtnShowAddTransaction() {
  const { signed, setShowAddTransactions, showAddTransactions } =
    useContext(UserContext);

  function btnPlus() {
    setShowAddTransactions(true);
    window.scroll(0, 0);
  }

  return (
    <>
      {signed && (
        <div className="btn-show-add">
          {showAddTransactions ? (
            <button
              className="bg-down"
              onClick={() => setShowAddTransactions(false)}
            >
              <AiOutlineMinus />
            </button>
          ) : (
            <button className="bg-default" onClick={btnPlus}>
              <AiOutlinePlus />
            </button>
          )}
        </div>
      )}
    </>
  );
}
