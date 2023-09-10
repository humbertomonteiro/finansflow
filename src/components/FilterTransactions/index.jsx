import "./filterTransactions.css";
import { Link, useParams } from "react-router-dom";
import { FaFileInvoiceDollar, FaUserFriends } from "react-icons/fa";
import {
  BsFillArrowUpCircleFill,
  BsFillArrowDownCircleFill,
} from "react-icons/bs";
import { useState, useEffect } from "react";

export default function FilterTransactions() {
  const [getType, setGetType] = useState("");
  const { type } = useParams();

  useEffect(() => {
    function setTypeTransactions() {
      switch (type) {
        case "all":
          setGetType("Todas as Transações");
          break;
        case "revenues":
          setGetType("Todas as Receitas");
          break;
        case "expenses":
          setGetType("Todas as Despesas");
          break;
        case "clients":
          setGetType("Todos os seus Clientes");
          break;
      }
    }
    setTypeTransactions();
  }, [type]);

  return (
    <div data-aos="zoom-in" className="btn-filters-transactions">
      <div className="links">
        <Link className="bg-default" to="/transactions/all">
          <FaFileInvoiceDollar /> Transações
        </Link>
        <Link className="bg-up" to="/transactions/revenues">
          <BsFillArrowUpCircleFill /> Receitas
        </Link>
        <Link className="bg-down" to="/transactions/expenses">
          <BsFillArrowDownCircleFill />
          Despesas
        </Link>
        <Link className="bg-normal" to="/transactions/clients">
          <FaUserFriends />
          Clientes
        </Link>
      </div>
      <h2>{getType}</h2>
    </div>
  );
}
