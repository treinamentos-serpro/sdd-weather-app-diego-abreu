<div align="center">

# SDD Weather App

### Treinamento hands-on de **Spec-Driven Development** com **GitHub Copilot**

**Brief → Spec → Plan → Tasks → Code → Test → Review → Ship**

</div>

---

Este repositório é um **laboratório de treinamento de 8 horas** que ensina a
construir software guiado por especificação (**Spec-Driven Development**) usando
o **GitHub Copilot** em todas as etapas. O projeto final é um **Weather App** em
React + TypeScript que consome a API Open-Meteo.

> ## Princípio central
> **NÃO COMECE PELO CÓDIGO.** Sempre: **Spec → Plan → Tasks → Code.**

---

## O workshop

Comece pelo **[Guia do Workshop](workshop/GUIDE.md)** e siga os módulos em ordem.

| # | Módulo | Fase | Duração |
| --- | --- | --- | --- |
| 01 | [Setup](workshop/module-01-setup/README.md) | Preparação | 30 min |
| 02 | [Understanding the Problem](workshop/module-02-discovery/README.md) | Discovery | 45 min |
| 03 | [Writing the Specification](workshop/module-03-spec/README.md) | Spec | 50 min |
| 04 | [Creating the Technical Plan](workshop/module-04-plan/README.md) | Plan | 45 min |
| 05 | [Breaking Down Tasks](workshop/module-05-tasks/README.md) | Tasks | 40 min |
| 06 | [Building the UI](workshop/module-06-ui/README.md) | Code | 60 min |
| 07 | [Integrating APIs](workshop/module-07-api/README.md) | Code | 60 min |
| 08 | [Testing](workshop/module-08-testing/README.md) | Test | 55 min |
| 09 | [Hardening](workshop/module-09-hardening/README.md) | Test | 50 min |
| 10 | [Pull Request Review](workshop/module-10-review/README.md) | Review | 45 min |
| 11 | [Delivery (GitHub Pages)](workshop/module-11-delivery/README.md) | Ship | 30 min |

Cada módulo tem **README.md**, **challenge.md**, **prompts.md** e
**solution.md**.

---

## Começando

### Pré-requisitos

- **Node.js**
- **pnpm** (único gerenciador de pacotes suportado — habilite com `corepack enable`)
- **GitHub Copilot** habilitado no VS Code
- Git e uma conta no GitHub (para PR e deploy)

> O repositório inclui um **DevContainer** com tudo pré-configurado. Abra em um
> Codespace ou em "Reopen in Container" e pule a instalação manual.

### Instalação

```bash
pnpm install
pnpm exec playwright install   # navegadores para os testes E2E
```

### Scripts

```bash
pnpm dev             # servidor de desenvolvimento (Vite)
pnpm build           # build de produção
pnpm preview         # serve o build localmente
pnpm lint            # Biome (lint)
pnpm format          # Biome (formatação)
pnpm check           # Biome (lint + formatação)
pnpm test            # testes unitários (Vitest)
pnpm test:coverage   # cobertura
pnpm test:e2e        # testes E2E (Playwright)
```

---

## Arquitetura do app

```text
src/
├── components/      # apresentação (um componente por arquivo)
│   └── states/      # loading, erro, vazio
├── hooks/           # orquestração (useWeather)
├── services/        # acesso a dados (Open-Meteo) isolado
├── lib/             # funções puras (conversão, formatação, códigos WMO)
├── types/           # contratos compartilhados
├── styles/          # Tailwind + estilos globais
├── App.tsx          # composição da tela
└── main.tsx         # bootstrap React
```

Decisões-chave:

- **Temperaturas em Celsius** internamente; conversão só na apresentação (o
  toggle °C/°F **não** faz nova requisição).
- **Rede isolada** em `services/` — componentes e hooks não conhecem URLs.
- Sempre tratar **loading**, **erro** e **vazio**.

### Executar o aplicativo

Use `pnpm dev` para abrir o layout de [`App`](src/App.tsx). O header reúne
WeatherView, busca e seletor °C/°F. O [`useWeather`](src/hooks/useWeather.ts)
consulta a Open-Meteo e carrega automaticamente o clima da primeira cidade
encontrada. A tela apresenta os estados inicial, carregando, sem resultados,
erro e sucesso, sem seletor de demonstração. “Tentar novamente” repete a etapa
que falhou (busca ou previsão), preservando o termo pesquisado.

O hook expõe `operation` e `selectedCity` para identificar a etapa e a cidade
em carregamento/erro. Nova operação ou desmontagem cancela a requisição anterior,
sem exibir erro para esse cancelamento. O timeout de 10 segundos cobre conexão
e leitura do JSON; falhas de rede, timeout, HTTP 429 e indisponibilidade têm
mensagens próprias, com categoria em `WeatherServiceError` e status para erros HTTP.

A unidade começa em Celsius e permanece ao alternar estados, sem alterar os
dados-base nem gerar requisições. A preferência ainda não é persistida.
O fixture de São Paulo permanece disponível somente para testes e exemplos.

### Acessibilidade e responsividade

O protótipo oferece “Pular para o conteúdo”, foco no conteúdo após retry,
anúncio de sucesso e controles de busca com altura mínima de 44px.
Texto pode quebrar em telas estreitas e com ampliação a 200%, sem esconder
conteúdo via `overflow: hidden`. Os botões de unidade usam Tab/Shift+Tab e
Enter/Espaço; carregamento respeita movimento reduzido.

Execute `pnpm exec playwright test tests/e2e/accessibility.spec.ts --project=chromium`
para testar os cinco estados em 320, 375, 640, 768, 1024 e 1280px, grid,
reflow de texto, teclado, foco e movimento reduzido. O cenário de contraste
verifica razões mínimas para a paleta sobre uma composição conservadora dos
fundos glass. Os testes automatizados não substituem validação com leitores
de tela nem certificam conformidade WCAG completa.

### Formulário de busca

[`SearchBar`](src/components/SearchBar.tsx) recebe `onSearch(city: string)` e
`disabled?: boolean`. A busca ocorre somente por botão ou Enter, com espaços
externos removidos; termos vazios ou acima de 100 pontos de código Unicode
apresentam orientação acessível sem disparar o callback. `disabled` bloqueia
o campo e o envio. O componente não acessa a API e preserva o texto digitado.

### Controle de unidade

[`UnitToggle`](src/components/UnitToggle.tsx) recebe `unit: Unit` e
`onChange(unit: Unit)`. O componente controlado apresenta °C e °F em um grupo
acessível e indica a seleção com `aria-pressed`. Use Tab/Shift+Tab para navegar
e Enter/Espaço para ativar uma opção. O componente pai mantém a unidade;
o controle não converte temperaturas, não persiste dados e não chama a API.

### Hero de clima atual

[`CurrentWeather`](src/components/CurrentWeather.tsx) recebe `city`, `current`
e `unit`. Exibe temperatura e sensação na unidade selecionada, condição e ícone
WMO, umidade (%), vento (km/h), precipitação no intervalo atual (mm) e pressão
ao nível do mar (hPa). Valores nulos mostram “Indisponível”; códigos WMO
desconhecidos mostram “Condição indisponível”.

```tsx
<CurrentWeather city={mockWeatherData.city} current={mockWeatherData.current} unit="celsius" />
```

O hero é apresentação pura, sem rede ou relógio implícito. Na integração,
o componente pai deve filtrar dados não atuais, oferecer nova tentativa e
mostrar a referência temporal no fuso de `WeatherData.timezone`.

### Previsão diária

[`ForecastList`](src/components/ForecastList.tsx) recebe `forecast: ForecastDay[]`
e `unit: Unit` e renderiza cinco [`ForecastCard`](src/components/ForecastCard.tsx)
em grid de 2/3/5 colunas. Cada cartão mostra dia, data, condição e ícone WMO,
máxima/mínima na unidade selecionada e probabilidade de chuva em %.
Medidas nulas são “Indisponível”; uma coleção com tamanho diferente de cinco
mostra indisponibilidade, sem completar nem truncar dias.

```tsx
<ForecastList forecast={mockWeatherData.forecast} unit="celsius" />
```

[`lib/format`](src/lib/format.ts) formata as datas de calendário recebidas em
pt-BR sem deslocamento pelo fuso do dispositivo. Os índices 0 e 1 recebem
“Hoje” e “Amanhã”; os demais recebem o dia da semana. O serviço/componente pai
deve garantir cinco datas locais válidas, consecutivas e atuais no fuso da cidade.
O cartão isolado recebe `day`, `index` e `unit`.

### Estados da interface

- [`LoadingState`](src/components/states/LoadingState.tsx): `operation` opcional
  (`search` ou `weather`, padrão `weather`); anuncia a operação com
  `role="status"` e `aria-live="polite"`. A animação respeita movimento reduzido.
- [`ErrorState`](src/components/states/ErrorState.tsx): `onRetry` obrigatório,
  `operation` e `city: City` opcionais; mensagem segura em `role="alert"` e
  botão “Tentar novamente”, acessível por teclado. `city` identifica a localidade
  somente em `operation="weather"`. Mensagens são definidas pelo componente,
  não por exceções ou payloads recebidos da API.
- [`EmptyState`](src/components/states/EmptyState.tsx): título e dica em região
  `role="status"`, sem retry. Por padrão orienta uma busca sem resultados;
  `title` e `hint` opcionais permitem apresentar a tela inicial.

Todos são componentes de apresentação: não fazem requisições nem disparam
tentativas automáticas.

### Dados mock para desenvolver a UI

Os contratos estão em [`src/types/weather.ts`](src/types/weather.ts).
Para montar os componentes sem consultar a API, importe o objeto tipado de
[`src/mocks/weather.ts`](src/mocks/weather.ts):

```ts
import { mockWeatherData } from './mocks/weather';

const { city, timezone, current, forecast } = mockWeatherData;
```

O mock contém São Paulo, condições atuais e exatamente cinco dias consecutivos,
de 27 a 31 de outubro de 2026. Temperaturas estão em °C, vento em km/h e
umidade/probabilidade de precipitação em %, precipitação atual em mm e pressão
em hPa. Medidas indisponíveis nos contratos
são representadas por `null`, nunca por zero.

Os valores são fictícios e as datas são fixas. Ao testar regras de frescor e
de “hoje”, fixe o relógio em `2026-10-27T18:00:00Z` (15h em
`America/Sao_Paulo`) ou atualize o horário de observação e as cinco datas em
conjunto. O mock não faz requisições nem está conectado automaticamente ao app.

---

## Stack

- **TypeScript** (strict) · **React** · **Vite**
- **Tailwind CSS** (tema dark glassmorphism)
- **Vitest** + **Testing Library** (unit) · **Playwright** (E2E)
- **Biome** (lint + formatação)
- **pnpm** (gerenciador de pacotes)
- **Open-Meteo** (geocoding + forecast, sem API key)

---

## Copilot no fluxo SDD

A pasta `.github/` traz a inteligência do laboratório:

- **`agents/`** — personas especializadas: Spec, Plan, Task, Code, Test, Review.
- **`prompts/`** — prompts de produção para cada etapa.
- **`instructions/`** — convenções (React, Tailwind, Testing) aplicadas
  automaticamente.
- **`workflows/`** — CI (lint/build/test/e2e), deploy no Pages e validações que
  **impõem a ordem Spec → Plan → Tasks**.

Veja [AGENTS.md](AGENTS.md) para a descrição de cada agente.

---

## Idioma

- Narrativa, comentários e documentação: **pt-BR**.
- Identificadores de código, nomes de arquivos e termos técnicos: **en-US**.

---

<div align="center">

Construído com ❤️ para capacitar times em **Spec-Driven Development** usando o poder do GitHub Copilot.

</div>
