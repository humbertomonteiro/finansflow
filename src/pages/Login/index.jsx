import './loginRegister.css' 
import { useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import { UserContext } from '../../contexts/user'
import { toast } from 'react-toastify'
import { FaCommentsDollar } from 'react-icons/fa'

export default function Login() {

    const { signIn, loadingAuth } = useContext(UserContext)

    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')

    async function handleLogin(e) {
        e.preventDefault()

        if(email !== '' && password !== '') {
            
            await signIn(email, password)
            setEmail('')
            setPassword('')

        } else {
            toast.error('Preencha todos os campos!')
        }
    }

    return (
        <main className='container-login-register'>
            <div data-aos='fade-right' className='login-register'>
                <h1 className='logo-login-register'>
                    FinansFlow<FaCommentsDollar />
                </h1>
                <p>
                    Cuide das suas contas e se sinta em paz!
                </p>
                <form onSubmit={handleLogin}>
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
                            loadingAuth ? 'Carregando' : 'Logar'
                        }
                    </button>
                    <Link to='/register'>Não tem conta? Cadastre-se!</Link>
                </form>
            </div>
            <div data-aos='fade-left' className='login-register-img'>
                <img src={require('../../assets/imgs/login-img.jpg')} alt="" />
            </div>
        </main>
    )
}