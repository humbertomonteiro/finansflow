import "./searchTransactions.css";
import { BsSearch } from "react-icons/bs";

export default function SearchTransactions({ state, setState }) {
  function handleSearch(e) {
    setState(e.target.value);
  }

  return (
    <label className="search">
      <BsSearch />
      <input
        type="text"
        placeholder="Pesquisar transação..."
        value={state}
        onChange={handleSearch}
      />
    </label>
  );
}
