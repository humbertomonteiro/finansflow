import { useState } from "react";

/**
 * useAmountInput — hook para campos de valor monetário
 *
 * PROBLEMA QUE RESOLVE:
 * `type="number"` não aceita vírgula no Brasil. Se você guardar o valor
 * como `number` no state e usar `value={amount}`, qualquer digitação de
 * vírgula ou texto parcial (ex: "1500,") zera o campo ou trava.
 *
 * SOLUÇÃO:
 * Guardar o valor como `string` durante a digitação. O usuário vê
 * exatamente o que digitou. Só na hora de salvar chamamos `parseAmount()`
 * que normaliza e converte para número.
 *
 * EXEMPLOS DE INPUT → OUTPUT DO parseAmount:
 *   "1500"      → 1500
 *   "1500,50"   → 1500.50
 *   "1.500,50"  → 1500.50  (formato pt-BR com milhar)
 *   "1500.50"   → 1500.50
 *   "1,500.50"  → 1500.50  (formato en-US com milhar)
 *   ""          → NaN
 *   "abc"       → NaN
 */
export function useAmountInput(initialValue: number = 0) {
  // Exibe com vírgula como separador decimal — padrão pt-BR
  const [raw, setRaw] = useState<string>(
    initialValue > 0 ? String(initialValue).replace(".", ",") : ""
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Permite: dígitos, vírgula, ponto, e só um separador decimal por vez
    // Remove qualquer caractere que não seja número, vírgula ou ponto
    const filtered = val.replace(/[^\d.,]/g, "");
    setRaw(filtered);
  };

  // Converte o que o usuário digitou para number
  const parseAmount = (): number => {
    if (!raw.trim()) return NaN;

    let normalized = raw.trim();

    // Detecta formato pt-BR com separador de milhar: "1.500,50"
    // Nesse caso o ponto é milhar e a vírgula é decimal
    if (normalized.includes(".") && normalized.includes(",")) {
      const dotIdx = normalized.lastIndexOf(".");
      const commaIdx = normalized.lastIndexOf(",");

      if (commaIdx > dotIdx) {
        // vírgula é o separador decimal → remove pontos, troca vírgula por ponto
        normalized = normalized.replace(/\./g, "").replace(",", ".");
      } else {
        // ponto é o separador decimal → remove vírgulas
        normalized = normalized.replace(/,/g, "");
      }
    } else if (normalized.includes(",")) {
      // só vírgula → separador decimal pt-BR
      normalized = normalized.replace(",", ".");
    }
    // só ponto → já está no formato correto (1500.50)

    const result = parseFloat(normalized);
    return result;
  };

  const isValid = (): boolean => {
    const v = parseAmount();
    return !isNaN(v) && v > 0;
  };

  // Formata para exibir após salvar (ex: ao reabrir modal)
  const reset = (newValue: number) => {
    setRaw(newValue > 0 ? String(newValue).replace(".", ",") : "");
  };

  return {
    raw, // string — usar em value={raw}
    handleChange, // usar em onChange={handleChange}
    parseAmount, // chama na hora de salvar
    isValid, // true se o valor é um número > 0
    reset, // reseta para um novo valor numérico
  };
}
