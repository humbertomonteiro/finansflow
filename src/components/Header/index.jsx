import "./header.css";
import { Link } from "react-router-dom";
import { BsCardChecklist } from "react-icons/bs";
import { FaCommentsDollar } from "react-icons/fa6";
import { AiOutlineHome } from "react-icons/ai";
// import { IoMdSettings } from 'react-icons/io' IoBook
import { IoSettingsOutline } from "react-icons/io5";
import { useContext } from "react";
import { UserContext } from "../../contexts/user";
import { FaArrowRightToBracket } from "react-icons/fa6";
import { AiOutlineFund } from "react-icons/ai";

export default function Header() {
  const { signed, user, setShowAddTransactions } = useContext(UserContext);

  return (
    <header>
      <Link
        onClick={() => setShowAddTransactions(false)}
        data-aos="fade-left"
        className="logo"
        to={signed ? "/dashboard" : "/"}
      >
        FinansFlow
        <FaCommentsDollar />
      </Link>

      {signed ? (
        <>
          <nav className={"navbar"}>
            <Link onClick={() => setShowAddTransactions(false)} to="/dashboard">
              <AiOutlineHome /> <span>Dashboard</span>
            </Link>
            <Link
              onClick={() => setShowAddTransactions(false)}
              to="/transactions/all"
            >
              <BsCardChecklist /> <span>Transações</span>
            </Link>
            <Link
              onClick={() => setShowAddTransactions(false)}
              to="/performance"
            >
              <AiOutlineFund /> <span>Desempenho</span>
            </Link>
            <Link onClick={() => setShowAddTransactions(false)} to="/settings">
              <IoSettingsOutline /> <span>Configurações</span>
            </Link>
          </nav>

          <Link
            onClick={() => setShowAddTransactions(false)}
            to="/account"
            className={"header-account"}
          >
            <img
              src={
                user.avatarUrl
                  ? user.avatarUrl
                  : require("../../assets/imgs/avater-default.jpg")
              }
              alt=""
            />
          </Link>
        </>
      ) : (
        <>
          <nav className={"navbar"}>
            {/* <Link to='/'><AiOutlineHome /> <span>Home</span></Link> */}
            {/* <Link to='/'><IoBook /> <span>Educação</span></Link> */}
            {/* <Link to='/'><IoMdSettings /> <span>Sobre</span></Link> */}
          </nav>

          <Link className={"btn-header"} to="/login">
            Login <FaArrowRightToBracket />
          </Link>
        </>
      )}
    </header>
  );
}
