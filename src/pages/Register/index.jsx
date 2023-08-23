import { useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import { UserContext } from '../../contexts/user'
import { toast } from 'react-toastify'
import { FaCommentsDollar } from 'react-icons/fa'

export default function Register() {

    const { signUp, loadingAuth } = useContext(UserContext)

    const [ name, setName ] = useState('')
    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')

    async function handleRegister(e) {
        e.preventDefault()

        if(name !== '' && email !== '' && password !== '') {
            await signUp(name, email, password)
            setName('')
            setEmail('')
            setPassword('')
        } else {
            toast.error('Preencha todos os campos!')
        }
    } 

    return (
        <main className='container-login-register'>
            <h1 className='logo-login-register'>
                FinansFlow<FaCommentsDollar />
            </h1>

            <p>
                Cadastre-se, cuide das suas contas e se sinta em paz!
            </p>

            <form onSubmit={handleRegister}>

                <input 
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder='Digite seu nome...'/>

                <input 
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder='Digite seu email...'/>

                <input 
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder='Digite sua senha...'/>

                <button type='submit'>
                    {
                        loadingAuth ? 'Carregando' : 'Cadastrar'
                    }
                </button>

                <Link to='/login'>Já tem conta? Faça login!</Link>

            </form>
        </main>
    )
}