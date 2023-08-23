import './home.css' 
import { Link } from 'react-router-dom'
import { MdOutlineAttachMoney } from 'react-icons/md'

export default function Home() {
    return (
        <main className='container-home'>
            {/* <div className="slide">
                <img src={require('../../assets/imgs/slide-1.png')} alt="" />
            </div> */}
            <Link to='/register'><MdOutlineAttachMoney /> Faça parte!</Link>
            <div className="boxes-home">

                <div className="box-home">
                    <h3>Registre suas despesas</h3>
                    <p>
                        Registrar despesas permite acompanhar para onde o dinheiro 
                        está indo. Isso ajuda a identificar gastos desnecessários e 
                        possibilita ajustes para manter as finanças em ordem.
                    </p>
                </div>

                <div className="box-home">
                    <h3>Registre suas Receitas</h3>
                    <p>
                        Registrar os saldos de contas e ativos oferece uma visão imediata 
                        da situação financeira. Isso ajuda a entender o patrimônio líquido, 
                        identificar tendências de crescimento ou declínio e tomar decisões 
                        informadas.
                    </p>
                </div>

                <div className="box-home">
                    <h3>Orçamentação</h3>
                    <p>
                        Com registros precisos, é possível criar um orçamento realista e 
                        alinhado com os objetivos financeiros. Isso auxilia na distribuição 
                        adequada dos recursos e evita gastos excessivos.
                    </p>
                </div>

            </div>
        </main>
    )
}