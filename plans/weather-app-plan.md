# Plano Técnico — Weather App

## Architecture

Aplicação web client-side, sem backend próprio. `App` compõe a tela e conecta os hooks aos componentes por props e callbacks. Os hooks coordenam a busca explícita, a seleção da localidade, a consulta meteorológica e a preferência de unidade. Componentes apresentam estado e dados; serviços encapsulam HTTP e normalização; funções puras concentram conversão, validação, formatação e mapeamento de códigos meteorológicos.

```text
App (composição)
  ├─ components/ <── props e callbacks ──> hooks/
  │                                        ├─ useCitySearch ──> services/geocodingService ──> API
  │                                        ├─ useWeather ──> services/weatherService ──> API
  │                                        └─ useUnitPreference ──> localStorage / storage
  └─ components/, hooks/ e services/ ──> lib/ (funções puras)
     todas as camadas ──> types/ (contratos compartilhados)
```

### Responsabilidades e limites

| Camada | Responsabilidade | O que não deve fazer |
|---|---|---|
| `components/` — apresentação | Renderizar dados e estados em pt-BR, coletar entrada, emitir ações e implementar semântica acessível, foco e layout responsivo. Pode manter estado efêmero de interface, como o texto em edição. | Não consultar APIs, persistir preferências nem conhecer JSON bruto, URLs ou regras de concorrência. |
| `hooks/` — orquestração/estado | Manter estados de operação, termo submetido, cidade selecionada e unidade; disparar serviços somente por ações explícitas; coordenar cancelamento, proteção contra respostas obsoletas e nova tentativa manual. | Não montar URLs, interpretar payloads da API nem duplicar dados derivados ou lógica de conversão. |
| `services/` — acesso a dados | Montar requisições, executar `fetch`, impor timeout de 10 segundos, aceitar cancelamento, validar o JSON e normalizar respostas para `City` e `WeatherData`; classificar falhas externas. | Não importar React, escolher mensagens da tela, atualizar estado de interface ou executar retries automáticos. |
| `lib/` — funções puras | Validar termos e medidas, converter/arredondar temperaturas, formatar unidades e datas e mapear códigos WMO. Receber dados e devolver resultados determinísticos. | Não usar rede, React, DOM ou armazenamento; não ler implicitamente o relógio nas regras de frescor e datas. |
| `types/` — contratos | Declarar `City`, `CurrentWeather`, `ForecastDay`, `WeatherData`, `Unit` e estados/erros de operação. | Não conter lógica de execução nem depender das demais camadas. |

O serviço controla o prazo de cada chamada; o hook controla qual chamada ainda pode alterar o estado. Cancelar uma operação substituída não é erro a anunciar à pessoa, enquanto timeout da operação vigente deve produzir erro e permitir nova tentativa. Cada operação tem seu próprio controle de cancelamento.

`useUnitPreference` encapsula o efeito de leitura/gravação no armazenamento e o listener de `storage`, com limpeza ao desmontar. Não é necessário criar uma camada genérica de persistência para uma única preferência. Funções que verificam frescor ou calculam hoje recebem o instante de referência como argumento; o serviço/hook fornece o relógio na fronteira com efeitos.

### Por que essa separação facilita os testes

- **Componentes:** renderizar props de sucesso, carregamento, vazio e erro com Testing Library; verificar nomes acessíveis e callbacks sem precisar simular HTTP.
- **Hooks:** usar `renderHook`, serviços simulados, promessas controladas e timers falsos para testar estado, tentativas únicas, cancelamento e respostas fora de ordem. Simular o armazenamento e o evento `storage` para a preferência.
- **Serviços:** simular `fetch` na fronteira HTTP e verificar parâmetros, timeout, validação e mapeamento sem montar React ou consultar o provedor real.
- **Funções puras:** testar por tabelas de entradas/saídas os casos de Unicode, valores nulos, arredondamento negativo, códigos desconhecidos e virada de dia/fuso, com instante explícito e sem mocks de rede.
- **Integração/E2E:** manter poucos fluxos completos com Playwright e respostas interceptadas para confirmar que as camadas estão conectadas corretamente, sem repetir em E2E todas as combinações já cobertas em unitários.

Separar responsabilidades sem introduzir camada de domínio, cache, gerenciador global de estado ou backend: o escopo do MVP é uma cidade por vez e não persiste histórico ou dados meteorológicos (FR-01, FR-06, FR-07; NFR-08).

## Tech Stack

- **TypeScript strict**, **React 19** e **Vite** para a aplicação; usar o `fetch` nativo e `AbortController` para as chamadas HTTP e seus timeouts.
- **Tailwind CSS** para a interface responsiva dark glassmorphism.
- **Vitest** e **Testing Library** para lógica e componentes; **Playwright** para fluxos E2E e compatibilidade.
- **Biome** para lint e formatação; **pnpm** como gerenciador de pacotes.
- **Open-Meteo Geocoding API** e **Forecast API**, sem chave de API e sem backend próprio.

Essas tecnologias acompanham a stack e os scripts já definidos pelo projeto. A seleção de unidade é apresentação sobre dados-base em Celsius, sem nova requisição (FR-04).

## Project Structure

Estrutura proposta, seguindo os diretórios já documentados no repositório. Os arquivos abaixo são destinos para as fases Tasks/Code, não implementações a criar nesta fase:

```text
src/
├── components/
│   ├── SearchBar.tsx           # formulário explícito e validação apresentada
│   ├── CityResults.tsx         # opções identificadas e ambiguidade anunciada
│   ├── CurrentWeather.tsx      # campos atuais e referência temporal
│   ├── ForecastList.tsx        # composição da previsão de cinco dias
│   ├── ForecastCard.tsx        # resumo diário
│   ├── UnitToggle.tsx          # seleção acessível Celsius/Fahrenheit
│   ├── ProviderNotice.tsx      # atribuição e aviso de privacidade
│   └── states/
│       ├── LoadingState.tsx    # anúncio da operação pendente
│       ├── EmptyState.tsx      # busca sem resultados
│       └── ErrorState.tsx      # mensagem segura e ação de nova tentativa
├── hooks/
│   ├── useCitySearch.ts        # termo submetido, resultados e busca vigente
│   ├── useWeather.ts           # cidade selecionada e consulta vigente
│   └── useUnitPreference.ts    # unidade em memória, persistência e abas
├── services/
│   ├── geocodingService.ts     # GET de busca e normalização para City[]
│   └── weatherService.ts       # GET de previsão e normalização para WeatherData
├── lib/
│   ├── search.ts               # limite Unicode e identificação de ambiguidade
│   ├── validation.ts           # validação de medidas e valores desconhecidos
│   ├── temperature.ts          # conversão e arredondamento
│   ├── dates.ts                # datas locais, sequência de dias e frescor
│   ├── format.ts               # apresentação pt-BR e unidades acessíveis
│   └── weatherCodes.ts         # legenda WMO em pt-BR
├── types/
│   └── weather.ts             # modelo normalizado, estados e categorias de erro
├── styles/
│   └── index.css              # Tailwind e estilos globais
├── App.tsx                    # composição e conexão de props/callbacks
└── main.tsx                   # inicialização React
tests/
├── unit/                      # lib, serviços, hooks e componentes
└── e2e/                       # fluxos funcionais e responsividade
```

Um arquivo por componente React. Os testes unitários usam nomes correspondentes aos módulos testados, mantendo a convenção do projeto em `tests/unit/`. A tipagem bruta específica da Open-Meteo fica próxima do serviço que a valida; a interface só recebe os contratos normalizados de `types/weather.ts`.

Não criar repositórios, factories, providers de estado, hooks assíncronos genéricos ou barrel files apenas para preencher a estrutura. Se surgir duplicação concreta entre os dois serviços, extrair somente o helper compartilhado necessário; não antecipar um cliente HTTP genérico.

## Etapa de composição com mock

Antes da integração com hooks/API, `App` compõe o layout com
`mockWeatherData` e estado de UI local: unidade inicial Celsius e status inicial
`idle`. Um seletor de demonstração explícito permite `idle`, `loading`, `empty`,
`error` e `success`; buscar ou tentar novamente seleciona `success` e mostra
sempre São Paulo, sem fingir buscar a cidade digitada. A interface informa que
os dados são fictícios, com datas fixas. Não usar rede, persistência, timers ou
validar frescor com o relógio real nesta demonstração. A etapa posterior T-25
substitui o seletor pelos hooks reais e aplica as regras de frescor.

Recriar `main.tsx` e `styles/index.css` para inicialização React e Tailwind.
O header contém marca, SearchBar e UnitToggle; main contém o seletor e
exatamente uma apresentação do estado. A unidade permanece ao alternar estados;
os componentes convertem temperaturas sem modificar o mock.

## Data Model

Os contratos abaixo descrevem os dados normalizados entre serviços, hooks e interface. Não são implementações finais. Campos meteorológicos opcionais ou inválidos são representados como `null`; a apresentação os identifica como “Indisponível”, nunca como zero.

```ts
export type Unit = "celsius" | "fahrenheit";

export interface City {
  /** Identificador da localidade no geocoding. */
  id: number;
  /** Nome retornado pela fonte, sem tradução local. */
  name: string;
  /** País da localidade. */
  country: string;
  /** Região ou estado (`admin1`), quando disponível. */
  admin1: string | null;
  /** Latitude em graus decimais. */
  latitude: number;
  /** Longitude em graus decimais. */
  longitude: number;
}

export interface CurrentWeather {
  /** Instante de `current.time` normalizado como ISO 8601 UTC, com sufixo Z. */
  observedAt: string | null;
  /** Temperatura em °C (`temperature_2m`). */
  temperatureC: number | null;
  /** Sensação térmica em °C (`apparent_temperature`). */
  feelsLikeC: number | null;
  /** Código WMO da condição (`weather_code`). */
  weatherCode: number | null;
  /** Umidade relativa em %, entre 0 e 100 (`relative_humidity_2m`). */
  relativeHumidity: number | null;
  /** Velocidade do vento em km/h (`wind_speed_10m`). */
  windSpeedKmh: number | null;
  /** Precipitação no intervalo atual em mm (`precipitation`). */
  precipitationMm: number | null;
  /** Pressão ao nível do mar em hPa (`pressure_msl`). */
  pressureHpa: number | null;
}

export interface ForecastDay {
  /** Data YYYY-MM-DD derivada de `daily.time` no fuso da cidade. */
  date: string;
  /** Código WMO da condição diária (`weather_code`). */
  weatherCode: number | null;
  /** Temperatura mínima em °C (`temperature_2m_min`). */
  temperatureMinC: number | null;
  /** Temperatura máxima em °C (`temperature_2m_max`). */
  temperatureMaxC: number | null;
  /** Probabilidade máxima diária em % (`precipitation_probability_max`). */
  precipitationProbability: number | null;
}

export interface WeatherData {
  /** Localidade explicitamente selecionada no geocoding. */
  city: City;
  /** Fuso IANA retornado pela previsão, como America/Sao_Paulo. */
  timezone: string;
  /** Condições atuais normalizadas. */
  current: CurrentWeather;
  /** Hoje e os quatro dias seguintes, após validação das datas. */
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
export type WeatherState = Exclude<AsyncState<WeatherData>, { status: "empty" }>;
export type Freshness = "fresh" | "stale" | "unknown";
```

`City.id` é o identificador numérico retornado pelo geocoding; a seleção e a consulta usam a localidade completa e suas coordenadas, não apenas o nome. `admin1` é opcional e corresponde à região/estado quando fornecido.

O serviço valida o JSON antes de produzir esses tipos; interfaces não validam respostas em runtime. `WeatherData.timezone` é obrigatório para aceitar a estrutura da resposta meteorológica e calcular as datas locais. `forecast` exige cinco datas válidas e consecutivas no fuso retornado, começando em hoje; essa regra é validada pelo serviço, não pelo tipo de array. Campos meteorológicos individuais podem permanecer nulos.

`observedAt` representa um instante inequívoco em UTC: o serviço transforma os segundos Unix recebidos em ISO 8601 com `Z`. A apresentação usa `Intl.DateTimeFormat` com `timeZone: WeatherData.timezone`. Não interpretar strings de horário local sem offset nem adicionar offset a um timestamp Unix.

`Freshness` é um valor derivado, não um campo persistido em `CurrentWeather`: uma função pura recebe `observedAt` e `nowMs`. Referência ausente/inválida ou futura resulta em `"unknown"`; idade entre zero e 10.800.000 ms, inclusive, resulta em `"fresh"`; acima disso, `"stale"`. Somente `"fresh"` permite exibir valores como atuais. O ciclo de invalidação local está definido em State Management.

A unidade é uma preferência de apresentação, separada de `WeatherData`. As temperaturas permanecem em Celsius internamente; a conversão para Fahrenheit ocorre antes do arredondamento e sem nova requisição. Um código WMO desconhecido produz “Condição indisponível”; `null` nos demais campos produz “Indisponível”, nunca zero.

## Data Flow

1. A pessoa submete a busca com botão ou Enter. Remover espaços externos; rejeitar entrada vazia ou acima de 100 pontos de código Unicode antes da rede. A busca é explícita, aceita nomes em idiomas suportados pela fonte e pede até 10 opções.
2. O serviço de geocoding valida a estrutura da resposta. Lista vazia produz estado `empty`, distinto de erro. Exibir nome e país, mais região/estado disponível. Se opções forem indistinguíveis nesses campos, desabilitar sua seleção e orientar o refinamento do termo.
3. Selecionar explicitamente uma opção inicia a consulta de previsão para suas coordenadas. Remover os dados meteorológicos da localidade anterior ao início da consulta e identificar a localidade solicitada.
4. O serviço normaliza e valida a resposta. Para condições atuais, ausência/invalidez de `observedAt` ou idade superior a três horas torna os valores atuais indisponíveis e requer nova tentativa. Para previsão, exigir cinco datas locais válidas, consecutivas, começando em hoje na zona da cidade; não inventar nem completar datas.
5. O hook publica somente o resultado da operação mais recente. Cada operação tem timeout de 10 segundos; cancelamento de requisição anterior e/ou identificador de operação impedem que respostas fora de ordem atualizem a interface.
6. A unidade escolhida é aplicada na apresentação a todos os campos de temperatura. Converter de Celsius para Fahrenheit pela fórmula `°F = (°C × 9/5) + 32` antes do arredondamento; aplicar arredondamento ao inteiro mais próximo com empate de 0,5 para longe de zero. Vento, umidade e precipitação também são arredondados ao inteiro mais próximo.
7. Uma tentativa manual repete exatamente a operação que falhou, uma vez, sem repetição automática.

## External APIs

Referências oficiais: [Geocoding API](https://open-meteo.com/en/docs/geocoding-api) e [Forecast API e legenda WMO](https://open-meteo.com/en/docs). Ambas são chamadas via `GET`, pelo navegador, sem chave de API no serviço público previsto para o MVP. Os exemplos abaixo são ilustrativos e resumidos, não consultas reais nem fixtures cujo horário permaneça válido.

### Geocoding — busca de localidades (FR-01)

**URL:** `https://geocoding-api.open-meteo.com/v1/search`

| Parâmetro | Valor/contrato | Finalidade |
|---|---|---|
| `name` | Termo submetido, após `trim`, com 1 a 100 pontos de código Unicode | Buscar a cidade; codificar com `URLSearchParams`, sem restringir o idioma da entrada. |
| `count` | `10` | Solicitar no máximo dez resultados. |
| `language` | `pt` | Solicitar rótulos localizados pela fonte quando disponíveis; não traduzir nomes no cliente. Não restringe o idioma do termo pesquisado. |
| `format` | `json` | Receber JSON. |

`current`, `daily` e `timezone` não são parâmetros desta busca. O resultado pode trazer `timezone`, mas a previsão fornece o fuso autoritativo para `WeatherData`. Não aplicar filtro de país no MVP. A API documenta que termos de um caractere não retornam resultados; isso é estado vazio, não erro nem motivo para impor um mínimo diferente da spec.

Exemplo de requisição:

```text
https://geocoding-api.open-meteo.com/v1/search?name=Berlin&count=10&language=pt&format=json
```

Exemplo resumido de resposta:

```json
{
  "results": [
    {
      "id": 2950159,
      "name": "Berlin",
      "country": "Alemanha",
      "admin1": "Berlin",
      "latitude": 52.52437,
      "longitude": 13.41053,
      "timezone": "Europe/Berlin"
    }
  ],
  "generationtime_ms": 0.5
}
```

**Mapeamento para `City`:**

| Campo da resposta | Campo do modelo | Regra |
|---|---|---|
| `results[i].id` | `City.id` | Número inteiro identificador da fonte. |
| `results[i].name` | `City.name` | Preservar o nome retornado. |
| `results[i].country` | `City.country` | País exibido para distinguir localidades. |
| `results[i].admin1` | `City.admin1` | Região/estado; ausência vira `null`. |
| `results[i].latitude` | `City.latitude` | Número finito entre −90 e 90. |
| `results[i].longitude` | `City.longitude` | Número finito entre −180 e 180. |

Campos adicionais, como população, elevação e tempo de geração, não integram o modelo do MVP. Um objeto de sucesso sem `results`, ou com `results: []`, representa busca vazia conforme o formato da fonte; `results` com tipo inválido é erro estrutural. Validar identificador, nome, país e coordenadas antes de construir `City`; não inventar dados obrigatórios nem descartar silenciosamente resultados inválidos: tratar a resposta como inválida.

Exibir até dez opções com nome, região/estado disponível e país. Opções indistinguíveis pelos campos exibidos ficam não selecionáveis, com orientação para refinar o termo. Somente a seleção explícita de um `City` inicia a previsão.

### Forecast — condições atuais e cinco dias (FR-02, FR-03, FR-08)

**URL:** `https://api.open-meteo.com/v1/forecast`

Uma chamada reúne os campos atuais e diários; não é necessário consultar o endpoint legado de condições atuais nem solicitar dados horários.

| Parâmetro | Valor/contrato | Finalidade |
|---|---|---|
| `latitude` | `City.latitude` | Coordenada da cidade selecionada. |
| `longitude` | `City.longitude` | Coordenada da cidade selecionada. |
| `current` | `temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,precipitation,pressure_msl` | Temperatura, sensação, código WMO, umidade, vento, precipitação e pressão atuais. |
| `daily` | `weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max` | Condição diária, mínima, máxima e probabilidade máxima diária de precipitação. |
| `timezone` | `auto` | Resolver o fuso da coordenada e alinhar os dias ao calendário local. |
| `forecast_days` | `5` | Hoje e os quatro dias seguintes no fuso retornado. |
| `temperature_unit` | `celsius` | Preservar temperaturas-base em Celsius, mesmo com Fahrenheit selecionado na UI. |
| `wind_speed_unit` | `kmh` | Receber vento em km/h. |
| `precipitation_unit` | `mm` | Receber precipitação atual em milímetros. |
| `timeformat` | `unixtime` | Receber instantes em segundos desde o Unix epoch, sem ambiguidade de horário local. |

`current.time` e `daily.time` são retornados pela API; `time` não deve ser incluído nas listas de variáveis `current` e `daily`. A unidade selecionada pela pessoa não modifica esses parâmetros (FR-04).

Exemplo de requisição:

```text
https://api.open-meteo.com/v1/forecast?latitude=52.52437&longitude=13.41053&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,precipitation,pressure_msl&daily=weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max&timezone=auto&forecast_days=5&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&timeformat=unixtime
```

Exemplo resumido de resposta; para este cenário, considerar que “hoje” em Berlin é 27/10/2026:

```json
{
  "latitude": 52.52,
  "longitude": 13.419998,
  "timezone": "Europe/Berlin",
  "utc_offset_seconds": 3600,
  "current_units": {
    "time": "unixtime",
    "temperature_2m": "°C",
    "apparent_temperature": "°C",
    "weather_code": "wmo code",
    "relative_humidity_2m": "%",
    "wind_speed_10m": "km/h",
    "precipitation": "mm",
    "pressure_msl": "hPa"
  },
  "current": {
    "time": 1793122200,
    "temperature_2m": 10.4,
    "apparent_temperature": 8.2,
    "weather_code": 3,
    "relative_humidity_2m": 76,
    "wind_speed_10m": 12.6,
    "precipitation": 0.4,
    "pressure_msl": 1015.2
  },
  "daily_units": {
    "time": "unixtime",
    "weather_code": "wmo code",
    "temperature_2m_min": "°C",
    "temperature_2m_max": "°C",
    "precipitation_probability_max": "%"
  },
  "daily": {
    "time": [1793055600, 1793142000, 1793228400, 1793314800, 1793401200],
    "weather_code": [3, 61, 2, 3, 0],
    "temperature_2m_min": [7.2, 6.4, 5.1, 4.8, 3.2],
    "temperature_2m_max": [12.4, 11.6, 13.2, 10.8, 12.1],
    "precipitation_probability_max": [20, 80, 10, 30, 0]
  }
}
```

**Mapeamento para `CurrentWeather`:**

| Campo da resposta | Campo do modelo | Regra |
|---|---|---|
| `current.time` | `observedAt` | Validar segundos Unix e converter para ISO UTC com `Z`; no exemplo, `2026-10-27T17:30:00.000Z`, exibido como 18:30 em Berlin. Ausência/invalidez vira `null`. |
| `observedAt` e relógio atual | `Freshness` derivado, fora do modelo | Aplicar a regra de idade de Data Model e reavaliar durante a permanência da tela aberta. |
| `current.temperature_2m` | `temperatureC` | Número finito em Celsius, sem arredondamento no serviço. |
| `current.apparent_temperature` | `feelsLikeC` | Número finito em Celsius, sem arredondamento no serviço. |
| `current.weather_code` | `weatherCode` | Código WMO inteiro; legenda em pt-BR na apresentação. |
| `current.relative_humidity_2m` | `relativeHumidity` | Número finito entre 0 e 100, em %. |
| `current.wind_speed_10m` | `windSpeedKmh` | Número finito não negativo, em km/h. |
| `current.precipitation` | `precipitationMm` | Número finito não negativo, em mm no intervalo atual. |
| `current.pressure_msl` | `pressureHpa` | Número finito positivo, em hPa ao nível do mar. |

**Mapeamento para `ForecastDay`:** os arrays de `daily` são paralelos; para cada índice `i` de `daily.time`, associar somente os valores nesse mesmo índice.

| Campo da resposta | Campo do modelo | Regra |
|---|---|---|
| `daily.time[i]` | `date` | Converter segundos Unix para data no fuso IANA retornado, usando `Intl.DateTimeFormat.formatToParts` e montando `YYYY-MM-DD`; nunca usar o fuso do dispositivo ou `toISOString().slice(0, 10)` para obter a data local. |
| `daily.weather_code[i]` | `weatherCode` | Código WMO inteiro da condição diária. |
| `daily.temperature_2m_min[i]` | `temperatureMinC` | Mínima em Celsius, sem arredondamento no serviço. |
| `daily.temperature_2m_max[i]` | `temperatureMaxC` | Máxima em Celsius, sem arredondamento no serviço. |
| `daily.precipitation_probability_max[i]` | `precipitationProbability` | Número finito entre 0 e 100, em %; não é precipitação acumulada. |

**Composição de `WeatherData`:**

- `city`: preservar o `City` selecionado no geocoding; as coordenadas retornadas pelo forecast podem ser da célula da grade meteorológica e não devem substituir a identidade da cidade.
- `timezone`: usar e validar o fuso IANA retornado pelo forecast. `utc_offset_seconds` é metadado auxiliar, não substitui as regras do fuso para os cinco dias, inclusive em mudanças de horário de verão.
- `current`: normalizar os campos acima; a interface não exibe valores atuais quando `freshness` não for `"fresh"` e oferece nova tentativa manual.
- `forecast`: construir cinco `ForecastDay` após validar que `daily.time` contém hoje e os quatro dias seguintes, em ordem e sem lacunas ou duplicatas. Ausência de estrutura de datas ou fuso é erro estrutural; datas incompletas/inválidas tornam a previsão completa indisponível, sem fabricar dias.

Antes de validar a sequência, normalizar cada timestamp diário para sua data local. Comparar dias de calendário, não intervalos fixos de 86.400 segundos: transições de horário de verão podem produzir dias de 23 ou 25 horas. Usar `Intl` e `Date` nativos, sem biblioteca adicional de datas; `Date` representa instantes e `Intl` resolve as regras do fuso. Não aplicar `utc_offset_seconds` novamente aos instantes.

Validar as unidades retornadas antes de atribuir valores a campos com unidade fixa. Campos meteorológicos individuais ausentes, `null`, não finitos, fora do domínio ou com unidade incompatível viram `null`, sem inferir valores. Array de medida ausente ou mais curto não desloca os índices: o campo correspondente fica indisponível. Código WMO inteiro desconhecido usa “Condição indisponível”, sem falhar toda a consulta.

### Hero de condições atuais

`CurrentWeather` recebe somente `city`, `current` e `unit`. É apresentação pura:
temperatura grande e sensação usam `lib/temperature`; ícone decorativo e
condição usam `lib/weatherCodes`. As quatro métricas são umidade (%), vento
(km/h), precipitação (mm, uma casa decimal) e pressão (hPa, inteiro).
Usar lista de descrições semântica e nomes acessíveis das unidades.
Temperaturas arredondam empates para longe de zero após conversão, sem zero negativo.

O componente pai deverá validar/reavaliar frescor, substituir medidas por `null`
quando não atuais, oferecer retry e formatar a referência temporal usando
`WeatherData.timezone`. Essas responsabilidades de integração não são inferidas
do relógio nem do fuso do dispositivo dentro do hero.

### Regras comuns de integração

Validar status HTTP, formato e metadados antes de normalizar. Classificar HTTP 429 como limite de requisições; demais falhas HTTP, rede, timeout e resposta inválida seguem `OperationErrorKind`. Não expor URL, payload bruto ou detalhes técnicos na interface.

Cada requisição deve terminar em até 10 segundos. Não persistir nem registrar termo de busca, coordenadas, localidade selecionada ou dados meteorológicos associados a uma pessoa. A atribuição visível à Open-Meteo, aviso de privacidade com link para a política do provedor e revisão documentada dos termos e limites vigentes são requisitos de publicação (NFR-06, NFR-08, NFR-10).

## State Management

### Contrato incremental de `useWeather`

Por solicitação posterior, `useWeather` reúne busca e previsão e expõe
`status` (`idle/loading/success/error/empty`), `data`, `cities`, `error`, `query`,
`search(name)`, `selectCity(city)` e `retry()`. Nesta variante, uma busca carrega
automaticamente a primeira cidade e mantém as opções para seleção posterior,
em vez da seleção explícita prevista originalmente. Retry repete a última etapa
executada: busca pelo termo ou previsão pela cidade, inclusive quando a previsão
automática falha. Entrada vazia não inicia operação; dados anteriores são removidos
ao carregar. Um identificador de operação impede atualizações obsoletas e após
desmontagem; o hook aborta a requisição anterior por `AbortController` ao substituir
operações ou desmontar. Os serviços recebem `AbortSignal` opcional e mantêm o
timeout de 10 segundos até o fim da leitura do JSON, limpando timer e listener
externo no `finally`. `WeatherServiceError.category` distingue `timeout`,
`cancelled`, `network`, `rate-limit`, `unavailable`, `http` e `invalid-response`;
erros HTTP também carregam `status`. Cancelamentos de operações obsoletas não
publicam erro. `operation` e `selectedCity` identificam explicitamente a etapa
e a cidade em loading/erro, sem inferência pela lista de resultados. `App`
consome esse hook para apresentar os cinco estados e conectar busca/retry,
mantendo apenas a unidade como estado de UI. O seletor e os avisos de
demonstração foram removidos; os mocks são usados apenas em testes e exemplos.

Usar estado local React, sem biblioteca externa de estado. `App` conecta `useCitySearch`, `useWeather` e `useUnitPreference` aos componentes, sem duplicar seus estados. `SearchBar` mantém o texto em edição; `useCitySearch` guarda o termo submetido para repetir a operação e os resultados/estado da busca. `useWeather` guarda a cidade selecionada e o estado da previsão, removendo dados anteriores ao iniciar outra consulta. Os hooks de busca e previsão mantêm controles independentes contra respostas obsoletas, sem acoplar seus estados de sucesso/vazio/erro.

### Estados e concorrência

- `CitySearchState`: `idle` antes da primeira busca; `loading` durante a chamada; `success` com opções; `empty` sem resultados; `error` em falha.
- `WeatherState`: `idle` sem seleção; `loading` ao selecionar/repetir consulta; `success` com modelo válido; `error` em falha. `empty` não pertence a esse contrato.
- Dados ficam exclusivamente em `data` de `success`, sem cópias paralelas. A cidade selecionada permanece identificada em `loading` e `error`; iniciar nova busca não muda a cidade até uma seleção explícita.
- Entrada inválida gera orientação no formulário e nenhuma chamada; não substitui uma operação válida em andamento.
- Bloquear submissão duplicada do mesmo termo e seleção/retry da cidade já pendente. Permitir outro termo ou outra cidade, cancelando a operação substituída.
- Cada hook mantém identificador de operação e controlador de cancelamento em referências. Sucesso, erro e encerramento de loading só atualizam o estado se o identificador ainda for vigente. Invalidar também operações que expiraram e limpar recursos ao desmontar.
- Retry aceito produz exatamente uma chamada da operação correspondente, usando o último termo válido submetido ou a cidade selecionada. Sem repetição automática.

### Conversão derivada na renderização

Não armazenar temperaturas convertidas ou arredondadas no estado. Função pura recebe Celsius original e `Unit`: para Fahrenheit, calcula `(valorC × 9/5) + 32`; só então arredonda por `Math.sign(valor) * Math.floor(Math.abs(valor) + 0.5)`, normalizando zero negativo para zero. `Math.round` isolado não atende aos empates negativos. `null` continua indisponível.

Aplicar o mesmo helper à temperatura, sensação e mínimas/máximas de todos os dias; vento e percentuais também são arredondados na apresentação. A troca de unidade só renderiza novamente e não é dependência de efeitos de rede.

### Invalidação temporal sem atualização de rede

`useWeather` fornece um instante de avaliação para derivar `Freshness`, sem armazenar uma cópia congelada dessa classificação no modelo. Com referência válida e ainda fresca, agendar um único timeout local para o primeiro milissegundo após `observedAt + 3 horas`. Exatamente no limite os dados continuam válidos; acima dele a seção atual passa a “Indisponível” com retry manual, preservando a previsão válida.

Reavaliar pelo relógio real ao executar o timeout, ao receber `focus` e ao retornar a `visibilityState === "visible"`, pois navegadores suspendem timers em abas inativas. Atualizar o instante de avaliação e reagendar se necessário. Limpar timer/listeners ao trocar cidade, substituir dados ou desmontar. Isso não faz polling nem requisição automática: apenas impede apresentar dados vencidos como atuais.

Ao retornar à aba ou renderizar dados, revalidar também se as datas ainda correspondem a hoje e hoje + 4 no fuso da cidade. Se o dia local mudou e a sequência ficou vencida, retirar a previsão do estado de sucesso, informar indisponibilidade e permitir retry manual, sem deslocar/inventar dias.

### Preferência de unidade

A unidade (`Unit`) é inicializada em Celsius, ou no valor válido encontrado em `localStorage`. Persistir somente a unidade; se leitura/gravação falhar, continuar a sessão normalmente, mantendo a escolha atual. Sincronizar alterações entre abas pelo evento `storage`; a aba sem acesso ao armazenamento mantém seu estado local e inicia em Celsius em nova sessão. A unidade não é enviada à API nem altera a seleção ou os dados meteorológicos.

Não persistir termo, resultados, localidade ou clima; não implementar cache ou atualização em segundo plano (FR-07 e escopo fora do MVP).

## Error Handling

- Manter estados distintos de repouso, carregamento, sucesso, vazio (somente busca) e erro para cada operação. Anunciar carregamento, vazio e erro com semântica acessível.
- Validar entrada antes de qualquer chamada. Busca vazia orienta a pessoa e mantém foco no campo; limite acima de 100 pontos de código Unicode apresenta mensagem sem requisição.
- Tratar rede, timeout, limite de requisições, status HTTP e resposta estrutural inválida com mensagens simples em pt-BR e ação manual de nova tentativa. Preservar o termo em erro de busca.
- No início de uma consulta a outra cidade, remover os dados anteriores. Se falhar, identificar a cidade solicitada e não apresentar dados antigos como atuais.
- Ignorar resultados e erros de operações substituídas. O timeout de cada requisição é de 10 segundos; não há retry automático nem submissão duplicada do mesmo pedido.
- O prazo cobre a chamada e a leitura do corpo. HTTP 429 corresponde a `rate-limit`, 5xx a `unavailable`, demais erros HTTP/envelope de erro da API a `http`, rejeição de rede a `network` e JSON/estrutura obrigatória inválidos a `invalid-response`.
- Distinguir a causa do abort: substituição/desmontagem é cancelamento esperado, sem mensagem de erro; expiração da operação vigente é `timeout`, encerra loading e oferece retry. Uma resposta tardia após timeout não pode publicar sucesso.
- Campos individuais ausentes ou inválidos permanecem no lugar e aparecem como “Indisponível”, sem valor substituto. Código meteorológico desconhecido é “Condição indisponível”.
- Se o horário atual for ausente, inválido ou tiver mais de três horas, não apresentar os valores como atuais e oferecer nova tentativa. Se a estrutura não permitir validar os cinco dias locais consecutivos, informar que a previsão completa não está disponível.
- Campo parcial mantém a operação em sucesso com `null`; falta de fuso ou datas válidas impede construir `WeatherData` e resulta em erro da operação. Para atuais sem frescor, manter a previsão válida e repetir somente a chamada combinada de forecast quando a pessoa acionar retry.
- Diagnósticos podem conter apenas categorias de erro sem dados pessoais/contextuais; nunca incluir termo, coordenadas, localidade ou payload bruto. Erros de armazenamento local não impedem a troca de unidade na sessão.

## Testing Strategy

### Abordagem e organização

Priorizar testes determinísticos de comportamento: muitas combinações em funções puras e serviços, testes de componentes/hooks para interação e poucos fluxos E2E completos. Usar `tests/unit/` para Vitest e `tests/e2e/` para Playwright. Evitar snapshots extensos de HTML e asserções sobre detalhes internos do React.

Não depender da disponibilidade da Open-Meteo para aprovar a suíte: no Vitest, simular `fetch`; no Playwright, interceptar os dois endpoints. As fixtures devem manter os nomes e unidades documentados em External APIs. Fixar o relógio nos cenários de frescor e datas e restaurar mocks, timers e armazenamento entre testes. A data ilustrativa deste documento não deve tornar um teste válido apenas no dia em que foi escrito.

### Vitest — funções puras (`lib/`)

| Área | Casos e verificações principais | Rastreabilidade |
|---|---|---|
| Conversão de temperatura | Celsius preservado; `0 °C → 32 °F`, `100 °C → 212 °F`, `−40 °C → −40 °F`; conversão antes do arredondamento; não converter `null`. | FR-04; AC-04 |
| Arredondamento e formato | Empates positivos e negativos para longe de zero, como `2,5 → 3` e `−2,5 → −3`; `−2,5 °C → 27,5 °F → 28 °F`; zero sem sinal negativo; vento e percentuais inteiros; rótulos e unidades acessíveis. | FR-04, FR-08; AC-08 |
| Entrada de busca | `trim`, vazio/espaços, exatamente 100 e 101 pontos de código Unicode, caracteres fora do BMP e idiomas diferentes; ambiguidade calculada pelos campos efetivamente exibidos. | FR-01; AC-01 |
| Medidas e condição | `null`, ausência, `NaN`, infinito e domínio inválido não viram zero; mapear todos os códigos WMO documentados para pt-BR e aplicar “Condição indisponível” ao desconhecido. | FR-02, FR-03 |
| Datas e frescor | Fuso da cidade diferente do dispositivo, virada de dia/mês/ano e horário de verão; cinco datas consecutivas, lacunas/duplicatas; referência ausente/inválida, exatamente três horas e acima de três horas. | FR-02, FR-03; NFR-03, NFR-09 |

### Vitest — serviços com mock de `fetch`

- Verificar endpoint e parâmetros usando a URL analisada, sem depender da ordem textual da query: termo aparado, `count=10`, coordenadas selecionadas, variáveis `current`/`daily`, `timezone=auto`, `forecast_days=5`, Celsius e km/h.
- Validar mapeamento de geocoding para `City[]`, `admin1` ausente como `null` e resposta válida sem resultados como vazio. JSON ou estrutura inválida não pode produzir um sucesso aparente.
- Validar mapeamento de `current` e arrays diários para `WeatherData`, preservando a identidade do `City` selecionado mesmo se o forecast retornar coordenadas de grade diferentes.
- Cobrir campo meteorológico ausente, nulo, fora do domínio ou com unidade incompatível; array de medida mais curto deve deixar o campo no mesmo índice indisponível, sem deslocar dias.
- Cobrir ausência/invalidez de fuso ou datas, menos de cinco dias, duplicatas e lacunas. Distinguir esses erros estruturais de campos individuais parciais.
- Simular rejeição de rede, HTTP 429, 5xx, outros erros HTTP, JSON inválido e envelope de erro da API. Verificar classificação e ausência de payload/URL/termo nos diagnósticos.
- Com timers falsos, manter a requisição pendente, avançar até 10 segundos e verificar abort, encerramento e categoria de timeout. Cobrir também corpo de resposta que não termina de ser lido, além da espera pelo cabeçalho. Não usar espera real de dez segundos.
- Verificar que cancelamento solicitado pelo chamador é distinguível de timeout, que os recursos são limpos e que não há retry automático.

### Vitest + Testing Library — componentes e hooks

Testar componentes por papéis, nomes acessíveis e interações com `userEvent`. Para hooks, usar `renderHook`, serviços simulados e promessas controladas; não repetir os testes do parser HTTP nesses testes.

| Estado | Verificações na interface |
|---|---|
| `idle` | Orientação inicial; nenhum resultado meteorológico antes da seleção explícita. |
| `loading` | Texto específico da operação e anúncio de estado; duplicata do mesmo pedido bloqueada, mas outro termo pode substituir a busca. |
| `success` | Resultados identificáveis, cinco dias e campos/unidades esperados; campos parciais como “Indisponível”, sem ocultar o rótulo. |
| `empty` | Busca sem resultados distinta de erro e sem retry de erro; não aplicar esse estado à consulta meteorológica. |
| `error` | Mensagem própria em pt-BR, sem detalhes técnicos; retry manual operável por teclado e sem dados da cidade anterior. |

Cobrir ainda:

- Submissão por botão e Enter; vazio mantém foco, termo acima do limite não faz chamada; homônimos usam a cidade correta e opções indistinguíveis não podem ser selecionadas.
- Sequências busca A/B e cidade A/B concluídas fora de ordem: somente B publica dados, erro ou encerramento de loading; uma resposta tardia de A não apaga nem substitui B.
- Falha de busca preserva o texto; retry usa o último termo submetido. Falha meteorológica mantém a cidade solicitada. Cada acionamento de retry gera exatamente uma chamada da operação correspondente, sem retry automático.
- Troca de unidade modifica temperatura, sensação e todas as mínimas/máximas, preservando datas, condição e demais medidas; contagem de chamadas dos serviços permanece inalterada.
- Referência atual ausente ou antiga torna os atuais indisponíveis e oferece retry; previsão válida continua identificada corretamente.
- Preferência: Celsius inicial, restauração de Fahrenheit, valor salvo inválido, leitura/gravação bloqueada sem reverter a escolha da sessão e evento `storage` vindo de outra aba.
- Desmontagem/substituição limpa timers, listeners e controladores sem produzir erro visível de cancelamento.
- Com relógio controlado, verificar frescor em exatamente três horas e em três horas + 1 ms; avançar o tempo sem nova resposta e confirmar que os atuais desaparecem sem chamadas HTTP. Simular retorno de aba após timer suspenso e verificar reavaliação, limpeza e reagendamento.
- Verificar timestamp Unix normalizado para ISO UTC e horário exibido no fuso da cidade, inclusive no horário repetido da transição de verão; validar sequência diária com dias de 23/25 horas. Ao retornar à aba no dia local seguinte, não manter a previsão de ontem como hoje.

### Playwright — fluxos E2E e viewport móvel

Executar o fluxo principal tanto em **375 × 667 px** quanto em **1280 × 800 px**, com respostas interceptadas e relógio controlado:

1. Abrir a aplicação, pesquisar por botão/Enter, selecionar explicitamente uma cidade e verificar sua identificação, condições atuais e exatamente cinco datas locais.
2. Alternar Celsius/Fahrenheit e conferir todas as temperaturas e unidades; contabilizar requisições para garantir que a troca não chama geocoding nem forecast.
3. Recarregar para restaurar a unidade e abrir duas páginas no mesmo contexto para verificar sincronização real entre abas.
4. Buscar sem resultados e simular falha seguida de retry bem-sucedido; contar uma única nova chamada e verificar que o termo foi preservado.
5. Selecionar outra cidade, atrasar respostas anteriores e verificar que dados antigos desaparecem e não voltam; cobrir falha da nova cidade sem fallback.
6. Usar fixture em que o dispositivo e a cidade estejam em dias diferentes; verificar hoje e os quatro dias seguintes pelo fuso da cidade.

No viewport móvel, verificar `scrollWidth <= clientWidth` no documento, acesso a todos os controles por rolagem vertical, ausência de sobreposições e possibilidade de concluir busca, seleção e troca de unidade por toque. Em ambos os viewports, verificar teclado, nomes acessíveis, foco visível e mensagens de estado. Falhas e cálculos exaustivos permanecem no Vitest; E2E valida a integração, não repete toda a matriz unitária.

### Qualidade e critérios de aceite adicionais

- **Acessibilidade:** combinar verificações automatizadas de semântica com auditoria manual de WCAG 2.2 AA, incluindo contraste no glassmorphism, teclado e anúncios com leitor de tela. Automação isolada não comprova conformidade.
- **Compatibilidade:** projetos Playwright Chromium, Firefox e WebKit dão cobertura inicial de motores; não equivalem a todas as versões/dispositivos exigidos. Antes do lançamento, executar aceite nas versões estáveis atual e imediatamente anterior de Chrome desktop/Android, Edge, Firefox desktop e Safari macOS/iOS, registrando versões e resultados.
- **Privacidade:** inspecionar rede e armazenamento: termo só vai ao geocoding, coordenadas ao forecast e apenas unidade é persistida. Confirmar atribuição e aviso de privacidade visíveis, sem telemetria de consultas.
- **Desempenho:** medir 30 carregamentos frios do shell de produção com 375 × 667 px, CPU 4×, downstream de 1,6 Mbps, upstream de 750 Kbps e RTT de 150 ms; verificar **p75 do LCP ≤ 2,5 s**. Não substituir essa medição por um tempo de navegação E2E.
- **Comandos da fase Code/Test:** `pnpm lint`, `pnpm build`, `pnpm test` e `pnpm test:e2e`. `pnpm test:coverage` ajuda a identificar lacunas, mas percentual de cobertura não substitui as asserções dos critérios de aceite. Este plano documental não implementa nem executa essas suítes.

## Risks & Trade-offs

### Decisões técnicas e alternativas consideradas

| Decisão adotada | Benefício | Custo/risco e mitigação | Alternativa considerada |
|---|---|---|---|
| SPA React com acesso direto à Open-Meteo | Sem operação de backend e sem autenticação; publicação estática simples. | Dependência de CORS, disponibilidade e limites públicos; timeout, mensagens claras e revisão de termos antes da publicação. | Backend/proxy agregaria controle e proteção de recursos, mas adiciona infraestrutura e contraria o MVP sem backend próprio. |
| Estado local em hooks especializados | Estado perto do uso, contratos pequenos e testes isolados. | A composição passa props/callbacks entre componentes; aceitável para uma tela e uma cidade. | Context/Redux/Zustand aumentariam escopo e indirection sem necessidade atual; reconsiderar somente com compartilhamento real entre múltiplas telas. |
| `fetch` nativo com timeout e cancelamento | Sem dependência HTTP adicional e fronteira fácil de simular nos testes. | Exige controlar status, corpo, abort e concorrência explicitamente; cobrir com timers e promessas controladas. | Axios ou biblioteca de consultas poderia reduzir parte da infraestrutura, mas adiciona dependência; cache/retries automáticos de bibliotecas exigiriam desativação para cumprir a spec. |
| Busca explícita, até dez opções, sem autocomplete | Menos chamadas, fluxo previsível e seleção inequívoca. | Um passo adicional; homônimos indistinguíveis exigem refinamento. | Autocomplete com debounce ou escolha automática seria mais imediato, mas está fora do escopo e aumenta concorrência/risco de cidade errada. |
| Uma chamada de forecast para atuais e diários | Menos operações e um único contexto de cidade/fuso. | Falha estrutural da previsão impede publicar `WeatherData` completo; campo individual inválido permanece `null`. | Chamadas e estados separados permitiriam recuperação independente, mas aumentariam coordenação e alterariam o contrato simples adotado. |
| Celsius sem arredondamento no modelo; conversão derivada na renderização | Troca instantânea e consistente, sem novas chamadas ou perda cumulativa de precisão. | Todas as temperaturas devem usar o mesmo helper; testes verificam todos os campos e empates negativos. | Pedir Fahrenheit à API geraria requisições; guardar duas cópias no estado criaria risco de divergência. |
| Tipos normalizados e validação na fronteira | Componentes independentes do JSON externo; domínio explícito para valores ausentes. | Manter mapeamento e guardas exige testes de payloads. | Usar o JSON bruto acoplaria UI à API; biblioteca de schemas pode ser reconsiderada se o contrato crescer, sem adicioná-la agora. |
| `null` para medida inválida; rejeição de estrutura/datas inválidas | Não confundir ausência com zero nem inventar dias; preserva integridade. | Algumas respostas não geram uma previsão completa, mesmo com partes utilizáveis; comunicar indisponibilidade e oferecer retry. | Preencher valores, interpolar datas ou aceitar qualquer número de dias violaria a spec; união de sucesso parcial ampliaria o modelo sem necessidade do MVP. |
| Fuso IANA retornado pela previsão e datas locais | Consistência com o calendário da cidade, inclusive em viradas de dia/horário de verão. | Exige interpretação cuidadosa de horário local e testes; não usar apenas o offset fixo ou o fuso do dispositivo. | Usar sempre UTC ou o fuso do navegador seria mais simples, mas falharia nos critérios de datas locais. |
| Segundos Unix na API, instante UTC no modelo e frescor derivado | Elimina ambiguidade de horário e evita classificação temporal congelada; usa `Date`/`Intl` nativos. | Requer normalizar datas diárias pelo fuso e invalidar a apresentação localmente, sem rede. | Interpretar ISO local sem offset exigiria desambiguação adicional; biblioteca de datas/Temporal com polyfill não é necessária para converter instantes já inequívocos. |
| Apenas unidade em `localStorage`, com evento `storage` | Persistência mínima, sem servidor, com sincronização entre abas. | Armazenamento bloqueado/limpo perde persistência; manter escolha na sessão e usar Celsius sem preferência legível. | Servidor/cookies não são necessários; persistir cidade ou histórico está fora do escopo. |
| Sem cache meteorológico, refresh ou retry automáticos | Comportamento explícito, menos lógica e nenhum fallback antigo apresentado como atual. | Mais dependência da rede em cada consulta e recuperação manual; respeitar prazo de 10 s e frescor de três horas. | Cache, modo offline, polling ou backoff automático estão fora do MVP e exigiriam revisão da spec. |
| Vitest amplo e E2E enxuto com API interceptada | Feedback rápido e resultados reproduzíveis sem depender do provedor. | Mocks podem divergir da API; manter fixtures alinhadas à documentação e revisar a integração antes de publicar. | E2E exclusivamente com API real seria mais frágil/lento; apenas unitários não validariam a conexão entre camadas e o layout móvel. |
| Tailwind dark glassmorphism | Segue a identidade visual e permite layout mobile-first. | Transparências podem reduzir contraste e pesar a renderização; medir LCP e auditar WCAG 2.2 AA. | Tema opaco seria mais simples para contraste; priorizar legibilidade e reduzir efeitos quando necessário, sem sacrificar acessibilidade. |

### Riscos de publicação

- **Conformidade e privacidade:** revisar e documentar termos, limites e atribuição vigentes da Open-Meteo, incluir aviso com link para a política do provedor e não afirmar retenção ou não retenção sem confirmação. Termo/coordenadas saem diretamente do navegador, mas não devem ser persistidos pela aplicação ou incluídos em diagnósticos.
- **Compatibilidade real:** emulação móvel e WebKit do Playwright não substituem Safari/iOS ou versões anteriores reais. Planejar acesso aos ambientes exigidos antes do aceite.
- **Necessidades posteriores:** comparação de cidades, favoritos, GPS, offline ou personalização exigem mudança explícita de escopo e revisão de Spec → Plan → Tasks; não antecipar abstrações para essas possibilidades.
