import './filterTransactions.css'
import { Link } from "react-router-dom"
import { FaFileInvoiceDollar } from 'react-icons/fa'
import { BsFillArrowUpCircleFill, BsFillArrowDownCircleFill } from 'react-icons/bs'

export default function FilterTransactions() {
    return (
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
    )
}