import './formEditTransaction.css'
import { db } from "../../FirebaseConnection"
import { doc, updateDoc } from "firebase/firestore"
import { toast } from "react-toastify"
import { useState, useContext } from "react"
import { UserContext } from "../../contexts/user"

export default function FormEditTransaction({ setState, dataUser, actionSelected }) {

    const { setLoading } = useContext(UserContext)

    const [ name, setName ] = useState(dataUser.name)
    const [ date, setDate ] = useState(dataUser.date)
    const [ value, setValue ] = useState(dataUser.value)
    const [ adress, setAdress ] = useState(dataUser.adress)
    const [ number, setNumber ] = useState(dataUser.number)
    const [ infos, setInfos ] = useState(dataUser.infos)

    async function handleEditTransaction(e) {
        e.preventDefault()
        
        const docRef = doc(db, 'transactions', dataUser.id)
        setLoading(true)

        let data = {
            ...dataUser,
            name: name,
            value: value,
            date: date,
            adress: adress,
            number: number,
            infos: infos
        }

        await updateDoc(docRef, data)
        .then(() => {

            const transactionLs = localStorage.getItem('@transactions')
            const parseTransactionLs = JSON.parse(transactionLs)
            const transactionUpdate = parseTransactionLs.filter(e => e.id !== dataUser.id)

            transactionUpdate.push(data)

            localStorage.setItem('@transactions', JSON.stringify(transactionUpdate))

            setLoading(false)
            setState(false)
            toast.success('Atualizado com sucesso!')
        })
        .catch(error => {
            setLoading(false)
            setState(false)
            toast.error(`error: ${error}`)
        })
    }

    return (
        <div className="handle-transactions">
            <div data-aos='zoom-in' className="transaction-edit">
                <h2>Editar transação</h2>
                <form onSubmit={handleEditTransaction}>
                    <label>
                        <p>Valor</p>
                        <input type="text"
                        value={value}
                        onChange={e => setValue(e.target.value)} />
                    </label>
                    <label>
                        <p>Nome</p>
                        <input type="text"
                        value={name}
                        onChange={e => setName(e.target.value)} />
                    </label>
                    <label>
                        <p>Data</p>
                        <input type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)} />
                    </label>
                    {
                        actionSelected === 'client' && 
                        <>
                            <label>
                                <p>Endereço</p>
                                <input type="text"
                                value={adress}
                                onChange={e => setAdress(e.target.value)} />
                            </label>
                            <label>
                                <p>Telefone</p>
                                <input type="text"
                                value={number}
                                onChange={e => setNumber(e.target.value)} />
                            </label>
                            <label>
                                <p>Informações</p>
                                <input type="text"
                                value={infos}
                                onChange={e => setInfos(e.target.value)} />
                            </label>
                        </>
                    }
                    <button
                    type='submit'
                    className={Number(value) < 0 ? 'btn-edit-not no-border bg-down' : 'btn-edit-not no-border bg-up'}>Editar</button>
                </form>

                <button 
                onClick={e => setState(false)}
                className='no-border bg-down btn btn-edit'>
                    Cancelar
                </button>
            </div>
        </div>
    )
}