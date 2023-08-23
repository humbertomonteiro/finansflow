import './formAdd.css'
import { useState, useContext } from 'react'
import { UserContext } from '../../contexts/user'
import { db } from '../../FirebaseConnection'
import { addDoc, collection } from 'firebase/firestore'
import { toast } from 'react-toastify'
import { AiOutlinePlus, AiOutlineMinus } from 'react-icons/ai'
import { TbUserDollar } from 'react-icons/tb'
import { LiaFileInvoiceDollarSolid } from 'react-icons/lia'
import { FaHandHoldingDollar } from 'react-icons/fa6'

export default function FormAdd() {

    const { user, 
        categoriesRevenues, 
        categoriesExpenses,
        setLoading
    } = useContext(UserContext)

    const [ value, setValue ] = useState('')
    const [ name, setName ] = useState('')
    const [ category, setCategory ] = useState('')
    const [ date, setDate ] = useState('')
    const [ done, setDone ] = useState(false)
    const [ times, setTimes ] = useState(1)
    const [ type, setType ] = useState(1)
    const [ adress, setAdress ] = useState('')
    const [ number, setNumber ] = useState('')
    const [ styleButton, setStyleButton ] = useState('bg-up')
    const [ nameType, setNameType ] = useState('Receita')

    const [ showAddTransactions, setShowAddTransactions ] = useState(false)

    function checkInput() {
        const input = document.querySelector('.btn-check')
        
        if(done) {
            input.style.left = '-15px'
            input.style.background = '#A6A6A6'
        } else {
            input.style.left = '15px'
            input.style.background = '#00a545'
        }
    }

    async function handleAddTransaction(e) {
        e.preventDefault()

        setLoading(true)
        const valueDote = value.split(',').join('.')

        if(value !== '' 
        && name !== '' 
        && category !== ''
        && date !== '') {
            if(times > 1) {
                const dateSplit = date.split('-')
                let setInit = 1
                let setTime = 1
                let setYear = dateSplit[0]
                let setMonth = dateSplit[1]
                for(setInit; times >= setInit; setInit++) {

                    if(setMonth > 12) {
                        setMonth = 1
                        ++setYear
                    }
                    
                    await addDoc(collection(db, 'transactions'),{
                        value: type === 2 ? -valueDote : valueDote,
                        name: `${name} (${setInit}/${times})`,
                        category: category,
                        date: `${setYear}-${setMonth++}-${dateSplit[2]}`,
                        done: false,
                        times: setTime++,
                        number: number,
                        adress: adress,
                        user: user.uid,
                    })
                    .then(() => {
                        setName('')
                        setValue('')
                        setDate('')
                        setDone(false)
                        setTimes('')
                        setShowAddTransactions(false)
                    })
                    .catch(error => {
                        toast.error('Erro ao cadastrar. Tente novamente.')
                        setLoading(false)
                    })
                }
                toast.success('Transação cadastrado com sucesso')
                setLoading(false)
            } else {
                await addDoc(collection(db, 'transactions'),{
                    value: type === 1 ? valueDote : -valueDote,
                    name: name,
                    category: category,
                    date: date,
                    done: done,
                    times: times,
                    user: user.uid
                })
                .then(() => {
                    setName('')
                    setValue('')
                    setDate('')
                    setDone(false)
                    setTimes('')
                    toast.success('Transação cadastrado com sucesso')
                    setLoading(false)
                    setShowAddTransactions(false)
                })
                .catch(error => {
                    toast.error('Erro ao cadastrar. Tente novamente.')
                    setLoading(false)
                })
            }
        } else {
            toast.error('Preencha todos os campos!')
        }
    }

    function currentType(e) {

        if(e === 1) {
            setType(1)
            setStyleButton('bg-up')
            setTimes(1)
            setNameType('Receita')
        } else if (e === 2) {
            setType(2)
            setStyleButton('bg-down')
            setTimes(1)
            setNameType('Despesa')
        } else if(e === 3) {
            setType(3)
            setStyleButton('bg-normal')
            setCategory('Cliente')
            setTimes(2)
            setNameType('Cliente')
        }
    }

    function btnPlus() {
        setShowAddTransactions(true)
        window.scroll(0,0)
    }

    return (
        
        <aside className='container-form-add'>


            <div className="btn-show-add">
                {
                    showAddTransactions ? 
                    <button className='bg-down' onClick={() => setShowAddTransactions(false)}>
                        <AiOutlineMinus />
                    </button>
                    :
                    <button className='bg-default' onClick={btnPlus}>
                        <AiOutlinePlus />
                    </button>
                }
            </div>
            {
                showAddTransactions &&
                <div data-aos='fade-up' className='show-form-transactions'>
                    <div className="bnts-add">
                        <button
                        className='btn-add bg-up'
                        onClick={() => currentType(1)}>
                            <FaHandHoldingDollar />
                            <span>Adicionar Receita</span>
                        </button>
                        <button
                        className='btn-add bg-down'
                        onClick={() => currentType(2)}>
                            <LiaFileInvoiceDollarSolid />
                            <span>Adicionar Despesa</span>
                        </button>
                        <button
                        className='btn-add bg-normal'
                        onClick={() => currentType(3)}>
                            <TbUserDollar />
                            <span>Adicionar Cliente</span>
                        </button>
                    </div>
                    <h2>Cadastrar {nameType}</h2>
                    <form
                    onSubmit={handleAddTransaction}
                    className='form-add'>
                        <div>
                            <label>
                                {type === 3 ? <p>Valor mensal do contrato</p> : <p>Valor</p>}
                                <input
                                type="number"
                                value={value}
                                onChange={e => setValue(e.target.value)}
                                placeholder='Ex: 250...' />
                            </label>
                            <label>
                                {type === 3 ? <p>Nome do cliente</p> : <p>Nome</p>}
                                <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder={type === 3 ? 'Ex: José Maria...' : 'Ex: Conta de luz...'} />
                            </label>
                        </div>
                        <div>
                            <label>
                                {type === 3 ? <p>Data do início do contrato</p> : <p>Data</p>}
                                <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                placeholder='Ex: 09/08/2023...' />
                            </label>
                            <label>
                                {type === 3 ? <p>Quantos meses de contrato?</p> : <p>Quantas vezes?</p>}
                                <input
                                type="number"
                                value={times}
                                onChange={e => setTimes(e.target.value)}
                                placeholder='Ex: 10...' />
                            </label>
                        </div>
                        {
                            type !== 3 &&
                            <div>
                                <label>
                                    <p>Categoria</p>
                                    <select onChange={e => setCategory(e.target.value)}>
                                        <option value="">Escolha a categoria</option>
                                        {
                                            type === 1 ?
                                            categoriesRevenues.map(e => (
                                                <option key={e.name} value={e.name}>
                                                    {e.name}
                                                </option>
                                            ))
                                            :
                                            categoriesExpenses.map(e => (
                                                <option key={e.name} value={e.name}>
                                                    {e.name}
                                                </option>
                                            ))
                                        }
                                    </select>
                                </label>
                                <label className='label-check' onClick={checkInput}>
                                    <p>{type === 1 ? 'Já recebeu?' : 'Já pagou?'}</p>
                                    <div className='check'>
                                        <span className='btn-check'></span>
                                        <input
                                        className='checkbox'
                                        type="checkbox"
                                        value={done}
                                        onChange={() => setDone(!done)} />
                                    </div>
                                </label>
                            </div>
                        }
                        {
                            type === 3 &&
                            <div>
                                <label>
                                    <p>Endenreço</p>
                                    <input
                                    type="text"
                                    value={adress}
                                    onChange={e => setAdress(e.target.value)}
                                    placeholder='Ex: rua Teste, 123...' />
                                </label>
                                <label>
                                    <p>Número</p>
                                    <input
                                    type="number"
                                    value={number}
                                    onChange={e => setNumber(e.target.value)}
                                    placeholder='Ex: (00) 0 0000 0000... Obs: não precisa usar os parêntesis no DDD' />
                                </label>
                            </div>
                        }
                        <div>
                            <label>
                                <button className={styleButton} type='submit'>
                                    Cadastrar {nameType}
                                </button>
                            </label>
                        </div>
                    </form>
                </div>
            }

        </aside>
    )
}