import { useContext, useEffect, useState } from 'react'
import { UserContext } from '../../contexts/user'
import './boxesTransactions.css'
import { BsFillArrowUpCircleFill, BsFillArrowDownCircleFill } from 'react-icons/bs'
import { BiSolidRightArrowCircle } from 'react-icons/bi'
import { MdBalance, MdAccountBalance } from 'react-icons/md'
import { Link } from 'react-router-dom'

export default function BoxesTransactions() {

    const { yearSearch, monthSearch } = useContext(UserContext)
    const [ balanceMonth, setBalanceMonth ] = useState(0)
    const [ revenues, setRevenues ] = useState(0)
    const [ expenses, setExpenses ] = useState(0)
    const [ currentValue, setCurrentValue ] = useState(0)

    useEffect(() => {
        function showTransactions() {
            
            const getTransactionsLs = localStorage.getItem('@transactions')
            const transactionsLs = JSON.parse(getTransactionsLs)
            const hasTransactions = transactionsLs === null ? [] : transactionsLs

            const balance = hasTransactions
                .filter(e => Number(e.date.split('-')[0]) === yearSearch)
                .filter(e => Number(e.date.split('-')[1]) === monthSearch)
                .map(e => e.value)
                .reduce((a, i) => {
                    const value =  Number(a) + Number(i)
                    return value.toFixed(2)
                }, [0])
                setBalanceMonth(balance)

            const revenuesValue = hasTransactions
                .filter(e => Number(e.date.split('-')[0]) === yearSearch)
                .filter(e => Number(e.date.split('-')[1]) === monthSearch)
                .filter(e => e.value > 0)
                .map(e => e.value)
                .reduce((a, i) => {
                    const value =  Number(a) + Number(i)
                    return value.toFixed(2)
                }, [0])
                setRevenues(revenuesValue)

            const expensesValue = hasTransactions
                .filter(e => Number(e.date.split('-')[0]) === yearSearch)
                .filter(e => Number(e.date.split('-')[1]) === monthSearch)
                .filter(e => e.value < 0)
                .map(e => e.value)
                .reduce((a, i) => {
                    const value =  Number(a) + Number(i)
                    return value.toFixed(2)
                }, [0])
                setExpenses(expensesValue)

            const currentValues = hasTransactions
                .filter(e => e.done)
                .map(e => e.value)
                .reduce((a, i) => {
                    const value =  Number(a) + Number(i)
                    return value.toFixed(2)
                }, [0])
                setCurrentValue(currentValues)
        }
        showTransactions()

    }, [monthSearch, yearSearch])

    return (
        <div data-aos='fade-up' className="boxes-transactions">
            <Link to='/transactions/all' className="box-transactions">
                <div className='title'>Saldo atual <BiSolidRightArrowCircle /></div>
                <div>
                    <h2><span>R$ </span>{currentValue}</h2>
                </div>
                <div className="svg">
                    <MdAccountBalance />
                </div>
            </Link>

            <Link to='/transactions/revenues' className="box-transactions">
                <div className='title'>Receitas <BiSolidRightArrowCircle /></div>
                <div>
                    <h2><span>R$ </span>{revenues}</h2>
                </div>
                <div className="svg">
                    <BsFillArrowUpCircleFill className='up'/>
                </div>
            </Link>

            <Link to='/transactions/expenses' className="box-transactions">
                <div className='title'>Despesas <BiSolidRightArrowCircle /></div>
                <div>
                    <h2><span>R$ </span>{expenses}</h2>
                </div>
                <div className="svg">
                    <BsFillArrowDownCircleFill className='down'/>
                </div>
            </Link>

            <Link to='/performance' className="box-transactions">
                <div className='title'>Balanço mensal <BiSolidRightArrowCircle /></div>
                <div>
                    <h2><span>R$ </span>{balanceMonth}</h2>
                </div>
                <div className='svg'>
                    <MdBalance />
                </div>
            </Link>
        </div>
    )
}