# Backlog de Implementação — Weather App

Este backlog deriva de [`plans/weather-app-plan.md`](../plans/weather-app-plan.md) e de [`specs/weather-app-spec.md`](../specs/weather-app-spec.md). As tarefas foram divididas para limitar cada implementação a um ou dois arquivos e manter implementação, testes e auditorias em unidades separadas. A ordem abaixo respeita as dependências; tarefas independentes podem ser executadas em paralelo.

Não fazem parte do MVP backend, cache meteorológico, autocomplete, localização por GPS ou atualização automática.

## Rastreabilidade para a spec

Cada linha liga a tarefa aos requisitos funcionais, critérios de aceite (AC) ou requisitos não funcionais (NFR) que ela implementa ou verifica. A referência é ao identificador correspondente em `specs/weather-app-spec.md`.

| Requisito funcional | Tarefas de implementação | Tarefas de verificação |
|---|---|---|
| **FR-01 — Buscar e selecionar uma cidade** | T-02, T-08, T-10, T-14, T-15, T-25 | T-26, T-32, T-34, T-38, T-39, T-47, T-48, T-49 |
| **FR-02 — Consultar condições atuais** | T-05, T-06, T-09, T-11, T-12, T-19, T-25 | T-30, T-33, T-35, T-36, T-43, T-47, T-48, T-49 |
| **FR-03 — Consultar previsão diária** | T-05, T-06, T-09, T-11, T-12, T-20, T-21, T-25 | T-30, T-33, T-35, T-36, T-44, T-45, T-47, T-48, T-49, T-51 |
| **FR-04 — Alternar unidade de temperatura** | T-03, T-13, T-22, T-25 | T-27, T-37, T-46, T-47, T-50 |
| **FR-05 — Usar em dispositivos móveis e desktop** | T-14, T-15, T-19, T-20, T-21, T-22, T-24, T-25 | T-48, T-51, T-59 |
| **FR-06 — Comunicar estados da consulta** | T-07, T-10, T-11, T-12, T-16, T-17, T-18, T-25 | T-31, T-34, T-35, T-36, T-40, T-41, T-42, T-47, T-48, T-49 |
| **FR-07 — Manter a preferência de unidade** | T-13, T-22, T-25 | T-37, T-46, T-47, T-50, T-57 |
| **FR-08 — Apresentar unidades das medidas** | T-03, T-04, T-05, T-19, T-20 | T-27, T-28, T-29, T-43, T-44, T-46, T-47, T-50 |

**Lacunas:** não identifiquei requisito funcional sem tarefa de implementação e verificação correspondentes.

## Prioridade e tamanho

Cada tarefa abaixo recebe uma prioridade e uma estimativa relativa de tamanho:

- **P0:** necessária para entregar o fluxo principal utilizável e os critérios centrais de aceite.
- **P1:** validação ou robustez importante para completar o MVP; vem depois do primeiro fluxo visível.
- **P2:** hardening e evidências de prontidão para publicação. P2 indica ordem posterior, não dispensa o requisito; controles que a spec exige antes da publicação continuam sendo gates de release.
- **P:** mudança isolada e limitada, normalmente um arquivo e poucas condições de aceite.
- **M:** lógica com vários casos, estados ou integrações locais.
- **G:** esforço transversal, integração ampla ou validação que depende de vários ambientes/execuções.

As prioridades refletem a sequência de entrega, não a importância permanente do requisito. As tarefas P2 de conformidade, compatibilidade e desempenho continuam obrigatórias antes do release, conforme aplicável.

## Sequência sugerida em fatias verticais

Implemente e demonstre cada fatia atravessando serviço, estado e interface; execute os testes de cada fatia antes de avançar. A integração T-25 pode ser composta incrementalmente em cada fatia, mesmo que sua conclusão formal dependa de todos os componentes listados.

1. **Busca visível:** T-01 → T-02 → T-07 → T-08 → T-10 → T-14/T-15/T-16/T-17/T-18 → T-25 (incremental). Entrega formulário, resultados reais selecionáveis e estados loading/vazio/erro. Validar com T-31/T-32/T-34/T-38/T-39/T-40/T-41/T-42.
2. **Primeiro painel meteorológico:** T-03/T-04/T-05/T-06 → T-09 → T-11/T-12 → T-19/T-20/T-21 → concluir T-25. Entrega condições atuais e cinco dias para a cidade escolhida. Validar com T-30/T-33/T-35/T-36/T-43/T-44/T-45.
3. **Unidade consistente e persistida:** T-13 → T-22, com T-03/T-04 já disponíveis. Demonstra alternância e restauração entre sessões/abas. Validar com T-27/T-28/T-37/T-46.
4. **Regressão integrada:** completar T-47 e T-48 → T-49/T-50/T-51; executar T-52/T-53. Confirma estados e concorrência, ausência de regressões e fluxo principal nos viewports previstos.
5. **Hardening e release:** T-23, T-54–T-60 e, por último, T-61. Fechar acessibilidade, privacidade, conformidade do provedor, compatibilidade e p75 de LCP antes da publicação.

## Entrega 1 — Tipos

### T-01 — Definir os contratos meteorológicos
- **Descrição:** Declarar os modelos normalizados, unidades, estados assíncronos, categorias de erro e frescor.
- **Critérios de aceite:**
  - `City` contém `id`, `name`, `country`, `admin1`, `latitude` e `longitude`; `CurrentWeather`, `ForecastDay` e `WeatherData` contêm os campos definidos no plano, com medidas meteorológicas anuláveis.
  - `Unit` é a união `"celsius" | "fahrenheit"`; `OperationErrorKind` contém exatamente as seis categorias do plano; estados assíncronos incluem `idle/loading/success/error` e `empty` somente para busca.
  - O arquivo não importa React e `pnpm exec tsc --noEmit` não aponta erro de tipos relacionado ao contrato.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `src/types/weather.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M

## Entrega 2 — Funções puras

### T-02 — Validar termos e ambiguidades da busca
- **Descrição:** Criar funções puras para aparar/validar o termo e reconhecer resultados indistinguíveis.
- **Critérios de aceite:**
  - `trim` é aplicado antes da validação; vazio/espaços e mais de 100 pontos de código retornam inválido; exatamente 100 retorna válido.
  - Uma entrada com caractere fora do BMP tem contagem de um ponto de código por caractere.
  - Para dois `City` com mesmos campos de identificação exibidos, retorna ambíguo; cidades distinguíveis por nome, região ou país não são marcadas como indistinguíveis.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/search.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P

### T-03 — Implementar conversão de temperatura
- **Descrição:** Converter Celsius para Fahrenheit e arredondar os valores de temperatura na apresentação.
- **Critérios de aceite:**
  - Converte antes de arredondar e aplica empate de 0,5 para longe de zero.
  - Preserva Celsius como unidade-base, mantém `null` indisponível e normaliza zero negativo.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/temperature.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P

### T-04 — Formatar medidas e unidades acessíveis
- **Descrição:** Formatar temperaturas, vento e percentuais com seus respectivos rótulos e unidades.
- **Critérios de aceite:**
  - Vento e percentuais são arredondados ao inteiro mais próximo.
  - Valores de temperatura apresentam °C ou °F conforme unidade; vento apresenta km/h; umidade e precipitação apresentam %.
  - O texto acessível associa programaticamente cada valor à respectiva unidade; `null` resulta em “Indisponível”, nunca zero.
- **Dependências:** T-01, T-03.
- **Arquivos prováveis:** `src/lib/format.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P

### T-05 — Mapear condições meteorológicas WMO
- **Descrição:** Traduzir códigos WMO documentados para descrições em pt-BR.
- **Critérios de aceite:**
  - A função retorna o rótulo pt-BR especificado na legenda do plano para cada código WMO documentado, tanto para condições atuais quanto diárias.
  - Código não mapeado e `null` retornam exatamente “Condição indisponível”.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/weatherCodes.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M

### T-06 — Implementar regras de data e frescor
- **Descrição:** Derivar datas locais no fuso IANA, verificar a sequência diária e classificar a idade dos dados atuais.
- **Critérios de aceite:**
  - Para um timestamp Unix de teste, a função retorna a data `YYYY-MM-DD` correspondente ao fuso IANA recebido, independentemente do fuso do processo.
  - Valida sequência exata de cinco datas: hoje até hoje + 4; rejeita sequência com data ausente, repetida, fora de ordem ou lacuna, inclusive em transições de horário de verão.
  - Com `nowMs` explícito, idade de 10.800.000 ms retorna `fresh`; 10.800.001 ms, referência inválida/ausente ou futura retorna estado diferente de `fresh`.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/dates.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M

## Entrega 3 — Services

### T-07 — Implementar a fronteira HTTP
- **Descrição:** Criar helper com `fetch`, cancelamento, timeout total e classificação de falhas externas.
- **Critérios de aceite:**
  - Timer de 10.000 ms cobre a espera pela resposta e a leitura do corpo; timeout rejeita com categoria `timeout`.
  - Abort externo rejeita como cancelamento esperado, distinto de `timeout`; uma chamada ao helper resulta em no máximo uma chamada a `fetch`.
  - HTTP 429 resulta em `rate-limit`, 5xx em `unavailable`, demais status não-OK em `http`, rejeição de rede em `network` e JSON inválido em `invalid-response`.
  - Mensagem/categoria propagada não contém URL, corpo bruto, termo, coordenadas ou nome da cidade.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/services/http.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M

### T-08 — Implementar o serviço de geocoding
- **Descrição:** Consultar geocoding e validar/normalizar as localidades para `City[]`.
- **Critérios de aceite:**
  - Envia `GET` com termo aparado e codificado, `count=10`, `language=pt` e `format=json`.
  - Lista vazia representa busca sem resultados; envelope/campos obrigatórios inválidos são erro.
  - Valida ID, nome, país e limites de coordenadas; `admin1` ausente vira `null`.
  - Propaga cancelamento ao helper HTTP.
- **Dependências:** T-01, T-02, T-07.
- **Arquivos prováveis:** `src/services/geocodingService.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M

### T-09 — Implementar o serviço de previsão
- **Descrição:** Buscar condições atuais e previsão em uma chamada e normalizar para `WeatherData`.
- **Critérios de aceite:**
  - URL contém latitude/longitude da cidade selecionada, as listas `current`/`daily` do plano, `timezone=auto`, `forecast_days=5`, `temperature_unit=celsius`, `wind_speed_unit=kmh` e `timeformat=unixtime`.
  - `WeatherData.city` é igual ao `City` selecionado; sucesso requer timezone IANA válido e exatamente cinco datas locais consecutivas começando em hoje.
  - Campos individuais ausentes, não finitos, fora do domínio ou com unidade incompatível são `null` no mesmo índice; ausência/invalidade de timezone ou da estrutura obrigatória rejeita a resposta.
  - Timestamp Unix válido de `current.time` resulta em ISO 8601 UTC com sufixo `Z`; sinal de abort é propagado ao helper HTTP.
- **Dependências:** T-01, T-06, T-07.
- **Arquivos prováveis:** `src/services/weatherService.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** G

## Entrega 4 — Hooks

### T-10 — Implementar o hook de busca
- **Descrição:** Orquestrar submissão, estado da busca, substituição de operação e retry manual.
- **Critérios de aceite:**
  - Expõe termo submetido e os estados `idle/loading/success/empty/error`; resultado de zero cidades produz `empty`.
  - Termo inválido e submissão repetida do mesmo termo pendente fazem zero chamadas adicionais; novo termo inicia operação e cancela a anterior.
  - Em A/B concorrentes, apenas a operação B atualiza `data`, erro ou conclusão de loading; retry de erro chama o serviço uma vez com o último termo válido.
  - Substituição/desmontagem aborta o sinal anterior e não publica erro para esse cancelamento.
- **Dependências:** T-02, T-07, T-08.
- **Arquivos prováveis:** `src/hooks/useCitySearch.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M

### T-11 — Implementar o hook meteorológico
- **Descrição:** Orquestrar seleção da cidade, consulta, retry e proteção contra resultados obsoletos.
- **Critérios de aceite:**
  - Expõe `idle/loading/success/error`; selecionar B após A remove `WeatherData(A)` do estado de sucesso antes de iniciar a consulta de B.
  - Em `loading` ou `error`, `selectedCity` identifica B; somente a operação vigente pode publicar dados, erro ou encerramento de loading.
  - Retry da cidade selecionada chama o serviço exatamente uma vez; abort por substituição/desmontagem não publica erro.
  - O controlador da operação é abortado ao selecionar outra cidade ou desmontar.
- **Dependências:** T-06, T-07, T-09.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** G

### T-12 — Implementar a invalidação temporal no hook meteorológico
- **Descrição:** Derivar frescor/dia local e invalidar dados vencidos sem atualização automática de rede.
- **Critérios de aceite:**
  - Agenda reavaliação para o primeiro milissegundo após `observedAt + 10.800.000 ms`; nesse instante atuais deixam de ser apresentados, enquanto `forecast` permanece disponível.
  - Executa a mesma reavaliação em `focus` e na transição para `visibilityState=visible`; se o dia local mudou e a previsão não cobre hoje..hoje+4, estado de sucesso é removido.
  - Mudança de cidade, substituição de dados ou desmontagem limpa timer e listeners; nenhuma reavaliação chama o serviço.
- **Dependências:** T-06, T-11.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Tipo:** Data
- **Prioridade:** P1
- **Tamanho:** M

### T-13 — Implementar preferência de unidade
- **Descrição:** Manter unidade no estado local, persistir a preferência válida e sincronizar abas.
- **Critérios de aceite:**
  - Estado inicial é Celsius sem valor válido; valores `"celsius"` e `"fahrenheit"` salvos são restaurados, qualquer outro valor ou exceção de leitura resulta em Celsius.
  - Exceção de `localStorage.setItem` não reverte a seleção corrente; evento `storage` com valor válido atualiza o hook.
  - A única chave gravada contém a unidade; alterar unidade não chama serviços nem altera cidade/dados de previsão.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/hooks/useUnitPreference.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M

## Entrega 5 — Componentes

### T-14 — Implementar o formulário de busca
- **Descrição:** Criar o formulário explícito para submissão de termos, mantendo o texto em edição na interface.
- **Critérios de aceite:**
  - Submissões válidas emitem o termo aparado uma vez por botão e uma vez por Enter; vazio ou acima de 100 pontos de código não emite callback, apresenta orientação e mantém foco no campo.
  - Campo tem label acessível independente de placeholder; mensagens de validação são associadas programaticamente ao campo.
  - Componente não importa nem chama serviços.
- **Dependências:** T-02.
- **Arquivos prováveis:** `src/components/SearchBar.tsx`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P

### T-15 — Implementar resultados selecionáveis de cidade
- **Descrição:** Exibir até dez resultados e permitir seleção explícita de localidades não ambíguas.
- **Critérios de aceite:**
  - Renderiza no máximo dez resultados; cada opção identificável exibe nome e país e exibe região/estado quando disponível.
  - Todas as opções indistinguíveis pelos campos visíveis ficam desabilitadas; orientação para refinar o termo é exibida.
  - Ativar uma opção habilitada por teclado ou ponteiro emite exatamente o objeto `City` correspondente uma vez; componente não importa serviços.
- **Dependências:** T-02.
- **Arquivos prováveis:** `src/components/CityResults.tsx`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M

### T-16 — Implementar apresentação de carregamento
- **Descrição:** Criar estado de carregamento com anúncio acessível da operação pendente.
- **Critérios de aceite:**
  - Para prop `operation=search`, renderiza texto de busca em pt-BR; para `operation=weather`, renderiza texto de consulta meteorológica em pt-BR.
  - Conteúdo está em região `role="status"` ou equivalente com anúncio educado (`aria-live="polite"`).
  - Renderização não inclui URL nem payload técnico.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/components/states/LoadingState.tsx`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P

### T-17 — Implementar apresentação de busca vazia
- **Descrição:** Criar estado vazio específico para busca sem resultados.
- **Critérios de aceite:**
  - Renderiza orientação pt-BR sob região anunciável ao receber estado vazio.
  - Não renderiza botão/ação de retry e não aceita estado de consulta meteorológica como estado vazio.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/components/states/EmptyState.tsx`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P

### T-18 — Implementar apresentação de erro e retry
- **Descrição:** Exibir erro seguro e ação de nova tentativa manual.
- **Critérios de aceite:**
  - Mensagem genérica pt-BR não renderiza URL, payload ou detalhes técnicos e é exposta em região de alerta (`role="alert"` ou equivalente).
  - Botão de retry executa callback uma vez por ativação e pode ser acionado por teclado.
  - Props permitem identificar operação e cidade solicitada; nenhum dado meteorológico anterior é exibido pelo componente de erro.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/components/states/ErrorState.tsx`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P

### T-19 — Implementar condições meteorológicas atuais
- **Descrição:** Apresentar dados atuais, cidade selecionada, referência temporal e disponibilidade.
- **Critérios de aceite:**
  - Recebe `city`, `current` e `unit`; renderiza cidade, temperatura hero, sensação, ícone decorativo WMO, condição, umidade, vento, precipitação atual em mm e pressão ao nível do mar em hPa; cada valor numérico tem unidade visível e nome acessível conforme FR-08 ampliado.
  - Cada campo `null` renderiza “Indisponível” e WMO desconhecido renderiza “Condição indisponível”. Precipitação usa uma casa decimal e pressão um inteiro.
  - A composição T-25 cuida da referência usando `WeatherData.timezone`, frescor e retry: dados não atuais chegam ao hero com medidas nulas.
  - Ampliar T-01 e o mock com `precipitationMm` e `pressureHpa` anuláveis; T-09 deve solicitar `precipitation`/`pressure_msl` e validar mm/hPa conforme o plano. Testar conversão, arredondamento negativo, nulos, unidades e troca de props sem rede.
- **Dependências:** T-03, T-04, T-05, T-06.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M

### T-20 — Implementar cartão de previsão diária
- **Descrição:** Apresentar um resumo acessível de um único dia.
- **Critérios de aceite:**
  - Para um `ForecastDay`, renderiza data, condição, mínima, máxima e probabilidade de precipitação, cada um com label e unidade exigidos por FR-08.
  - Mínima/máxima passam pelo helper de conversão; cada valor `null` aparece como “Indisponível”, sem valor substituto.
  - Nomes e papéis acessíveis identificam o cartão e seus campos.
- **Dependências:** T-03, T-04, T-05.
- **Arquivos prováveis:** `src/components/ForecastCard.tsx`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M

### T-21 — Implementar composição da lista de previsão
- **Descrição:** Renderizar a coleção de dias normalizados usando o cartão diário.
- **Critérios de aceite:**
  - Recebendo cinco `ForecastDay`, renderiza exatamente cinco cartões na mesma ordem e com as datas recebidas.
  - Com lista menor ou maior que cinco, não cria, duplica nem desloca dias; estrutura incompatível não é apresentada como previsão válida.
  - Componente não importa serviços e usa a coleção normalizada do contrato.
- **Dependências:** T-20.
- **Arquivos prováveis:** `src/components/ForecastList.tsx`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P

### T-22 — Implementar controle de unidade
- **Descrição:** Criar controle acessível para alternar Celsius/Fahrenheit.
- **Critérios de aceite:**
  - Exibe exatamente as opções Celsius e Fahrenheit e identifica programaticamente a opção selecionada.
  - Cada opção pode ser selecionada por teclado e toque; indicador de foco é visível.
  - Selecionar uma opção emite o valor `Unit` correspondente uma vez e não importa/chama serviços.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/components/UnitToggle.tsx`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P

### T-23 — Exibir atribuição e aviso de privacidade
- **Descrição:** Apresentar a atribuição Open-Meteo e link para política de privacidade do provedor.
- **Critérios de aceite:**
  - Renderiza texto de atribuição com link para Open-Meteo e link para a política de privacidade vigente do provedor.
  - Aviso informa que o termo é enviado ao geocoding e pode ser processado conforme a política do provedor; não afirma retenção ou não retenção sem confirmação.
  - Ambos os links têm nome acessível e destino verificável por teste de componente.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `src/components/ProviderNotice.tsx`
- **Tipo:** UI
- **Prioridade:** P1
- **Tamanho:** P

### T-24 — Criar estilos globais responsivos
- **Revisão da UI mock:** verificar 320/375/640/768/1024/1280px e texto a 200%,
  atalho para main, foco após retry, anúncio de sucesso, alvos de busca de 44px
  e contraste de texto/controles nas superfícies glass. Preservar os contratos
  de roles, labels, teclado e preferência de movimento reduzido.
- **Descrição:** Configurar tema dark glassmorphism e estilos base mobile-first.
- **Critérios de aceite:**
  - Em viewport 375 × 667, `document.documentElement.scrollWidth <= clientWidth`; em 1280 × 800, estilos globais não ocultam conteúdo.
  - Cores aplicáveis a texto normal atingem contraste mínimo 4,5:1 e texto grande/controles 3:1 sobre as superfícies renderizadas.
  - Regras de foco definem indicador visível para `:focus-visible`.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `src/styles/index.css`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M

## Entrega 6 — Integração

### T-25 — Compor a tela principal
- **Fatia de UI com mock (antes dos hooks):** criar `App` com header, busca,
  unidade local e seletor explícito dos cinco estados. Inicializar em `idle`;
  buscar/retry mostra São Paulo do mock, sem rede e com aviso de demonstração.
  Recriar `main.tsx` e estilos globais para executar o layout. Testar os cinco
  estados, retry e conversão sem mutação. Esta fatia não conclui a integração
  real descrita abaixo nem simula seleção de cidades.
- **Descrição:** Conectar hooks e componentes em `App`, sem duplicar estado ou expor dados brutos.
- **Critérios de aceite:**
  - Submeter nova busca não muda a cidade meteorológica selecionada; selecionar B chama o callback do hook meteorológico com B e deixa de renderizar dados de A.
  - Estados da busca e da previsão são dirigidos pelos hooks independentes; cada erro liga o retry ao hook/operação correspondente.
  - `App` compõe componentes por props/callbacks, sem importar serviço nem acessar `localStorage`; não duplica o estado mantido pelos hooks.
- **Dependências:** T-10, T-11, T-12, T-13, T-14, T-15, T-16, T-17, T-18, T-19, T-21, T-22, T-23, T-24.
- **Arquivos prováveis:** `src/App.tsx`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** G

## Entrega 7 — Testes

### T-26 — Testar validação da busca
- **Descrição:** Cobrir limites Unicode, normalização e identificação de ambiguidades.
- **Critérios de aceite:**
  - Vitest passa para casos vazio, espaços, 100/101 pontos de código e caractere fora do BMP.
  - Testes por tabela verificam ao menos duas cidades distinguíveis por região/país e duas indistinguíveis pelos campos exibidos.
- **Dependências:** T-02.
- **Arquivos prováveis:** `tests/unit/search.test.ts`
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P

### T-27 — Testar unitariamente conversão Celsius/Fahrenheit
- **Descrição:** Cobrir com testes unitários a conversão entre unidades e o arredondamento de temperaturas.
- **Critérios de aceite:**
  - Vitest confirma `0 °C → 32 °F`, `100 °C → 212 °F`, `−40 °C → −40 °F` e preservação do valor em Celsius.
  - Vitest confirma conversão antes do arredondamento, empates `2,5 → 3` e `−2,5 → −3`, `null` não convertido e ausência de `-0`.
- **Dependências:** T-03.
- **Arquivos prováveis:** `tests/unit/temperature.test.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P

### T-28 — Testar formatação das medidas
- **Descrição:** Verificar apresentação e unidades acessíveis das medidas meteorológicas.
- **Critérios de aceite:**
  - Vitest confirma sufixos °C, °F, km/h e %, além do nome acessível associado a cada unidade.
  - Vitest confirma arredondamento inteiro de vento/percentuais e representação “Indisponível” para `null`, nunca `0`.
- **Dependências:** T-04.
- **Arquivos prováveis:** `tests/unit/format.test.ts`
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P

### T-29 — Testar mapeamento de códigos WMO
- **Descrição:** Validar os rótulos pt-BR da legenda meteorológica.
- **Critérios de aceite:**
  - Um teste por tabela compara a saída de todos os códigos WMO documentados com seus rótulos pt-BR esperados.
  - Testes confirmam que código desconhecido e `null` retornam exatamente “Condição indisponível”.
- **Dependências:** T-05.
- **Arquivos prováveis:** `tests/unit/weatherCodes.test.ts`
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P

### T-30 — Testar datas locais e frescor
- **Descrição:** Cobrir fuso, sequência diária e limites temporais com referências explícitas.
- **Critérios de aceite:**
  - Fixtures verificam um fuso diferente do dispositivo, virada de dia/mês/ano e transições com dias de 23 e 25 horas.
  - Testes rejeitam datas ausentes, duplicadas, fora de ordem e com lacunas; verificam 10.800.000 ms como `fresh` e 10.800.001 ms como não `fresh`.
- **Dependências:** T-06.
- **Arquivos prováveis:** `tests/unit/dates.test.ts`
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M

### T-31 — Testar a fronteira HTTP
- **Descrição:** Cobrir classificação, timeout e cancelamento com `fetch` simulado e timers controlados.
- **Critérios de aceite:**
  - Vitest valida o mapeamento `429→rate-limit`, `5xx→unavailable`, outro status não-OK→`http`, rejeição de rede→`network` e JSON inválido→`invalid-response`.
  - Com timers falsos, avançar 10.000 ms aborta a requisição pendente durante conexão ou leitura do corpo e retorna `timeout`; abort externo não retorna `timeout`.
  - Uma chamada ao helper chama `fetch` uma vez; após conclusão, sucesso, falha ou abort, timer/controlador interno é limpo.
- **Dependências:** T-07.
- **Arquivos prováveis:** `tests/unit/http.test.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M

### T-32 — Testar o serviço de geocoding
- **Descrição:** Verificar parâmetros, mapeamento e respostas de geocoding simuladas.
- **Critérios de aceite:**
  - Vitest analisa a URL e confere `name`, `count=10`, `language=pt` e `format=json` independentemente da ordem textual.
  - Fixtures cobrem `results` preenchido, vazio/ausente conforme envelope válido, `admin1` omitido, coordenadas/ID obrigatórios inválidos e JSON/envelope inválido.
  - `globalThis.fetch` é mockado em todos os casos; verificações cobrem URL/parâmetros e resposta mapeada sem requisição real à Open-Meteo.
- **Dependências:** T-08.
- **Arquivos prováveis:** `tests/unit/geocodingService.test.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M

### T-33 — Testar o serviço de previsão
- **Descrição:** Verificar a requisição e a normalização de respostas de forecast simuladas.
- **Critérios de aceite:**
  - Vitest confere cada query param e compara `WeatherData.city` com a cidade de entrada, mais os valores normalizados atuais e diários.
  - Fixtures verificam um campo parcial como `null` sem deslocamento, unidade incompatível, array curto, timezone inválido e datas ausentes, duplicadas ou descontínuas.
  - Fixtures verificam Unix→ISO UTC e classificações de resposta estrutural, HTTP, rede, timeout e cancelamento; `globalThis.fetch` é mockado em todos os casos e nenhuma chamada real é feita.
- **Dependências:** T-09.
- **Arquivos prováveis:** `tests/unit/weatherService.test.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M

### T-34 — Testar o hook de busca
- **Descrição:** Verificar estados, concorrência e retry com serviço simulado.
- **Critérios de aceite:**
  - Vitest confirma `empty` diferente de `error`, termo preservado após falha e exatamente uma chamada no retry.
  - Promessas controladas resolvem A após B e confirmam que apenas B publica dados/erro/loading; entrada inválida e termo pendente duplicado não incrementam o total de chamadas.
  - Ao desmontar, o sinal da operação pendente está abortado e nenhum erro de cancelamento é emitido.
- **Dependências:** T-10.
- **Arquivos prováveis:** `tests/unit/useCitySearch.test.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M

### T-35 — Testar o hook meteorológico
- **Descrição:** Verificar concorrência, timeout e retry do ciclo de consulta meteorológica.
- **Critérios de aceite:**
  - Teste com promessas controladas resolve a consulta A depois de B e confirma que estado/dados permanecem associados a B; falha B não restaura dados de A.
  - Timeout vigente transita para erro e cada acionamento de retry resulta em exatamente uma chamada.
  - Substituição e desmontagem abortam a operação e não deixam erro visível de cancelamento nem operação ativa.
- **Dependências:** T-11.
- **Arquivos prováveis:** `tests/unit/useWeather.test.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M

### T-36 — Testar invalidação temporal do hook meteorológico
- **Descrição:** Cobrir frescor, virada de dia local e reavaliação ao retornar à aba.
- **Critérios de aceite:**
  - Com relógio falso, em 10.800.000 ms os atuais continuam disponíveis; em 10.800.001 ms ficam indisponíveis e o contador de chamadas HTTP não muda.
  - Evento `focus` e retorno a `visibilityState=visible` reavaliam frescor e sequência local de datas; fixture vencida deixa de estar em sucesso.
  - Após substituir/desmontar, nenhum timer/listener permanece ativo; avançar o relógio por mais de um ciclo não gera chamadas de serviço.
- **Dependências:** T-12.
- **Arquivos prováveis:** `tests/unit/useWeather.test.ts`
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M

### T-37 — Testar preferência de unidade
- **Descrição:** Cobrir inicialização, armazenamento indisponível e evento de sincronização.
- **Critérios de aceite:**
  - Vitest verifica estados iniciais para armazenamento ausente, `"fahrenheit"`, valor desconhecido e exceções de leitura/gravação.
  - Disparar `storage` com `"celsius"`/`"fahrenheit"` atualiza o valor; após unmount, disparar evento não altera estado nem encontra listener registrado.
  - Spy de `setItem` confirma que somente a chave/valor da unidade é persistida.
- **Dependências:** T-13.
- **Arquivos prováveis:** `tests/unit/useUnitPreference.test.ts`
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P

### T-38 — Testar formulário de busca
- **Descrição:** Verificar submissão, validação apresentada e acessibilidade do formulário.
- **Critérios de aceite:**
  - Testing Library verifica submissão por botão e Enter, e exatamente um callback com texto aparado em cada caso válido.
  - Vazio e 101 pontos de código não chamam callback, exibem mensagem e mantêm foco no campo.
  - As consultas dos testes usam roles/nomes acessíveis; nenhum teste faz requisição de rede.
- **Dependências:** T-14.
- **Arquivos prováveis:** `tests/unit/SearchBar.test.tsx`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P

### T-39 — Testar resultados de cidade
- **Descrição:** Verificar apresentação, ambiguidade e seleção por teclado.
- **Critérios de aceite:**
  - Testing Library confirma nome/país e região quando fornecida, e não renderiza mais do que 10 opções para 11 cidades recebidas.
  - Opções ambíguas não podem ser ativadas; ativar opção distinguível por teclado emite exatamente a cidade completa correspondente.
  - Ao renderizar ou destacar resultados sem ação do usuário, callback de seleção permanece não chamado.
- **Dependências:** T-15.
- **Arquivos prováveis:** `tests/unit/CityResults.test.tsx`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P

### T-40 — Testar estado de carregamento
- **Descrição:** Verificar texto e anúncio semântico do estado de carregamento.
- **Critérios de aceite:**
  - Testing Library confirma texto pt-BR para busca e previsão, respectivamente, via `role=status` ou anúncio equivalente.
  - Em ambos os casos a região usa `aria-live=polite` e não contém URL/payload técnico.
- **Dependências:** T-16.
- **Arquivos prováveis:** `tests/unit/LoadingState.test.tsx`
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P

### T-41 — Testar estado de busca vazia
- **Descrição:** Verificar mensagem vazia distinta de erro.
- **Critérios de aceite:**
  - Testing Library confirma orientação pt-BR e região anunciável para busca sem resultados.
  - A consulta por botão de retry retorna zero elementos; estado vazio não mostra mensagem de erro.
- **Dependências:** T-17.
- **Arquivos prováveis:** `tests/unit/EmptyState.test.tsx`
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P

### T-42 — Testar estado de erro
- **Descrição:** Verificar mensagem segura e callback de retry.
- **Critérios de aceite:**
  - Testing Library confirma que URL e payload de fixture não aparecem no DOM; a mensagem está em região de alerta.
  - Um clique ou Enter no botão de retry chama o callback exatamente uma vez por ativação.
  - Para erro meteorológico, o estado identifica a cidade solicitada e não renderiza os dados da cidade anterior.
- **Dependências:** T-18.
- **Arquivos prováveis:** `tests/unit/ErrorState.test.tsx`
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P

### T-43 — Testar condições atuais
- **Descrição:** Verificar campos, unidades, dados parciais e frescor da apresentação.
- **Critérios de aceite:**
  - Testing Library confirma os cinco campos FR-02, cidade, horário no fuso fornecido e unidade para valores válidos.
  - Campos `null` exibem “Indisponível”; código WMO desconhecido exibe “Condição indisponível”.
  - Com frescor `stale` ou `unknown`, valores atuais não são encontrados como dados atuais no DOM.
- **Dependências:** T-19.
- **Arquivos prováveis:** `tests/unit/CurrentWeather.test.tsx`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P

### T-44 — Testar cartão de previsão
- **Descrição:** Verificar campos e valores de um dia, incluindo unidades.
- **Critérios de aceite:**
  - Testing Library confirma data, condição, mínima, máxima e probabilidade de precipitação com as unidades correspondentes.
  - Fixtures com cada campo numérico nulo resultam em “Indisponível” no respectivo campo, sem zero substituto.
- **Dependências:** T-20.
- **Arquivos prováveis:** `tests/unit/ForecastCard.test.tsx`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P

### T-45 — Testar lista de previsão
- **Descrição:** Verificar quantidade, ordem e renderização dos dias.
- **Critérios de aceite:**
  - Testing Library confirma cinco cartões para cinco entradas e verifica a ordem dos identificadores/datas de entrada.
  - Com lista incompleta, nenhum cartão ou dia é inventado; a lista não duplica itens.
- **Dependências:** T-21, T-44.
- **Arquivos prováveis:** `tests/unit/ForecastList.test.tsx`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P

### T-46 — Testar controle de unidade
- **Descrição:** Verificar estado selecionado e interação acessível do controle.
- **Critérios de aceite:**
  - Testing Library confirma exatamente duas opções, seleção indicada e callback com `"celsius"`/`"fahrenheit"` ao acionar teclado.
  - Mocks dos serviços permanecem com zero chamadas após cada troca de unidade.
- **Dependências:** T-22.
- **Arquivos prováveis:** `tests/unit/UnitToggle.test.tsx`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P

### T-47 — Testar integração da tela principal
- **Descrição:** Verificar composição dos estados e callbacks em `App` com hooks simulados.
- **Critérios de aceite:**
  - Testing Library percorre submissão, seleção e estado de sucesso; verifica também loading, vazio e erro independentes para busca e previsão.
  - Busca nova sem seleção não troca a cidade; selecionar B remove A antes da resposta e falha de B não mostra dados de A.
  - Troca de unidade altera os valores atuais e diários; o número de chamadas mockadas a geocoding e forecast não aumenta.
- **Dependências:** T-25, T-38, T-39, T-40, T-41, T-42, T-43, T-45, T-46.
- **Arquivos prováveis:** `tests/unit/App.test.tsx`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** G

### T-48 — Testar o fluxo E2E de busca e previsão
- **Descrição:** Cobrir a jornada principal em viewport móvel com respostas de API interceptadas.
- **Critérios de aceite:**
  - Em viewport 375 × 667, Playwright intercepta geocoding/forecast e confirma busca, seleção explícita, cidade atual, condições e exatamente cinco dias.
  - Nesse fluxo principal, `document.documentElement.scrollWidth <= clientWidth`; busca, seleção e troca de unidade podem ser concluídas sem rolagem horizontal.
  - Cenários separados confirmam busca vazia e falha seguida de retry com exatamente uma requisição adicional.
  - Todas as requisições necessárias ao teste são interceptadas; execução não depende de acesso externo.
- **Dependências:** T-25, T-47.
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** G

### T-49 — Testar respostas obsoletas e troca de cidade em E2E
- **Descrição:** Verificar que uma resposta atrasada ou falha da cidade anterior não substitui a cidade atual.
- **Critérios de aceite:**
  - Playwright retém resposta da cidade A, completa B primeiro e depois libera A; somente identificação e dados de B permanecem no DOM.
  - Após selecionar B, dados de A desaparecem antes da resposta; uma resposta de erro de B mantém A ausente e mostra erro de B.
- **Dependências:** T-48.
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M

### T-50 — Testar unidade e sincronização entre abas em E2E
- **Descrição:** Verificar persistência da unidade após reload e sincronização entre páginas.
- **Critérios de aceite:**
  - Com contador de requests interceptados, selecionar Fahrenheit atualiza temperatura/sensação/mínimas/máximas sem incrementar chamadas geocoding/forecast.
  - Reload mantém Fahrenheit selecionado; ao alterar para Celsius em uma página, a segunda página no mesmo contexto mostra Celsius.
- **Dependências:** T-48.
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M

### T-51 — Testar responsividade e fuso em E2E
- **Descrição:** Validar o fluxo funcional em viewport móvel/desktop e com fuso da cidade diferente do dispositivo.
- **Critérios de aceite:**
  - Playwright conclui busca, seleção e unidade nas viewports 375 × 667 e 1280 × 800.
  - Na viewport móvel `document.documentElement.scrollWidth <= clientWidth`; busca, seleção e unidade podem ser acionadas por teclado e clique/toque sem elementos sobrepostos.
  - Com timezone de cidade e timezone do contexto em datas locais diferentes, os cinco rótulos exibidos correspondem às datas da cidade.
- **Dependências:** T-48.
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** G

### T-52 — Executar suíte unitária
- **Descrição:** Rodar os testes unitários de domínio, serviços, hooks e componentes.
- **Critérios de aceite:**
  - `pnpm test` encerra com código 0 e relatório com zero testes falhos.
  - Serviços externos estão mockados; suíte passa sem conexão com os endpoints Open-Meteo.
- **Dependências:** T-26, T-27, T-28, T-29, T-30, T-31, T-32, T-33, T-34, T-35, T-36, T-37, T-38, T-39, T-40, T-41, T-42, T-43, T-44, T-45, T-46, T-47.
- **Arquivos prováveis:** `package.json`
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M

### T-53 — Executar suíte E2E
- **Descrição:** Rodar os fluxos Playwright e validar o resultado integrado.
- **Critérios de aceite:**
  - `pnpm test:e2e` encerra com código 0 e relatório com zero testes falhos.
  - Requests de geocoding/forecast dos cenários são interceptados; a execução não depende de serviços externos.
  - O relatório identifica quais cenários cobrem AC-01, AC-02, AC-03, AC-04, AC-05 e AC-06.
- **Dependências:** T-25, T-48, T-49, T-50, T-51.
- **Arquivos prováveis:** `package.json`
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M

## Entrega 8 — Hardening

### T-54 — Auditar acessibilidade da interface
- **Descrição:** Executar auditoria manual de WCAG 2.2 AA para contraste, teclado, foco e anúncios.
- **Critérios de aceite:**
  - Relatório registra navegador/versão, viewport, tecnologia assistiva usada e resultado Pass/Fail para contraste, ordem/foco, teclado, nomes/papéis e anúncios de loading/empty/error.
  - Para texto normal mede contraste ≥4,5:1 e para texto grande/controles ≥3:1; inclui valores e combinações de cores testadas.
  - Cada falha inclui evidência reproduzível e referência para tarefa corretiva; auditoria não altera arquivos de implementação.
- **Dependências:** T-51.
- **Arquivos prováveis:** `docs/accessibility-audit.md`
- **Tipo:** Test
- **Prioridade:** P2
- **Tamanho:** G

### T-55 — Revisar termos e atribuição Open-Meteo
- **Descrição:** Consultar termos, limites e exigências de atribuição vigentes antes da publicação.
- **Critérios de aceite:**
  - Relatório registra data da consulta, URL de cada fonte oficial, requisito de atribuição, limites aplicáveis e decisão Pass/Fail/pendente.
  - Cada requisito aplicável é comparado com a atribuição e aviso renderizados; pendência resulta em decisão explícita de bloqueio de publicação.
- **Dependências:** T-23.
- **Arquivos prováveis:** `docs/provider-compliance.md`
- **Tipo:** Infra
- **Prioridade:** P2
- **Tamanho:** M

### T-56 — Auditar dados enviados às APIs
- **Descrição:** Inspecionar os serviços para confirmar o escopo dos dados transmitidos a cada endpoint.
- **Critérios de aceite:**
  - Revisão do código e inspeção de requests confirmam que geocoding recebe somente o termo aparado e parâmetros documentados; forecast recebe coordenadas da cidade selecionada e parâmetros documentados.
  - Busca por chamadas de logging/telemetria nos dois serviços não encontra termo, coordenadas, cidade nem payload; evidência é registrada no relatório.
- **Dependências:** T-08, T-09.
- **Arquivos prováveis:** `src/services/geocodingService.ts`, `src/services/weatherService.ts`
- **Tipo:** Infra
- **Prioridade:** P2
- **Tamanho:** M

### T-57 — Auditar armazenamento e diagnósticos
- **Descrição:** Inspecionar persistência local e classificação de erro para confirmar minimização de dados.
- **Critérios de aceite:**
  - Inspeção do `localStorage` antes/depois de busca, consulta e troca de unidade confirma que a única chave da aplicação contém a unidade.
  - Testes com valores-canário para termo, coordenadas, cidade e payload confirmam que nenhum aparece na mensagem/categoria de erro ou diagnóstico.
- **Dependências:** T-07, T-13.
- **Arquivos prováveis:** `src/hooks/useUnitPreference.ts`, `src/services/http.ts`
- **Tipo:** Infra
- **Prioridade:** P2
- **Tamanho:** M

### T-58 — Consolidar evidências de privacidade
- **Descrição:** Registrar resultados das revisões de provedor, tráfego e armazenamento para a liberação.
- **Critérios de aceite:**
  - `docs/provider-compliance.md` referencia resultados e evidências de T-55, T-56 e T-57, com data e status por controle.
  - Cada item pendente tem responsável/decisão necessária e status `bloqueia publicação`; documento só marca pronto quando não há pendências bloqueadoras.
- **Dependências:** T-55, T-56, T-57.
- **Arquivos prováveis:** `docs/provider-compliance.md`
- **Tipo:** Infra
- **Prioridade:** P2
- **Tamanho:** M

### T-59 — Validar compatibilidade entre navegadores
- **Descrição:** Executar aceite nas versões e plataformas de navegador especificadas no plano.
- **Critérios de aceite:**
  - Relatório lista versão e resultado separado para Chrome desktop e Android, Edge, Firefox desktop e Safari macOS e iOS, nas versões estáveis atual e anterior.
  - Em cada combinação executa busca, seleção, consulta, troca de unidade e estados de erro; resultado é Pass/Fail com falhas reproduzíveis registradas.
- **Dependências:** T-48, T-51.
- **Arquivos prováveis:** `docs/browser-compatibility.md`
- **Tipo:** Test
- **Prioridade:** P2
- **Tamanho:** G

### T-60 — Medir desempenho do shell de produção
- **Descrição:** Medir LCP em 30 carregamentos frios com o perfil de rede/dispositivo do plano.
- **Critérios de aceite:**
  - Usa viewport 375 × 667, CPU 4×, downstream 1,6 Mbps, upstream 750 Kbps e RTT 150 ms.
  - Registra 30 amostras e calcula p75; p75 do LCP é ≤ 2,5 s.
  - Não usa tempo de navegação E2E como substituto.
- **Dependências:** T-48.
- **Arquivos prováveis:** `docs/performance-validation.md`
- **Tipo:** Test
- **Prioridade:** P2
- **Tamanho:** M

### T-61 — Validar lint e build de produção
- **Descrição:** Executar verificações estáticas e build final após a integração.
- **Critérios de aceite:**
  - `pnpm lint` e `pnpm build` encerram com código de saída 0; a saída/resultados dos dois comandos são registrados.
  - Qualquer execução com código diferente de 0 mantém esta tarefa incompleta e registra a falha para correção.
- **Dependências:** T-25, T-48, T-49, T-50, T-51, T-52, T-53, T-54, T-55, T-56, T-57, T-58, T-59, T-60.
- **Arquivos prováveis:** `package.json`
- **Tipo:** Infra
- **Prioridade:** P1
- **Tamanho:** M
