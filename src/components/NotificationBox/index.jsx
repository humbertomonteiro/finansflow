import "./notificationBox.css";
import BtnDelete from "../BtnDelete";
import BtnDeleteMultiples from "../BtnDeleteMultiples";
import BtnSolve from "../BtnSolve";

export default function NotificationBox({
  setState,
  dataUser,
  actionSelected,
}) {
  return (
    <div className="handle-transactions">
      <div data-aos="zoom-in" className="box-notification">
        {actionSelected === "delete" ? (
          <h2>Tem certeza que quer apagar essa transação?</h2>
        ) : (
          <h2>Resolver essa transação?</h2>
        )}
        <div className="box-btns">
          {actionSelected === "delete" && (
            <BtnDelete setState={setState} dataUser={dataUser} />
          )}

          {dataUser.idTransaction && actionSelected === "delete" && (
            <BtnDeleteMultiples setState={setState} dataUser={dataUser} />
          )}

          {actionSelected === "solve" && (
            <BtnSolve setState={setState} dataUser={dataUser} />
          )}

          <button className="bg-up" onClick={() => setState(false)}>
            Não
          </button>
        </div>
      </div>
    </div>
  );
}
