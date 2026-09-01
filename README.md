# SFP — Sistema de Finanças Pessoais

> **Um jeito mais leve, claro e privado de olhar para o seu dinheiro.**

O **SFP** é uma aplicação web moderna de gestão financeira pessoal e controle patrimonial com abordagem *local-first*. Desenvolvida com foco em usabilidade, privacidade e design limpo, a plataforma permite acompanhar saldo em contas, faturas de cartões de crédito, custos fixos recorrentes, evolução patrimonial e planejamento orçamentário familiar sem depender de bancos de dados em nuvem ou compartilhamento de dados sensíveis.

---

## 📌 Sumário

- [Visão Geral](#-visão-geral)
- [Para que serve?](#-para-que-serve)
- [Funcionalidades Principais](#-funcionalidades-principais)
  - [1. Dashboard Inteligente](#1-dashboard-inteligente)
  - [2. Carteira & Visão Geral (Contas e Cartões)](#2-carteira--visão-geral-contas-e-cartões)
  - [3. Custos Fixos & Recorrentes](#3-custos-fixos--recorrentes)
  - [4. Balanço Patrimonial](#4-balanço-patrimonial)
  - [5. Perfil, Regime de Renda & Gestão Familiar](#5-perfil-regime-de-renda--gestão-familiar)
  - [6. Backup & Privacidade Local-First](#6-backup--privacidade-local-first)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Como Instalar e Rodar Localmente](#-como-instalar-e-rodar-localmente)
  - [Pré-requisitos](#pré-requisitos)
  - [Passo a Passo](#passo-a-passo)
  - [Scripts Disponíveis](#scripts-disponíveis)
- [Diretrizes de Layout e Usabilidade](#-diretrizes-de-layout-e-usabilidade)
- [Licença](#-licença)

---

## 🎯 Visão Geral

O **SFP** foi projetado para resolver a complexidade excessiva de planilhas financeiras tradicionais e a falta de privacidade de aplicativos vinculados a terceiros. 

Tudo funciona diretamente no navegador do usuário (`localStorage`), com respostas instantâneas, suporte completo a formatação monetária brasileira (`pt-BR`, padrão com duas casas decimais) e responsividade fluida para celulares, tablets e computadores.

---

## 💡 Para que serve?

- **Saber exatamente quanto você pode gastar hoje**: Entenda seu saldo livre real (dinheiro em conta menos faturas de cartão) e obtenha uma média diária e semanal calculada automaticamente até o fechamento da próxima fatura ou final do mês.
- **Eliminar surpresas com contas recorrentes**: Mapeie todos os custos fixos mensais e anuais (inclusive despesas em Dólar/USD), com gráficos visuais de impacto por categoria.
- **Enxergar o seu patrimônio real**: Monte um balanço patrimonial organizado entre ativos (disponibilidades, investimentos, bens) e passivos (dívidas, financiamentos), obtendo o Patrimônio Líquido em tempo real.
- **Organizar o fluxo familiar**: Planeje a renda considerando seu modelo de remuneração (CLT com vale/adiantamento ou PJ/autônomo) e acompanhe a renda *per capita* da sua casa.
- **Garantir 100% de privacidade**: Seus dados financeiros não saem do seu dispositivo.

---

## ✨ Funcionalidades Principais

### 1. Dashboard Inteligente
- **Saldo Líquido Imediato**: Visão clara da liquidez instantânea (saldo total em contas vs. total de faturas a vencer).
- **Indicador de Proteção do Mês**: Porcentagem de comprometimento e margem de segurança financeira.
- **Teto Diário Disponível**: Sugestão de gasto diário sustentável para o período.
- **Resumo de Custos Fixos & Patrimônio**: Atalhos e cartões informativos com as principais métricas do mês.
- **Distribuição de Despesas**: Gráfico de distribuição com as categorias de maior peso no orçamento.

### 2. Carteira & Visão Geral (Contas e Cartões)
- **Contas Bancárias**:
  - Cadastro de contas do tipo *Corrente*, *Poupança*, *Investimento*, *Carteira Digital* ou *Outros*.
  - Identificação visual automática com **logos oficiais dos bancos brasileiros** via biblioteca `react-bancos`.
  - Edição rápida e *inline* de saldos com formatação monetária instantânea.
- **Cartões de Crédito**:
  - Acompanhamento de valor da fatura atual e limite disponível.
  - Configuração do dia de fechamento da fatura e dia de vencimento.
  - **Identificador de melhor dia de compra** e status do cartão (*Fatura Fechada* ou *Fatura Aberta*).
  - Seleção de horizonte de orçamento: cálculo de teto diário focado até o próximo fechamento ou até o final do mês.

### 3. Custos Fixos & Recorrentes
- Cadastro de assinaturas, contas de consumo, moradia e serviços.
- Suporte a recorrência **Mensal** ou **Anual**.
- Suporte **multimoeda** (`BRL` e `USD`), com consolidação de equivalência mensal e anual.
- Gráfico interativo de distribuição de categorias com percentuais e valores.
- Sistema de busca textual e filtros combinados por categoria, recorrência e moeda.

### 4. Balanço Patrimonial
- Organização contábil simplificada dividida em:
  - **Ativo Circulante**: Dinheiro no bolso, contas e poupança, reserva de emergência, contas a receber (salário, renda extra) e investimentos (renda fixa e variável).
  - **Passivos com Valor / Bens**: Veículos, imóveis e FGTS.
  - **Passivo Circulante**: Faturas de cartão, contas a pagar, empréstimos e outros débitos imediatos.
  - **Não Circulante**: Financiamentos de longo prazo (imóveis, veículos).
- **Cálculo Automático de Patrimônio Líquido**: Atualização dinâmica do total de ativos, passivos e patrimônio líquido.

### 5. Perfil, Regime de Renda & Gestão Familiar
- **Regime de Renda Customizável**:
  - **Regime CLT**: Suporte ao modelo de pagamento integral (5º dia útil ou último dia útil) ou modelo com Adiantamento/Vale (dia do adiantamento + % do adiantamento + saldo restante).
  - **Regime PJ / Autônomo**: Definição personalizada do dia de faturamento/recebimento.
- **Membros da Família**:
  - Cadastro de dependentes, parceiro(a) e familiares com data de nascimento (cálculo dinâmico de idade).
  - Status de trabalho e renda individual.
  - Cálculo automático de **Renda Familiar Total** e **Renda per capita**.

### 6. Backup & Privacidade Local-First
- **Zero Servidor / Zero Rastreadores**: Todos os registros ficam armazenados com segurança no `localStorage` do seu navegador.
- **Exportação de Backup**: Download de arquivo `.json` com todos os seus dados estruturados.
- **Importação de Backup**: Restauração instantânea do seu espaço financeiro a partir de um backup prévio.
- **Gestão de Conta**: Opções seguras para limpar dados financeiros ou apagar totalmente a conta local.

---

## 🛠️ Tecnologias Utilizadas

- **[React 19](https://react.dev/)**: Biblioteca componentizada para construção de interfaces reativas e performáticas.
- **[TypeScript](https://www.typescriptlang.org/)**: Tipagem estática para maior previsibilidade e segurança no código.
- **[Vite](https://vitejs.dev/)**: Build tool ultrarrápido com Hot Module Replacement (HMR).
- **[Tailwind CSS v4](https://tailwindcss.com/)**: Framework de estilização utilitário para design responsivo e consistente.
- **[react-bancos](https://github.com/pedro-rdg/react-bancos)**: Conjunto de ícones e identidades visuais de instituições financeiras do Brasil.
- **[ESLint](https://eslint.org/)**: Padronização de qualidade e boas práticas de código.

---

## 📂 Estrutura do Projeto

```text
finance/
├── public/                 # Arquivos públicos e estáticos
├── src/
│   ├── assets/             # Imagens e logotipos vetoriais
│   ├── components/         # Componentes organizados por domínio
│   │   ├── common/         # Componentes reutilizáveis (BankLogo, BankSelectModal, etc.)
│   │   ├── dashboard/      # Módulo da tela inicial e métricas consolidadas
│   │   ├── fixed-costs/    # Módulo de gestão de custos fixos e gráficos
│   │   ├── overview/       # Módulo de contas bancárias, cartões e teto diário
│   │   ├── patrimonio/     # Módulo de balanço de ativos e passivos
│   │   ├── profile/        # Módulo de perfil, CLT/PJ, família e backup
│   │   ├── Logo.tsx        # Identidade visual e logo do SFP
│   │   ├── Navbar.tsx      # Barra de navegação superior
│   │   └── Sidebar.tsx     # Menu lateral responsivo
│   ├── services/
│   │   └── storage.ts      # Camada de persistência local, cálculos e backup
│   ├── types/
│   │   └── finance.ts      # Definições de tipos TypeScript da aplicação
│   ├── utils/
│   │   ├── currency.ts     # Utilitários de parsing e formatação monetária (pt-BR)
│   │   └── date.ts         # Utilitários de cálculo e exibição de datas/idade
│   ├── App.tsx             # Componente raiz, controle de estado global e roteamento
│   ├── index.css           # Configurações globais de CSS e Tailwind
│   └── main.tsx            # Ponto de entrada da aplicação React
├── AGENTS.md               # Diretrizes de desenvolvimento e breakpoints
├── package.json            # Dependências e scripts do projeto
├── tsconfig.json           # Configurações do compilador TypeScript
└── vite.config.ts          # Configuração do Vite e plugins
```

---

## 🚀 Como Instalar e Rodar Localmente

### Pré-requisitos

Certifique-se de ter instalado em sua máquina:
- **Node.js** (versão 18 ou superior recomendada)
- Gerenciador de pacotes **npm** (incluso com o Node.js), **yarn** ou **pnpm**

### Passo a Passo

1. **Clone o repositório** (ou navegue até a pasta do projeto):
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd finance
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

4. **Acesse a aplicação**:
   Abra o seu navegador e acesse a URL exibida no terminal (geralmente `http://localhost:5173`).

---

### 📜 Scripts Disponíveis

No arquivo `package.json`, você encontrará os seguintes comandos:

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor local de desenvolvimento com HMR (Hot Module Replacement). |
| `npm run build` | Valida as tipagens TypeScript (`tsc -b`) e compila o projeto otimizado para produção na pasta `dist/`. |
| `npm run preview` | Executa localmente o build gerado em `dist/` para testes de pré-lançamento. |
| `npm run lint` | Executa o ESLint para verificar e validar a integridade do código. |

---

## 📐 Diretrizes de Layout e Usabilidade

Conforme especificado nas diretrizes do projeto:
- **Responsividade Fluida**: Suporte e adaptação visual com layouts específicos para:
  - *Mobile*: `< 640px` (base mobile-first)
  - *Tablet*: `md:` (`>= 768px`)
  - *Mid Desktop*: `lg:` (`>= 1024px`)
  - *Desktop*: `xl:` (`>= 1280px`) e `2xl:` (`>= 1536px`)
- **Padrão Monetário**: Todos os campos de entrada e exibição monetária operam com 2 casas decimais no padrão brasileiro (`R$ 0,00` / `1.250,50`).

---

## 📄 Licença

Este projeto é de uso privado. Sinta-se à vontade para utilizar e personalizar para o seu próprio planejamento financeiro.
