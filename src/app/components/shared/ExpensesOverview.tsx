export function ExpensesOverview() {
  return (
    <div className="px-2 w-full">
      <h4 className="text-gray-300 text-lg mb-2">
        Dicas para um orçamento saudável
      </h4>
      <ul className="list-disc list-inside text-sm text-gray-300 mt-2 leading-6 space-y-2">
        <li>
          <strong>Siga a regra 50-30-20</strong>:{" "}
          <p className="text-gray-400">
            Destine até 50% da sua renda para gastos essenciais (moradia,
            alimentação, transporte), 30% para desejos (lazer, compras) e 20%
            para poupança ou investimentos.
          </p>
        </li>
        <li>
          <strong>Atenção às categorias dominantes</strong>:{" "}
          <p className="text-gray-400">
            Gastos acima de 30% em uma única categoria podem indicar
            oportunidades de redução.
          </p>
        </li>
        <li>
          <strong>Planeje com antecedência</strong>:{" "}
          <p className="text-gray-400">
            Use as informações acima para ajustar seus gastos e alcançar suas
            metas financeiras.
          </p>
        </li>
      </ul>
    </div>
  );
}
