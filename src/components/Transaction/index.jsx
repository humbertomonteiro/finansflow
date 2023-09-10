import "./transaction.css";
import {
  categoriesExpenses,
  categoriesRevenues,
} from "../../contexts/Categories";
import { MdDelete } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { BiSolidPencil } from "react-icons/bi";
import { AiFillCheckCircle, AiFillCloseCircle } from "react-icons/ai";

export default function Transaction({
  searchRef,
  data,
  setState,
  setData,
  setDelete,
  setSolve,
  setEdit,
}) {
  const currentDate = new Date();

  const categories = categoriesRevenues.concat(categoriesExpenses);

  function handleClient(data) {
    setState(true);
    setData(data);
  }

  function handleDeleteTransaction(data) {
    setDelete(true);
    setData(data);
  }

  function handleSolveTransaction(data) {
    setSolve(true);
    setData(data);
  }

  async function handleEditTransaction(e) {
    setEdit(true);
    setData(e);
  }

  return (
    <div key={data.id} className="transaction">
      {data.category === "Cliente" ? (
        <>
          <div>
            <div className="category bg-normal">
              <div>
                <CgProfile />
              </div>

              <span>{data.category}</span>
            </div>
          </div>
          <div
            className="client name-transactions"
            onClick={() => handleClient(data)}
          >
            <span>nome</span>
            <p searchRef={searchRef}>
              {data.name}
              {currentDate > new Date(data.date) && data.done === false && (
                <span>{data.date.split("-").reverse().join("/")}</span>
              )}
            </p>
          </div>
        </>
      ) : (
        <>
          <div>
            <div
              className={
                data.value > 0 ? "category revenue" : "category expensive"
              }
            >
              {categories.map(
                (a) =>
                  a.name === data.category && <div key={data.id}>{a.icon}</div>
              )}
              <span>{data.category}</span>
            </div>
          </div>
          <div className="name-transaction">
            <span>nome</span>
            <p searchRef={searchRef}>
              {data.name}
              {currentDate > new Date(data.date) && data.done === false && (
                <span>{data.date.split("-").reverse().join("/")}</span>
              )}
            </p>
          </div>
        </>
      )}
      <div>
        <span>Valor</span>
        <p>{`R$ ${String(data.value).split(".").join(",")}`}</p>
      </div>
      <div className="icon" onClick={() => handleEditTransaction(data)}>
        <BiSolidPencil />
      </div>
      <div className="icon" onClick={() => handleDeleteTransaction(data)}>
        <MdDelete />
      </div>
      <div className="icon" onClick={() => handleSolveTransaction(data)}>
        {data.done ? (
          <AiFillCheckCircle className="up" />
        ) : (
          <AiFillCloseCircle className="down" />
        )}
      </div>
    </div>
  );
}
