---
mode: agent
description: 'Implementa T-01 — Definir os contratos meteorológicos do Weather App.'
---

# Prompt para o Coding Agent — T-01

Implemente **somente T-01 — Definir os contratos meteorológicos** no projeto Weather App.

## Contexto

O projeto segue Spec-Driven Development: Spec → Plan → Tasks → Code → Test → Review. A especificação, o plano e o backlog já existem:

- [Especificação](../../specs/weather-app-spec.md).
- [Plano técnico](../../plans/weather-app-plan.md), especialmente a seção **Data Model**.
- [Backlog](../../tasks/weather-app-tasks.md), tarefa **T-01**.

A aplicação será um frontend React + Vite, com TypeScript strict, que consulta a Open-Meteo sem backend ou API key. Permitirá buscar uma cidade, consultar condições atuais e previsão de cinco dias e alternar temperaturas entre Celsius e Fahrenheit.

Esta tarefa cria **apenas os contratos compartilhados**, consumidos posteriormente por funções puras, services, hooks e componentes. Não deve implementar comportamento de execução.

**Classificação:** Data · P0 · tamanho M.  
**Dependências:** nenhuma.

## Arquivos e escopo

Crie:

- `src/types/weather.ts`.

O diretório de código ainda não existe no estado consultado; crie somente os diretórios necessários para esse arquivo. Se ele já existir ao iniciar a implementação, leia e preserve alterações compatíveis.

Consulte também:

- [Convenções de TypeScript](../instructions/react.instructions.md).
- [Scripts do projeto](../../package.json).
- [Configuração TypeScript da aplicação](../../tsconfig.app.json).

Não altere spec, plano, backlog, configurações ou dependências para concluir esta tarefa.

## Contratos obrigatórios

Exporte os seguintes tipos e interfaces, com estes nomes e formatos:

```ts
export type Unit = "celsius" | "fahrenheit";

export interface City {
  id: number;
  name: string;
  country: string;
  admin1: string | null;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  observedAt: string | null;
  temperatureC: number | null;
  feelsLikeC: number | null;
  weatherCode: number | null;
  relativeHumidity: number | null;
  windSpeedKmh: number | null;
}

export interface ForecastDay {
  date: string;
  weatherCode: number | null;
  temperatureMinC: number | null;
  temperatureMaxC: number | null;
  precipitationProbability: number | null;
}

export interface WeatherData {
  city: City;
  timezone: string;
  current: CurrentWeather;
  forecast: ForecastDay[];
}

export type OperationErrorKind =
  | "network"
  | "timeout"
  | "rate-limit"
  | "http"
  | "invalid-response"
  | "unavailable";

export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "empty" }
  | { status: "error"; kind: OperationErrorKind };

export type CitySearchState = AsyncState<City[]>;

export type WeatherState = Exclude<
  AsyncState<WeatherData>,
  { status: "empty" }
>;

export type Freshness = "fresh" | "stale" | "unknown";
```

## Semântica a preservar

- `City.id` identifica a localidade retornada pelo geocoding. `admin1` representa região/estado ausente como `null`; não use propriedade opcional.
- Temperaturas permanecem em **Celsius** no modelo. `Unit` é preferência de apresentação, não campo de `WeatherData`.
- Medidas ausentes ou inválidas são `null`, nunca zero ou `undefined`.
- `observedAt` representa um instante ISO 8601 UTC com sufixo `Z`, ou `null`.
- `date` representa uma data local `YYYY-MM-DD`; `timezone` representa o fuso IANA da cidade.
- `forecast` permanece `ForecastDay[]`. A exigência de cinco datas válidas e consecutivas será validada pelo service, não por uma tupla nesta tarefa.
- `Freshness` é derivado posteriormente a partir do horário observado e de um instante de referência. Não o adicione como campo persistido.
- Somente a busca admite estado `empty`. A consulta meteorológica não admite esse estado.
- Esses contratos não validam JSON em runtime; essa responsabilidade pertence aos services futuros.

A tarefa dá suporte a **FR-01–FR-04 e FR-06–FR-08**, sem concluir sozinha esses requisitos funcionais.

## Critérios de aceite verificáveis

1. O arquivo exporta os 11 contratos apresentados, sem alterar nomes, campos ou formatos.
2. Todos os campos são obrigatórios; campos anuláveis usam explicitamente `| null`.
3. `Unit` aceita somente `"celsius"` e `"fahrenheit"`.
4. `OperationErrorKind` aceita exatamente as seis categorias especificadas.
5. `AsyncState<T>` é uma união discriminada por `status`: somente `success` exige `data`, e somente `error` exige `kind`.
6. `CitySearchState` permite `empty`; atribuir `{ status: "empty" }` a `WeatherState` produz erro de compilação.
7. O arquivo contém somente declarações de tipos/interfaces e exports, sem imports, React, funções, classes, constantes ou efeitos colaterais.
8. Não há `any`, supressões de TypeScript ou casts para contornar os contratos.
9. A validação TypeScript verifica efetivamente o novo arquivo e não apresenta erros atribuíveis a ele.

## Validação

Use pnpm e as ferramentas existentes. Execute:

```sh
pnpm exec tsc --noEmit
pnpm exec tsc --noEmit -p tsconfig.app.json
pnpm lint
pnpm build
pnpm test
```

**Atenção:** a configuração TypeScript raiz usa referências e tem `files: []`. Portanto, o primeiro comando isolado não comprova que o novo arquivo foi verificado; execute também o comando com `-p tsconfig.app.json`.

Confirme os casos positivos e negativos dos contratos pelo compilador, usando uma verificação temporária incluída no projeto TypeScript, se necessário. Remova somente esse arquivo temporário ao terminar. Não adicione uma suíte Vitest apenas para testar declarações apagadas em runtime.

Como o repositório ainda pode não ter aplicação inicializada ou testes, diferencie falhas causadas pela implementação de bloqueios preexistentes, como ausência de entrada do Vite ou de arquivos de teste. Não crie scaffolding, testes artificiais ou configurações para mascarar esses bloqueios.

## Fora do escopo

Não implementar services, hooks, componentes, validação de payloads, conversão de unidades, cálculo de frescor, chamadas HTTP, persistência ou tarefas posteriores do backlog. Não criar commits nem abrir PR.

## Entrega esperada

Ao finalizar, informe:

- arquivo criado ou alterado;
- resumo dos contratos exportados;
- cada comando executado e seu resultado real;
- eventuais bloqueios preexistentes;
- confirmação de que a mudança ficou limitada à T-01.
