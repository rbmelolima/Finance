# AGENTS.md

## Diretrizes e Pontos de Atenção do Projeto

### 1. Responsividade e Breakpoints
O layout e os componentes devem sempre considerar e se adaptar fluidamente às seguintes faixas de resolução (breakpoints):
- **Mobile**: `< 640px` (padrão base mobile-first)
- **Tablet**: `md:` (`>= 768px`)
- **Mid Desktop (Notebooks / telas médias)**: `lg:` (`>= 1024px`)
- **Desktop (Monitores grandes)**: `xl:` (`>= 1280px`) e `2xl:` (`>= 1536px`)

> **Regra**: Garantir boa legibilidade, espaçamento adequado, ausência de overflow horizontal indesejado e usabilidade touch/mouse em cada uma dessas faixas.

---

### 2. Entradas Monetárias (Inputs de Dinheiro)
- **Padrão com duas casas decimais**: Todos os inputs destinados à inserção ou edição de valores financeiros (saldos, faturas, limites, custos fixos, patrimônio, etc.) devem operar e exibir valores formatados com 2 casas decimais (ex: `0,00`, `1.250,50`, `R$ 0,00`).
- Ao carregar dados existentes para edição ou ao digitar, o valor deve manter a precisão e apresentação consistente de duas casas decimais no formato brasileiro (`pt-BR`).
