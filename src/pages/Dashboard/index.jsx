import './dashboard.css' 
import BoxesTransactions from '../../components/BoxesTransactions'
import BtnMonth from '../../components/BtnMonth'
import Pendency from '../../components/Pendency'
import { Link } from 'react-router-dom'
import FormAdd from '../../components/FormAdd'

export default function Dashboard() {

    return (
        <main className='container-dashboard'>
            <div data-aos='zoom-out' className="board">
                <h1>Dashboard</h1>
                <BtnMonth />
            </div>

            <BoxesTransactions />
            <Pendency />

            <div data-aos='fade-up' className='clients'>
            <div className='img-clients'>
                    <img src={require('../../assets/imgs/client.jpg')} alt="" />
                </div>
                <div className='clients-text'>
                    <h2>Aba de Clientes</h2>
                    <p>
                        Clique aqui para visualizar a lista de clientes cadastrados.
                        Adicione o endereço e o número de telefone para que nos possamos 
                        ajudar a ir até seus clientes ou entrar em contato com apenas alguns 
                        cliques.
                    </p>
                    <Link
                    className='link-clients'
                    to='/transactions/clients'>
                        Ver agora
                    </Link>
                </div>
            </div>

            <FormAdd />
            
        </main>
    )
}