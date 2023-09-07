import { BsLink45Deg } from 'react-icons/bs'

export default function ShowClient({ setState, dataUser, }) {
    return (
        <div className="handle-transactions">
            <div data-aos='zoom-in' className="box">
                <h2>Dados do cliente</h2>
                <p>
                    <strong>Nome:</strong>
                    {dataUser.name}
                </p>

                <p>
                    <strong>Valor:</strong>
                    R$ {Number(dataUser.value).toFixed(2)}
                </p>

                <p>
                    <strong>Endereço:</strong>
                    <a href={`https://www.google.com/maps/search/termo+${dataUser.adress}`}
                    target='_blank'
                    rel="noreferrer">
                        <BsLink45Deg />{dataUser.adress}
                    </a>
                </p>

                <p>
                    <strong>Telefone:</strong>
                    <a href={`https://wa.me/${dataUser.number}`}
                    target='_blank'
                    rel="noreferrer">
                        <BsLink45Deg />{dataUser.number}
                    </a>
                </p>

                <p>
                    <strong>Informações:</strong>
                    {dataUser.infos}
                </p>

                <div className='box-btns'>
                    <button 
                    className='bg-down' 
                    onClick={() => setState(false)}>
                        Fechar
                    </button>

                </div>
            </div>
        </div>
    )
}