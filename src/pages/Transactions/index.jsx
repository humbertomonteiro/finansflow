import './transactions.css'
import { useContext, useState, useEffect } from 'react'
import { UserContext } from '../../contexts/user'
import Pendency from '../../components/Pendency'
import { MdDelete } from 'react-icons/md'
import { CgProfile } from 'react-icons/cg'
import { BiSolidPencil } from 'react-icons/bi'
import { AiFillCheckCircle, AiFillCloseCircle } from 'react-icons/ai'
import BtnMonth from '../../components/BtnMonth'
import { useParams } from 'react-router-dom'
import NotificationBox from '../../components/NotificationBox'
import FormEditTransaction from '../../components/FormEditTransaction'
import ShowClient from '../../components/ShowClient'
import FilterTransactions from '../../components/FilterTransactions'

const currentDate = new Date()

export default function Transactions() {

    const { type } = useParams()

    const [ deleteTransaction, setDeleteTransaction ] = useState(false)
    const [ editTransaction, setEditTransaction ] = useState(false)
    const [ doneTransaction, setDoneTransaction ] = useState(false)
    const [ dataUser, setDataUser ] = useState({})
    const [ days, setDays ] = useState([])
    const [ typeTransactions, setTypeTransactions ] = useState([])
    const [ showClient, setShowClient ] = useState(false)

    const { transactions, 
        categoriesRevenues, 
        categoriesExpenses, 
        monthSearch,
        yearSearch } = useContext(UserContext)

    const categories = categoriesRevenues.concat(categoriesExpenses)

    useEffect(() => {
        function generationArraysByTypes() {

            const getTransactionsLs = localStorage.getItem('@transactions')
            const transactionsLs = JSON.parse(getTransactionsLs)
            const hasTransactions = transactionsLs === null ? [] : transactionsLs

            let typeTransactions = hasTransactions.filter(t => {
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

    function handleDeleteTransaction(data) {
        setDeleteTransaction(true)
        setDataUser(data)
    }

    function handleSolveTransaction(data) {
        setDoneTransaction(true)
        setDataUser(data)
    }

    function handleClient(data) {
        setShowClient(true)
        setDataUser(data)
    }

    async function handleEditTransaction(e) {
        setDataUser(e)
        setEditTransaction(true)
    }

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

            <FilterTransactions />

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
                                            onClick={() => handleClient(e)}>
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
                                    onClick={() => handleEditTransaction(e)}>
                                        <BiSolidPencil />
                                    </div>
                                    <div className='icon'
                                    onClick={() => handleDeleteTransaction(e)}>
                                        <MdDelete />
                                    </div>
                                    <div className='icon'
                                    onClick={() => handleSolveTransaction(e)}>
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
                <NotificationBox 
                setState={setDeleteTransaction}
                dataUser={dataUser}
                actionSelected={'delete'} />
            }

            {
                editTransaction && 
                <FormEditTransaction 
                setState={setEditTransaction}
                dataUser={dataUser}
                actionSelected={dataUser.category === 'Cliente' ? 'client' : 'edit'} />
            }

            {
                doneTransaction && 
                <NotificationBox 
                setState={setDoneTransaction}
                dataUser={dataUser}
                actionSelected={'solve'} />
            }

            {
                showClient &&
                <ShowClient 
                setState={setShowClient} 
                dataUser={dataUser} />
            }

        </main>
    )
}