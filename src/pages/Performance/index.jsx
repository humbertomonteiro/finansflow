import './performance.css'
import { useState, useEffect } from 'react';
import { Chart } from "react-google-charts";

export default function Performance() {

    const [ expensesChart, setExpensesChart ] = useState(0)
    const [ revenuesChart, setRevenuesChart ] = useState(0)
    const [ revenuesChart2, setRevenuesChart2 ] = useState(0)
    const [ expensesChart2, setExpensesChart2 ] = useState(0)

    const date = new Date()
    const monthCurrent = date.getMonth() + 1

    useEffect(() => {
        const transactionsLs = localStorage.getItem('@transactions')
        const parseTransactionLs = JSON.parse(transactionsLs)

        const datas = parseTransactionLs
            .filter(e => new Date(e.date).getMonth() + 1 === monthCurrent)

        // expenses
        const expenses = datas
            .filter(e => e.value < 0)
        const expensesValue = expenses
            .map(e => e.value)
            .reduce((a, i) => Number(a) + Number(-i), [0])

        // revenues
        const revenues = datas
            .filter(e => e.value > 0)
        const revenuesValue = revenues
            .map(e => e.value)
            .reduce((a, i) => Number(a) + Number(i), [0])

        const datasExpenses = [['Categorias', 'Valor']]
        const datasRevenues = [['Categorias', 'Valor']]

        function categoryAndValues(array, data) {
            const valuesByCategory = []

            for(const item of array) {
                const { category, value } = item

                let noNegative = String(value).split('')[0] === '-' ? value.split('-').join('') : value
                Number(noNegative)

                if(!valuesByCategory[category]) {
                    valuesByCategory[category] = noNegative
                } else {
                    valuesByCategory[category] += noNegative
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

        setRevenuesChart(Number(revenuesValue))
        setRevenuesChart2(datasRevenues)

    }, [monthCurrent])

    const optionsRevenus = {
        is3D: true,
    };

    const optionsExpenses = {
        is3D: true,
    };

    // const expenses = expensesChart === 0 ? 1 : expensesChart
    // const revenues = expensesChart === 0 ? 1 : expensesChart

    // let percentage = ((expenses/revenues)*100).toFixed(2)
 
    return (
        <div className='container-performance'>
            <div data-aos='zoom-out' className="board">
                <h1>Performance</h1>
            </div>

            {/* {
                percentage > (50/100) ?
                <div data-aos='zoom-in' className="transaction-health">
                    <div>
                        <h2>Você está indo muito bem!</h2>
                        <h3>Suas receitas represetam {percentage}% das suas 
                        transações</h3>
                        <p>
                            Com grande satisfação, informamos que suas receitas estão superando
                            consistentemente as despesas. Esse progresso notável é um testemunho
                            do seu compromisso em gerenciar seus recursos com eficiência.
                            Estamos felizes em compartilhar que sua estratégia está rendendo
                            frutos, e estamos confiantes de que continuaremos trilhando um caminho
                            financeiro sólido e próspero.
                        </p>
                    </div>
                    <img src={require('../../assets/imgs/goodjob.jpg')} alt="" />
                </div>
                :
                <div data-aos='zoom-in' className="transaction-health">
                    <div>
                        <h2>Cuidado!</h2>
                        <h3>Suas despesas represantam {percentage}% das suas transações!</h3>
                        <p>
                            Lamentamos informar que, neste período, seus despesas têm excedido suas receitas.
                            Esteja ciente da importância de reavaliar suas práticas financeiras para retomar o
                            equilíbrio desejado. Esteja comprometido em tomar medidas necessárias para enfrentar
                            essa situação de maneira proativa e trabalhar em direção a um cenário mais favorável."
                        </p>
                    </div>
                    <img src={require('../../assets/imgs/stop.jpg')} alt="" />
                </div>
            } */}

            <div className="transaction-balance">
                <div data-aos='fade-left' className='box-performance'>
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
                <dir data-aos='fade-right' className='balance-text'>
                    <h3>Seu balanço mensal</h3>
                    <span> R$ {Number(revenuesChart - expensesChart).toFixed(2)}</span>
                    <p>
                        Descubra o Balanço Mensal e conquiste um domínio preciso das suas finanças, 
                        com insights valiosos para manter tudo em ordem. 
                    </p>
                    <p>
                        Estabeleça o hábito de monitorar suas transações regularmente e crie um 
                        orçamento realista para garantir que suas contas estejam sempre em dia.
                    </p>
                </dir>
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