import './transactions.css'
import { useContext, useState, useEffect } from 'react'
import { UserContext } from '../../contexts/user'
import { db } from '../../FirebaseConnection'
import { doc, updateDoc } from 'firebase/firestore'
import Pendency from '../../components/Pendency'
import { MdDelete } from 'react-icons/md'
import { CgProfile } from 'react-icons/cg'
import { BiSolidPencil } from 'react-icons/bi'
import { FaFileInvoiceDollar } from 'react-icons/fa'
import { BsFillArrowUpCircleFill, BsFillArrowDownCircleFill, BsLink45Deg } from 'react-icons/bs'
import { AiFillCheckCircle, AiFillCloseCircle } from 'react-icons/ai'
import BtnMonth from '../../components/BtnMonth'
import { toast } from 'react-toastify'
import { useParams, Link } from 'react-router-dom'

const currentDate = new Date()

export default function Transactions() {

    const { type } = useParams()

    const [ deleteTransaction, setDeleteTransaction ] = useState(false)
    const [ editTransaction, setEditTransaction ] = useState(false)
    const [ doneTransaction, setDoneTransaction ] = useState(false)
    const [ idTransaction, setIdTransaction ] = useState('')
    const [ dataUser, setDataUser ] = useState({})

    const [ name, setName ] = useState('')
    const [ category, setCategory ] = useState('')
    const [ date, setDate ] = useState('')
    const [ value, setValue ] = useState('')
    const [ done, setDone ] = useState('')
    const [ adress, setAdress ] = useState('')
    const [ number, setNumber ] = useState('')
    const [ id, setId ] = useState('')
    const [ days, setDays ] = useState([])
    const [ typeTransactions, setTypeTransactions ] = useState([])
    const [ showClient, setShowClient ] = useState(false)

    const { transactions, 
        categoriesRevenues, 
        categoriesExpenses, 
        deleteFirebase,
        setLoading,
        monthSearch,
        yearSearch } = useContext(UserContext)

    const categories = categoriesRevenues.concat(categoriesExpenses)

    useEffect(() => {
        function generationArraysByTypes() {
            let typeTransactions = transactions.filter(t => {
                if(type === 'all') {
                    return t
                } else if(type === 'revenues' || type === 'revenuesPendency' || type === 'clients') {
                    return t.value > 0
                } else if(type ===  'expenses' || type === 'expensesPendency') {
                    return t.value < 0
                }
            })

            let allTransactions = typeTransactions
                .filter(e => {
                    const filterDate = new Date(e.date)
                    return filterDate.getMonth() + 1 === monthSearch 
                    && filterDate.getFullYear() === yearSearch
                })

            let clientsTransactions = typeTransactions
                .filter(e => e.category === 'Cliente')
                .filter(e => {
                    const filterDate = new Date(e.date)
                    return filterDate.getMonth() + 1 === monthSearch 
                    && filterDate.getFullYear() === yearSearch
                })

            let pendencysTransactions = typeTransactions
                .filter(e => e.done === false)
                .filter(e => {
                    const filterDate = new Date(e.date)
                    return filterDate < currentDate
                })

            if(type === 'all' || type === 'revenues' || type === 'expenses') {
                generationDays(allTransactions)
            } else if(type === 'clients') {
                generationDays(clientsTransactions)
            } else if(type === 'revenuesPendency' ||type === 'expensesPendency'){
                generationDays(pendencysTransactions)
            }

        }
        
        generationArraysByTypes()

    }, [monthSearch, type, transactions, yearSearch])

    function generationDays(array) {
        const days = array.map(e => String(e.date).split('-')[2])
        const unique = days.filter((e, a) => days.indexOf(e) === a)
        const uniqueNumber = unique.map(e => Number(e))
        const daysDec = uniqueNumber.sort((a, i) => {
            if(a > i) return 1
            if(a < i) return -1
            return 0
        })

        setDays(daysDec)
        setTypeTransactions(array)
    }

    function handleTransaction(set, state, id, data) {
        set(!state)
        setIdTransaction(id)
        setDataUser(data)

        setName(data.name)
        setValue(data.value)
        setCategory(data.category)
        setDate(data.date)
        setDone(data.done)
        setNumber(data.number)
        setAdress(data.adress)
        setId(data.id)
    }

    function handleDeleteTransaction() {
        deleteFirebase(idTransaction, 'transactions')
        setDeleteTransaction(false)
        toast.success('Deletado com sucesso!')
    }

    async function handleDoneTransaction() {
        const docRef = doc(db, 'transactions', idTransaction)
        const isDone = dataUser.done
        const obj = {...dataUser, done: !isDone }

        setLoading(true)
        await updateDoc(docRef, obj)
            .then(() => {

                setLoading(false)
                setDoneTransaction(false)
                toast.success(isDone ? 'Transação não resolvida' : 
                'Transação resolvida')
            })
    }

    function handleDeleteTransactions() {

        const idTransaction = dataUser.idTransaction
        const thisAndNexts = transactions
        .filter(e => e.idTransaction === idTransaction)
        .filter(e => {
            const filterDate = new Date(e.date)
            return filterDate >= currentDate
        })

        thisAndNexts.forEach(doc => {
            deleteFirebase(doc.id, 'transactions')
        })
        toast.success('Transações deletadas com sucesso!')

    }

    async function handleEditTransaction(e) {
        e.preventDefault()
        
        const docRef = doc(db, 'transactions', idTransaction)
        setLoading(true)
        await updateDoc(docRef, {
            ...dataUser,
            name: name,
            category: category,
            value: value,
            date: date,
            done: done
        })
        .then(() => {
            setLoading(false)
            setEditTransaction(false)
            toast.success('Atualizado com sucesso!')
        })
        .catch(error => {
            setLoading(false)
            setEditTransaction(false)
            toast.error(`error: ${error}`)
        })
    }

    // function handleEditTransactions(e) {
    //     e.preventDefault()

    //     const idTransaction = dataUser.idTransaction
    //     const thisAndNexts = transactions
    //     .filter(e => e.idTransaction === idTransaction)
    //     .filter(e => {
    //         const filterDate = new Date(e.date)
    //         return filterDate >= currentDate
    //     })

    //     thisAndNexts.forEach(e => {
    //         const docRef = doc(db, 'transactions', e.id)

    //         setLoading(true)
    //         const dateSplit = date.split('-')
    //         let year = Number(dateSplit[2])
    //         let month = Number(dateSplit[1])

    //         if(month === 12) {
    //             year++
    //             month = 1
    //         }

    //         updateDoc(docRef, {
    //             ...dataUser,
    //             name: name,
    //             category: category,
    //             value: value,
    //             date: `${dateSplit[0]}-${month < 10 ? '0' : ''}${month + 1}-${year}`,
    //             done: done
    //         })
    //         .then(() => {
    //             setLoading(false)
    //             setEditTransaction(false)
    //         })
    //         .catch(error => {
    //             setLoading(false)
    //             setEditTransaction(false)
    //         })
    //     })
    // }

    return(
        <main className='container-transactions'>
            <div data-aos='zoom-out' className="board">
                <h1>Transações</h1>
                <p>
                    Balanço mensal: 
                    <strong>
                        R$ {
                            Number(typeTransactions
                                .map(e => e.value)
                                .reduce((a, i) => Number(a) + Number(i), [0])
                            ).toFixed(2)
                        }
                    </strong>
                </p>
            </div>

            <Pendency />

            <div data-aos='zoom-in' className="btn-filters-transactions">
                <Link className='bg-default' to='/transactions/all'>
                    <FaFileInvoiceDollar /> Transações 
                </Link>
                <Link className='bg-up' to='/transactions/revenues'>
                    <BsFillArrowUpCircleFill /> Receitas
                </Link>
                <Link className='bg-down' to='/transactions/expenses'>
                    <BsFillArrowDownCircleFill />Despesas
                </Link>
                <Link className='bg-normal' to='/transactions/clients'>
                    <BsFillArrowDownCircleFill />Clientes
                </Link>
            </div>

            <div data-aos='fade-down' className="transactions">
                {
                    type !== 'expensesPendency' && type !== 'revenuesPendency' &&
                    <BtnMonth />
                }

                {

                    days.length > 0 ?

                    days.map(d => (
                        <div className='transaction-day'>

                            <strong>Dia {d}</strong>

                            {
                                typeTransactions
                                .filter(dayFilter => {
                                    const day = String(dayFilter.date).split('-')[2]
                                    if(day.split('')[0] === '0') {
                                        return day[1] === String(d)
                                    } else {
                                        return String(dayFilter.date).split('-')[2] === String(d)
                                    }
                                })
                                .map(e => (
                                <div key={e.id} className='transaction'>
                                    {
                                        e.category === 'Cliente' ?
                                        <>
                                            <div>
                                                <div className='category bg-normal'>

                                                    <div >
                                                        <CgProfile />
                                                    </div>

                                                    <span>{e.category}</span>
                                                </div>
                                            </div>
                                            <div
                                            className='client'
                                            onClick={() => handleTransaction(setShowClient, showClient, e.id, e)}>
                                                <span>nome</span>
                                                <p>
                                                    {e.name}
                                                </p>
                                            </div>
                                        </>
                                        :
                                        <>
                                            <div>
                                                <div className={e.value > 0 ?
                                                    'category revenue' : 'category expensive' }>
                                                    {
                                                        categories.map(a => a.name === e.category && 
                                                        <div key={e.id}>
                                                            {a.icon}
                                                        </div>)
                                                    }
                                                    <span>{e.category}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <span>nome</span>
                                                <p>{e.name}</p>
                                            </div>
                                        </>
                                    }
                                    <div>
                                        <span>Valor</span>
                                        <p>{`R$ ${String(e.value).split('.').join(',')}`}</p>
                                    </div>
                                    <div className='icon'
                                    onClick={() => handleTransaction(setEditTransaction, editTransaction, e.id, e)}>
                                        <BiSolidPencil />
                                    </div>
                                    <div className='icon'
                                    onClick={() => handleTransaction(setDeleteTransaction, deleteTransaction, e.id, e)}>
                                        <MdDelete />
                                    </div>
                                    <div className='icon'
                                    onClick={() => handleTransaction(setDoneTransaction, doneTransaction, e.id, e)}>
                                        {e.done ?
                                        <AiFillCheckCircle className='up' />
                                        : <AiFillCloseCircle className='down' />}
                                    </div>
                                </div>
                                ))
                            }
                        </div>
                    ))
                    
                    :

                    <div>
                        <h2>Sem transações este mês</h2>
                    </div>
                } 

            </div>

            {
                deleteTransaction && 
                <div className='handle-transactions'>
                    <div data-aos='zoom-in' className='box'>
                        <h2>Tem certeza que quer apagar essa transação?</h2>
                        <div className='box-btns'>

                            <button 
                            className='bg-down'
                            onClick={handleDeleteTransaction}>
                                Apagar somente esta.
                            </button>

                            {
                                dataUser.idTransaction &&
                                <button 
                                className='bg-normal' 
                                onClick={handleDeleteTransactions}>
                                    Apagar esta e as próximas.
                                </button>
                            }

                            <button 
                            className='bg-up' 
                            onClick={() => setDeleteTransaction(false)}>
                                Não
                            </button>

                        </div>
                    </div>
                </div>
            }

            {
                editTransaction && 
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
                            <label>
                                <p>Categoria</p>
                                <input type="text"
                                value={category}
                                onChange={e => setCategory(e.target.value)} />
                            </label>
                            <label>
                                <p>Resolvido</p>
                                <select onChange={e => setDone(e.target.value)}>
                                    <option value="false">Não resolvido</option>
                                    <option value="true">Resolvido</option>
                                </select>
                            </label>
                            <button
                            type='submit'
                            className={Number(value) < 0 ? 'btn-edit-not no-border bg-down' : 'btn-edit-not no-border bg-up'}>Editar</button>
                        </form>

                        <button 
                        onClick={e => setEditTransaction(false)}
                        className='no-border bg-down btn btn-edit'>
                            Cancelar
                        </button>
                    </div>
                </div>
            }

            {
                doneTransaction && 
                <div className='handle-transactions'>
                    <div data-aos='zoom-in' className='box'>
                        <h2>Resolver essa transação?</h2>
                        <div className='box-btns'>

                            <button 
                            className='bg-up'
                            onClick={handleDoneTransaction}>
                                Sim
                            </button>

                            <button 
                            className='bg-down' 
                            onClick={() => setDoneTransaction(false)}>
                                Não
                            </button>

                        </div>
                    </div>
                </div>
            }

            {
                showClient &&
                <div className="handle-transactions">
                    <div data-aos='zoom-in' className="box">
                        <h2>Dados do cliente</h2>
                        <p>
                            <strong>Nome:</strong>
                            {name}
                        </p>

                        <p>
                            <strong>Valor:</strong>
                            R$ {Number(value).toFixed(2)}
                        </p>

                        <p>
                            <strong>Endereço:</strong>
                            <a href={`https://www.google.com/maps/search/termo+${adress}`}
                            target='_blank'
                            rel="noreferrer">
                                <BsLink45Deg />{adress}
                            </a>
                        </p>

                        <p>
                            <strong>Telefone:</strong>
                            <a href={`https://wa.me/${number}`}
                            target='_blank'
                            rel="noreferrer">
                                <BsLink45Deg />{number}
                            </a>
                        </p>

                        <div className='box-btns'>
                            <button 
                            className='bg-down' 
                            onClick={() => setShowClient(false)}>
                                Fechar
                            </button>

                        </div>
                    </div>
                </div>
            }

        </main>
    )
}