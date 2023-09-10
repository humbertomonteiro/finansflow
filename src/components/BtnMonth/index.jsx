import "./btnMonth.css";
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import { useContext, useState } from "react";
import { UserContext } from "../../contexts/user";

const months = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export default function BtnMonth() {
  const { setMonthSearch, monthSearch, setYearSearch, yearSearch } =
    useContext(UserContext);
  const date = new Date();
  const currentYear = date.getFullYear();
  const [showInputDate, setShowInputDate] = useState(false);

  function handleBefore() {
    if (monthSearch > 1) {
      setMonthSearch(monthSearch - 1);
    } else {
      setMonthSearch(12);
      setYearSearch(yearSearch - 1);
    }
  }

  function handleNext() {
    if (monthSearch < 12) {
      setMonthSearch(monthSearch + 1);
    } else {
      setMonthSearch(1);
      setYearSearch(yearSearch + 1);
    }
  }

  function handleInputDate(e) {
    const dateInput = e.target.value;

    setYearSearch(Number(dateInput.split("-")[0]));
    setMonthSearch(
      dateInput.split("-")[1].split("")[0] !== "0"
        ? Number(dateInput.split("-")[1])
        : Number(dateInput.split("-")[1].split("0").join(""))
    );
  }

  return (
    <div className="btn-month">
      <button onClick={handleBefore}>
        <MdArrowBackIosNew />
      </button>
      <label>
        <h2 onClick={() => setShowInputDate(!showInputDate)}>
          {months[monthSearch - 1]}
        </h2>
        {showInputDate && (
          <input type="date" onChange={handleInputDate} id="input-date" />
        )}
      </label>
      <h3>{yearSearch === currentYear ? "" : yearSearch}</h3>
      <button onClick={handleNext}>
        <MdArrowForwardIos />
      </button>
    </div>
  );
}
