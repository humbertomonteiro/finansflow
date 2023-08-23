import './performance.css'
import { useState, useContext, useEffect } from 'react';
import { UserContext } from '../../contexts/user';
import { Chart } from "react-google-charts";


export default function Performance() {

    const { transactions } = useContext(UserContext)
    const [ expensesChart, setExpensesChart ] = useState(0)
    const [ revenuesChart, setRevenuesChart ] = useState(0)
    const [ revenuesChart2, setRevenuesChart2 ] = useState(0)
    const [ expensesChart2, setExpensesChart2 ] = useState(0)

    const date = new Date()
    const monthCurrent = date.getMonth() + 1

    useEffect(() => {
        const datas = transactions
            .filter(e => Number(e.date.split('-')[1]) === monthCurrent)

        // expenses
        const expenses = datas
            .filter(e => e.value < 0)
        const expensesValue = expenses
            .map(e => e.value)
            .reduce((a, i) => Number(a) + Number(-i), [0])

        // revenues
        const revenues = datas
            .filter(e => e.value > 0)
        const RevenuesValue = revenues
            .map(e => e.value)
            .reduce((a, i) => Number(a) + Number(i), [0])

        const datasExpenses = [['Categorias', 'Valor']]
        const datasRevenues = [['Categorias', 'Valor']]

        function categoryAndValues(array, data) {
            const valuesByCategory = []

            for(const item of array) {
                const { category, value } = item
    
                if(!valuesByCategory[category]) {
                    valuesByCategory[category] = Number(value.split('-').join(''))
                } else {
                    valuesByCategory[category] += Number(value.split('-').join(''))
                }
            }

            for (const categoria in valuesByCategory) {
                data.push([categoria, valuesByCategory[categoria]])
            }

        }

        categoryAndValues(expenses, datasExpenses)
        categoryAndValues(revenues, datasRevenues)

        setExpensesChart(expensesValue)
        setExpensesChart2(datasExpenses)

        setRevenuesChart(RevenuesValue)
        setRevenuesChart2(datasRevenues)

    }, [transactions, monthCurrent])

    const optionsRevenus = {
        is3D: true,
    };

    const optionsExpenses = {
        is3D: true,
    };

    return (
        <div className='container-performance'>
            <div data-aos='zoom-out' className="board">
                <h1>Performance</h1>
                
            </div>

            {
                expensesChart < revenuesChart ? 
                <div className="transaction-health">
                    <div>
                        <h2>Você está indo muito bem!</h2>
                        <p>
                            Seus gastos representam 
                            apenas {(Number(expensesChart/revenuesChart)*100).toFixed(2)}%
                            das suas Receitas.
                        </p>
                    </div>
                    <img src={require('../../assets/imgs/goodjob.jpg')} alt="" />
                </div>
                :
                <div className="transaction-health">
                    <div>
                        <h2>Cuidado!</h2>
                        <p>
                            Seus gastos
                            representam {(Number(expensesChart/revenuesChart)*100)
                            .toFixed(2)}%
                            das suas Receitas. Fique atento!
                        </p>
                    </div>
                    <img src={require('../../assets/imgs/stop.jpg')} alt="" />
                </div>
            }

            <div className="transaction-balnace">
                <div data-aos='zoom-in' className='box-performance'>
                    <h3>Gráficos de receitas e despesas</h3>
                    <Chart
                        chartType="ColumnChart"
                        data={
                            [
                                ["Transação", "Valor", { role: "style" }],
                                [`Receitas R$ ${revenuesChart}`, revenuesChart, '#00a545'],
                                [`Despesas R$ ${expensesChart}`, expensesChart, '#c20000'],
                            ]
                        }
                        width="100%"
                        height="100%"
                        legendToggle
                    />
                </div>
            </div>

            <div className='performance-category'>
                <h2>Gráfricos por categorias</h2>  

                <div className='transaction-category'>

                    <div data-aos='fade-left' className='box-performance'>
                    <h3>Receitas</h3>
                        <Chart
                            chartType="PieChart"
                            width="100%"
                            height="100%"
                            data={revenuesChart2}
                            options={optionsRevenus}
                        />
                    </div>

                    <div data-aos='fade-right' className='box-performance'>
                        <h3>Despesas</h3>
                        <Chart
                            chartType="PieChart"
                            width="100%"
                            height="100%"
                            data={expensesChart2}
                            options={optionsExpenses}
                        />
                    </div>

                </div>

            </div>
        </div>
    )
}