# Especificação de Produto — Weather App

## Overview

O Weather App é uma aplicação web responsiva para pesquisar uma cidade e consultar suas condições meteorológicas atuais e a previsão diária de cinco dias. A experiência atende consultas rápidas em dispositivos móveis e planejamento em desktop; não depende de uma persona validada para funcionar.

O MVP deve permitir:

- consultar temperatura, sensação térmica, condição do tempo, umidade e velocidade do vento atuais;
- visualizar resumos para hoje e os quatro dias seguintes, segundo o fuso horário da cidade selecionada;
- alternar todas as temperaturas exibidas entre Celsius e Fahrenheit;
- usar as funções principais em dispositivos móveis e desktop;
- receber retorno claro durante carregamento, quando não houver resultados e quando uma consulta falhar.

A fonte de dados é a Open-Meteo, por meio de seus serviços públicos de geocoding e previsão, consultados pelo navegador sem backend próprio ou autenticação no MVP. A interface, mensagens e formatos de data devem ser apresentados em português do Brasil (pt-BR). O escopo e os valores operacionais abaixo são decisões do MVP, não hipóteses a confirmar. A publicação fica condicionada à revisão de conformidade com os termos efetivos do provedor, sem alterar o escopo funcional aqui definido.

## Functional Requirements

- **FR-01 — Buscar e selecionar uma cidade:** o usuário pode submeter uma busca por nome de cidade usando o botão ou Enter. Remover espaços externos e aceitar até 100 caracteres Unicode; texto vazio não gera requisição e recebe orientação. Termos com mais de 100 caracteres são rejeitados com mensagem e sem requisição. Os nomes de cidades podem ser pesquisados em qualquer idioma suportado pela Open-Meteo; interface e mensagens permanecem em pt-BR. A busca é explícita, não autocompletada, e exibe até 10 resultados retornados pela fonte, com nome da localidade e país, mais região/estado quando disponível. Cada opção representa a localidade retornada, não somente seu nome. Resultados indistinguíveis com os campos exibidos não podem ser selecionados e exigem refinamento do termo. A consulta meteorológica começa somente após seleção explícita; o MVP apresenta uma cidade por vez. Em falha da busca, preservar o termo para nova tentativa.
- **FR-02 — Consultar condições atuais:** para a cidade selecionada, apresentar temperatura, sensação térmica, condição do tempo em português do Brasil, umidade e velocidade do vento. Mapear códigos meteorológicos usando a legenda documentada da Open-Meteo; código não reconhecido é “Condição indisponível”. Exibir horário de referência recebido da fonte no fuso da cidade, se fornecido. Se um campo estiver ausente ou inválido, identificá-lo como “Indisponível”, sem substituí-lo por zero. Identificar a cidade consultada junto aos dados. Não apresentar dados com mais de 3 horas de idade como atuais; se a referência temporal estiver ausente ou exceder esse limite, mostrar os valores como indisponíveis e oferecer nova tentativa.
- **FR-03 — Consultar previsão diária:** apresentar cinco resumos diários: hoje e os quatro dias seguintes no fuso horário da cidade selecionada. Cada resumo contém data, condição em pt-BR, mínima, máxima e probabilidade de precipitação. Campo individual ausente ou inválido é “Indisponível”, sem inferência ou substituição por zero. Se a fonte não fornecer cinco datas válidas e consecutivas, informar que a previsão completa não está disponível, sem inventar datas.
- **FR-04 — Alternar unidade de temperatura:** permitir selecionar Celsius ou Fahrenheit. Aplicar a unidade à temperatura e sensação térmica atuais e às mínimas e máximas de todos os dias. Exibir temperaturas arredondadas ao inteiro mais próximo (0,5 arredondado para longe de zero), convertendo o valor de origem antes do arredondamento. A troca de unidade não dispara requisições.
- **FR-05 — Usar em dispositivos móveis e desktop:** as funções de busca, seleção, consulta e alternância de unidade devem estar disponíveis em uma interface responsiva, priorizando telas móveis e também atendendo desktop.
- **FR-06 — Comunicar estados da consulta:** busca e consulta meteorológica têm estados de repouso, carregamento, sucesso, vazio (busca) e erro. Erros de rede, timeout, resposta inválida, indisponibilidade e limite de requisições são comunicados sem detalhes técnicos; oferecer nova tentativa manual, sem repetição automática. Cada requisição expira após 10 segundos. Uma busca nova substitui a pendente para fins de exibição; ao consultar outra cidade, remover os dados da anterior até sucesso. Respostas fora de ordem de requisições substituídas são ignoradas.
- **FR-07 — Manter a preferência de unidade:** manter a unidade escolhida no armazenamento local do navegador entre sessões, sem persistência em servidor. Usar Celsius quando não houver preferência válida legível. Se não puder salvar, manter a escolha na sessão corrente. Sincronizar uma alteração entre abas abertas do mesmo navegador; uma aba sem acesso ao armazenamento mantém seu estado local e inicia em Celsius em nova sessão.
- **FR-08 — Apresentar unidades das medidas:** todo valor numérico exibe sua unidade: °C ou °F para temperaturas, km/h para velocidade do vento e % para umidade e precipitação. Vento, umidade e precipitação são arredondados ao inteiro mais próximo; todas as unidades têm nome acessível.

## User Stories

- **US-01:** Como pessoa que pesquisa uma cidade, quero ver resultados identificados por localidade, região/estado quando disponível e país para selecionar o lugar correto.
- **US-02:** Como pessoa que consulta o clima, quero ver as condições atuais de uma cidade para decidir como me preparar.
- **US-03:** Como pessoa que planeja atividades, quero comparar os resumos diários dos próximos cinco dias para escolher quando realizar uma atividade.
- **US-04:** Como pessoa que prefere uma unidade de temperatura, quero alternar entre Celsius e Fahrenheit para interpretar as temperaturas com facilidade.
- **US-05:** Como pessoa que consulta o clima no celular ou desktop, quero acessar as funções principais em diferentes tamanhos de tela.
- **US-06:** Como pessoa que aguarda uma consulta ou enfrenta uma falha, quero entender o estado do pedido e ter uma forma de tentar novamente quando aplicável.
- **US-07:** Como pessoa que já escolheu uma unidade, quero que minha preferência continue selecionada em sessões futuras no mesmo navegador.
- **US-08:** Como pessoa que consulta diferentes medidas meteorológicas, quero ver a unidade de cada valor para interpretá-lo corretamente.

## Traceability Matrix

| User Story | Acceptance Criteria | Requisitos não funcionais relevantes |
|---|---|---|
| **US-01 — Buscar e selecionar uma cidade** | AC-01; AC-06.1–2 | NFR-02 (operabilidade); NFR-04 (pt-BR); NFR-05 (compatibilidade); NFR-06 (serviço externo); NFR-07 (acessibilidade); NFR-08 (privacidade); NFR-09 (desempenho/timeout); NFR-10 (diagnósticos seguros). |
| **US-02 — Consultar condições atuais** | AC-02; AC-06.3–6; AC-08 | NFR-03 (integridade da localidade e unidade); NFR-04 (pt-BR); NFR-05 (compatibilidade); NFR-06 (serviço externo); NFR-07 (acessibilidade); NFR-08 (privacidade); NFR-09 (desempenho/frescor); NFR-10 (diagnósticos seguros). |
| **US-03 — Consultar previsão de cinco dias** | AC-03; AC-06.3–6; AC-08 | NFR-03 (integridade da localidade, datas e unidade); NFR-04 (pt-BR); NFR-05 (compatibilidade); NFR-06 (serviço externo); NFR-07 (acessibilidade); NFR-08 (privacidade); NFR-09 (desempenho/timeout); NFR-10 (diagnósticos seguros). |
| **US-04 — Alternar Celsius e Fahrenheit** | AC-04; AC-08 | NFR-01 (responsividade); NFR-02 (operabilidade); NFR-03 (consistência da unidade); NFR-07 (acessibilidade). |
| **US-05 — Usar em dispositivos móveis e desktop** | AC-05; AC-NFR-01; AC-NFR-05 | NFR-01 (responsividade); NFR-02 (teclado, toque e ponteiro); NFR-05 (compatibilidade); NFR-07 (acessibilidade). |
| **US-06 — Entender carregamento, vazio e falhas** | AC-01.5–6; AC-02.3; AC-03.5; AC-06 | NFR-02 (operabilidade); NFR-04 (mensagens pt-BR); NFR-06 (serviço externo); NFR-07 (mensagens acessíveis); NFR-09 (timeout/frescor); NFR-10 (diagnósticos sem dados sensíveis). |
| **US-07 — Manter a preferência entre sessões** | AC-04.3; AC-07 | NFR-03 (consistência da unidade); NFR-07 (controle acessível); NFR-08 (armazenamento local e não envio ao servidor). |
| **US-08 — Interpretar unidades meteorológicas** | AC-02.2; AC-03.2; AC-08 | NFR-03 (consistência); NFR-07 (nomes acessíveis). |

## Acceptance Criteria

- **AC-01 (FR-01):**
  1. Submeter campo vazio ou composto somente por espaços não gera requisição, mantém o foco no campo e apresenta orientação para informar uma cidade.
  2. Termo acima de 100 pontos de código Unicode é rejeitado sem requisição e com mensagem; termo válido submetido por botão ou Enter é enviado sem espaços externos. Interface identifica “Buscando cidades”.
  3. Uma resposta com resultados mostra no máximo 10 localidades retornadas, cada uma com nome e país, além de região/estado quando fornecidos.
  4. A busca não restringe a entrada ao idioma pt-BR; um nome de cidade em qualquer idioma aceito pelo serviço pode ser submetido, mantendo as mensagens da interface em pt-BR.
  5. A seleção de um resultado consulta aquela localidade, mesmo quando outro resultado tem o mesmo nome. Antes da seleção, nenhum dado meteorológico é apresentado como resultado da busca.
  6. Uma busca sem resultados apresenta estado vazio distinto de erro. Uma falha da busca preserva o termo e apresenta uma ação manual de nova tentativa.
  7. Se duas ou mais opções forem indistinguíveis pelos nomes e demais dados de localização exibidos, nenhuma delas pode ser selecionada; a interface informa a ambiguidade e orienta refinar o termo.
  8. Se respostas de buscas submetidas em sequência chegarem fora de ordem, somente resultados da busca mais recente são exibidos.
- **AC-02 (FR-02):**
  1. Após sucesso, a interface identifica a localidade selecionada e exibe os cinco campos de FR-02; condições meteorológicas são apresentadas como descrições compreensíveis em pt-BR, não apenas como código numérico.
  2. Para resposta com campo presente e válido, exibe o valor e a unidade conforme FR-08; para campo ausente ou inválido, exibe “Indisponível” no campo correspondente.
  3. Quando a resposta contém horário de referência válido com até 3 horas de idade, exibe esse horário no fuso local da cidade. Se o horário estiver ausente, inválido ou exceder 3 horas, os valores atuais são identificados como indisponíveis e a interface oferece nova tentativa.
  4. A localidade exibida corresponde ao resultado selecionado, inclusive para resultados homônimos.
- **AC-03 (FR-03):**
  1. Quando a fonte retorna cinco datas válidas para o período, a tela contém somente as datas locais entre hoje e hoje + 4 dias, inclusive: exatamente cinco cartões ou linhas, sem datas duplicadas ou lacunas.
  2. Cada dia contém condição descrita em pt-BR, mínima, máxima e probabilidade de precipitação; valores ausentes ou inválidos são identificados como “Indisponível”.
  3. Para um fuso horário de localidade diferente do dispositivo, “hoje” e todas as datas correspondem ao calendário local da cidade, formatadas em pt-BR.
  4. A previsão exibida pertence à localidade selecionada atualmente; uma resposta atrasada de seleção anterior não atualiza a tela.
  5. Se a resposta não contiver cinco datas válidas e consecutivas, a interface não completa nem duplica dias: informa que a previsão completa está indisponível e oferece nova tentativa.
- **AC-04 (FR-04):**
  1. O controle expõe exatamente as opções Celsius e Fahrenheit e indica qual está selecionada.
  2. Ao selecionar cada opção, todas as temperaturas atuais e da previsão são convertidas antes de serem arredondadas ao inteiro mais próximo, com 0,5 arredondado para longe de zero.
  3. A troca conserva localidade, condições não térmicas e datas e não gera nova requisição de geocoding ou previsão.
- **AC-05 (FR-05):**
  1. Em viewports 375 × 667 px e 1280 × 800 px, um usuário consegue concluir busca, seleção, consulta e troca de unidade.
  2. A 375 px de largura não há rolagem horizontal da página; todo conteúdo pode ser alcançado por rolagem vertical.
  3. Nenhum controle necessário fica encoberto, cortado ou inacessível por sobreposição nesses viewports.
- **AC-06 (FR-06):**
  1. Durante operações pendentes, a interface mostra texto de estado específico à operação, impede a submissão duplicada do mesmo pedido e permite substituir uma busca pendente por um novo termo.
  2. Busca concluída sem resultados apresenta mensagem de estado vazio, sem ação de nova tentativa de erro; falha de busca apresenta mensagem de erro e ação manual de nova tentativa.
  3. Falha de consulta meteorológica apresenta mensagem de erro e ação manual para repetir a consulta da localidade selecionada; nenhuma operação é repetida automaticamente.
  4. Ao iniciar consulta para outra cidade, dados da cidade anterior deixam de ser apresentados como atuais. Se a consulta falhar, a tela identifica a cidade solicitada e informa que os dados não estão disponíveis.
  5. Depois de selecionar cidade A e em seguida cidade B, uma resposta atrasada de A não substitui nem altera os dados ou o estado de B.
  6. Ativar nova tentativa produz exatamente uma nova requisição da operação que falhou.
- **AC-07 (FR-07):**
  1. Sem preferência previamente salva e disponível, a unidade inicial exibida é Celsius.
  2. Selecionar Fahrenheit e recarregar ou abrir uma nova sessão no mesmo navegador restaura Fahrenheit se o armazenamento local estiver disponível.
  3. Valor salvo desconhecido, ilegível ou ausente resulta em Celsius; falha ao gravar não reverte a seleção durante a sessão corrente.
  4. A unidade restaurada afeta todas as temperaturas, inclusive dados carregados após a restauração, e não é enviada a servidor próprio.
  5. Alterar a unidade em uma aba atualiza as demais abas abertas do mesmo navegador quando o armazenamento local está disponível.
- **AC-08 (FR-08):**
  1. Temperaturas usam °C ou °F conforme a seleção; vento usa km/h; umidade e precipitação usam %.
  2. A unidade é associada programaticamente ao respectivo valor e permanece compreensível sem depender de cor, ícone ou posição na tela.

- **AC-NFR-01 (NFR-01):** nos viewports de 375 × 667 px e 1280 × 800 px, as tarefas de buscar, selecionar uma localidade, consultar os dados e alternar a unidade podem ser concluídas; no viewport móvel não há rolagem horizontal da página.
- **AC-NFR-02 (NFR-02):** campo de busca, seletor de unidade, resultados e ações possuem nome acessível que descreve sua finalidade; controles não dependem exclusivamente de placeholder para rótulo e podem ser acionados por teclado, toque e ponteiro.
- **AC-NFR-03 (NFR-03):** com fixtures de temperaturas em Celsius e Fahrenheit, todas as temperaturas renderizadas coincidem com a unidade selecionada; com fixture que cruza a meia-noite entre fuso do usuário e da cidade, as cinco datas exibidas correspondem ao fuso da cidade.
- **AC-NFR-04 (NFR-04):** a interface e mensagens próprias usam pt-BR; datas mostram formatos e nomes de dia/mês em português brasileiro.
- **AC-NFR-05 (NFR-05):** testes funcionais passam nas versões estáveis atual e imediatamente anterior de Chrome desktop/Android, Edge, Firefox desktop e Safari macOS/iOS.
- **AC-NFR-06 (NFR-06):** a aplicação apresenta atribuição visível com link para Open-Meteo; antes da publicação, revisão documentada confirma conformidade com os termos e limites vigentes do provedor.
- **AC-NFR-07 (NFR-07):** todas as tarefas funcionais podem ser realizadas por teclado, com ordem de foco previsível e foco visível; testes automatizados e auditoria manual validam WCAG 2.2 nível AA, incluindo nomes, papéis, estados e anúncios de carregamento, vazio e erro.
- **AC-NFR-08 (NFR-08):** inspeção da rede confirma que termo de busca e coordenadas necessárias vão somente aos endpoints públicos correspondentes da Open-Meteo; nenhuma preferência é enviada a servidor próprio e nenhum histórico de busca é persistido pela aplicação. A interface disponibiliza aviso de privacidade com link para política vigente do provedor.
- **AC-NFR-09 (NFR-09):** em 30 execuções frias com viewport 375 × 667 px, CPU 4×, rede simulada de 1,6 Mbps downstream/750 Kbps upstream e RTT de 150 ms, p75 do Largest Contentful Paint do shell é ≤ 2,5 s; cada requisição externa termina em até 10 s. Dados atuais acima de 3 horas ou sem referência temporal não são apresentados como atuais.
- **AC-NFR-10 (NFR-10):** testes com respostas de erro simuladas confirmam que a interface não expõe payloads brutos ou detalhes internos; revisão dos diagnósticos confirma classificação do erro sem termo de busca ou associação a pessoa.

## Non-Functional Requirements

- **NFR-01 — Responsividade:** suportar viewports de 375 × 667 px e 1280 × 800 px; não exigir rolagem horizontal em 375 px.
- **NFR-02 — Operabilidade:** todas as ações funcionais devem estar disponíveis em controles operáveis por teclado, toque e ponteiro; resultados devem ser selecionáveis individualmente e seus nomes acessíveis devem identificar a localidade.
- **NFR-03 — Integridade de contexto:** todo estado meteorológico exibido deve pertencer à localidade selecionada mais recentemente. Datas devem ser calculadas no fuso retornado para essa localidade; a unidade deve ser consistente em toda a tela.
- **NFR-04 — Localização:** interface, mensagens de erro, vazio e carregamento, rótulos e datas devem usar pt-BR. Não traduzir nem alterar nomes próprios de localidades retornados pela fonte.
- **NFR-05 — Compatibilidade:** suportar versões estáveis atuais e imediatamente anteriores, na data de lançamento, de Chrome (desktop e Android), Edge, Firefox (desktop), Safari (macOS e iOS). Executar os testes de aceite em cada família e versão declarada.
- **NFR-06 — Dependência externa:** busca e previsão dependem de rede e dos serviços públicos da Open-Meteo. Tratar falhas e limites conforme FR-06. Exibir atribuição visível e cumprir os termos e limites vigentes; revisão de conformidade antes da publicação é obrigatória.
- **NFR-07 — Acessibilidade:** conformidade WCAG 2.2 nível AA; controles com nomes e papéis acessíveis, foco visível, ordem de foco previsível e estados anunciados por tecnologia assistiva.
- **NFR-08 — Privacidade:** informar que o termo é enviado ao serviço público de geocoding e pode ser processado conforme a política do provedor; não alegar retenção ou não retenção pelo provedor sem confirmação. A aplicação não armazena em servidor próprio termos, coordenadas ou localidade selecionada. Só a unidade pode ser guardada localmente.
- **NFR-09 — Desempenho e frescor:** em perfil de teste móvel especificado em AC-NFR-09, p75 do Largest Contentful Paint do shell ≤ 2,5 s. Timeout de cada requisição externa é 10 s. Dados atuais devem ter referência temporal válida com idade ≤ 3 horas; sem referência ou acima desse limite, não são apresentados como atuais.
- **NFR-10 — Observabilidade e segurança operacional:** erros externos devem ser reconhecíveis por categoria em diagnósticos sem registrar termos de busca, coordenadas, localidade selecionada ou dados meteorológicos associados a uma pessoa. Mensagens visíveis ao usuário não devem expor resposta bruta, URL interna ou detalhes técnicos.

## Edge Cases

- A busca não encontra nenhuma localidade: informar ausência de resultados sem apresentar uma cidade não selecionada como resultado.
- A busca retorna cidades homônimas: apresentar os campos de região/estado e país disponíveis para permitir a escolha explícita.
- Um resultado não possui região/estado: omitir esse dado sem impedir a identificação pelo nome da cidade e país.
- A pesquisa está em andamento: indicar carregamento para que o usuário saiba que o pedido está sendo processado.
- Termo de busca ultrapassa 100 pontos de código Unicode: rejeitar antes da requisição e informar o limite.
- O usuário submete outra busca enquanto a anterior está pendente: a nova busca substitui a anterior para fins de exibição; respostas fora de ordem da busca antiga são ignoradas.
- A resposta de geocoding é válida, mas vazia: apresentar estado sem resultados, não estado de erro.
- O serviço responde com erro HTTP, limite de requisições ou payload estruturalmente inválido (por exemplo, sem estrutura de datas ou fuso horário da previsão): tratar como erro da operação, informar falha em linguagem simples e permitir repetição manual. Campo meteorológico individual ausente continua sendo tratado como “Indisponível”.
- A requisição excede 10 segundos: encerrar o estado de carregamento, informar falha e permitir nova tentativa manual.
- A busca falha por conexão ou indisponibilidade do serviço: informar a falha, preservar o texto pesquisado e oferecer nova tentativa manual, sem repetição automática.
- A consulta meteorológica falha por conexão ou indisponibilidade do serviço: informar a falha e oferecer nova tentativa manual, sem repetição automática.
- A consulta falha após uma consulta anterior ter sido bem-sucedida: os dados anteriores não são apresentados como resultado da localidade solicitada; a interface informa que a consulta solicitada está indisponível.
- A fonte omite um campo meteorológico: manter o campo identificado e apresentar “Indisponível”, sem substituir por zero nem descartar silenciosamente o campo.
- A preferência de unidade não pode ser lida, está inválida ou não pode ser gravada: iniciar em Celsius quando não houver preferência legível; uma escolha feita na sessão atual continua aplicada nessa sessão.
- Duas abas estão abertas quando a preferência muda: atualizar a preferência nas duas abas se o armazenamento local do navegador estiver disponível.
- A localidade está em outro fuso horário que o dispositivo: determinar hoje e as datas dos quatro dias seguintes pelo fuso da localidade.
- O navegador não possui uma preferência salva: iniciar em Celsius.
- A preferência local não pode ser lida ou foi removida: não presumir uma preferência anterior; iniciar em Celsius, mantendo a possibilidade de alternar unidade.
- O usuário muda a unidade após consultar o clima: atualizar todas as temperaturas visíveis sem alterar os demais dados ou a cidade selecionada.
- O usuário ainda não selecionou uma localidade: não tratar o texto digitado ou um resultado apenas destacado como cidade consultada.
- A resposta não contém horário de referência das condições atuais: apresentar os campos disponíveis sem inventar um horário de atualização.
- Dados atuais têm mais de 3 horas: não exibi-los como condições atuais; indicar indisponibilidade temporal e oferecer nova tentativa manual.
- O serviço retorna datas incompletas, não consecutivas ou menos de cinco dias: não preencher datas ou valores por inferência; indicar que a previsão completa não está disponível e oferecer nova tentativa.
- O serviço retorna valor numérico inválido ou fora do domínio definido pela fonte: tratar esse campo como indisponível e não o exibir como valor válido.
- Uma resposta de consulta anterior chega após uma nova seleção: ignorar a resposta antiga e preservar o estado da localidade selecionada mais recentemente.
- Uma resposta de erro inclui detalhes técnicos: apresentar mensagem genérica ao usuário e não expor conteúdo bruto da resposta.

## Assumptions

- O escopo é um MVP web, sem autenticação, aplicativo nativo ou persistência de dados do usuário em servidor.
- O serviço público Open-Meteo será usado para geocoding e previsão, sem chave de API e sem backend próprio. Antes da publicação, a equipe revisa os termos e limites vigentes, exibe atribuição com link e aviso de privacidade com link para a política do provedor.
- A busca é por nome de cidade e exige seleção explícita; o MVP mostra uma cidade de cada vez.
- A busca envia o texto submetido ao serviço público de geocoding da Open-Meteo; a aplicação não mantém histórico de termos pesquisados em servidor próprio.
- “Cinco dias” significa hoje e os quatro dias seguintes, conforme o fuso horário da localidade selecionada.
- Celsius é a unidade inicial; Fahrenheit também está disponível.
- A preferência de unidade deve persistir localmente entre sessões no mesmo navegador quando o armazenamento estiver disponível.
- As personas e suas métricas descritas na descoberta são contexto de produto, não critérios de lançamento ou compromissos de desempenho.
- O produto deve tratar falhas externas sem exibir dados antigos como atuais.
- Valores meteorológicos ausentes são identificados como “Indisponível”; não são tratados como zero.
- Cada valor de temperatura, velocidade do vento, umidade e probabilidade de precipitação é apresentado com a unidade definida em FR-08.
- O limite de entrada da busca é 100 pontos de código Unicode e cada busca retorna até 10 opções; termos podem estar em qualquer idioma aceito pela fonte.
- Busca e consulta são acionadas somente por submissão/seleção explícita ou nova tentativa; não há atualização meteorológica automática.
- Requisições externas têm timeout de 10 segundos; dados atuais são considerados atuais por até 3 horas a partir do horário de referência.
- Temperaturas, velocidade do vento, umidade e precipitação são arredondadas ao inteiro mais próximo, com 0,5 arredondado para longe de zero.
- Compatibilidade mínima: versões estáveis atual e imediatamente anterior de Chrome desktop/Android, Edge, Firefox desktop e Safari macOS/iOS.
- A meta de acessibilidade do MVP é WCAG 2.2 AA.
- A última cidade selecionada e o termo de busca não são restaurados entre sessões; somente a unidade é persistida localmente.
- A atualização meteorológica é manual: ocorre após selecionar uma cidade ou acionar nova tentativa, sem atualização em segundo plano.

## Risks

- **Indisponibilidade, atraso ou limite de requisições da Open-Meteo:** pode impedir busca ou atualização meteorológica. Mitigação: mensagens sem detalhes técnicos, tentativa manual, preservação do termo, timeout de 10 segundos e rejeição de respostas obsoletas.
- **Ambiguidade entre localidades homônimas:** pode levar o usuário a consultar a cidade errada. Mitigação: apresentar cidade, região/estado quando disponível e país, exigindo seleção explícita.
- **Termos, atribuição, privacidade ou limites da fonte de dados não atendidos:** pode impedir ou restringir o uso planejado. Mitigação: revisão documentada dos termos vigentes, atribuição visível com link e aviso de privacidade com link para a política do provedor antes da publicação.
- **Experiência móvel inadequada:** pode dificultar a leitura da previsão e a interação em contexto de deslocamento. Mitigação: priorizar telas móveis e verificar o acesso às funções principais em telas móveis e desktop.
- **Armazenamento local indisponível ou limpo:** pode impedir a restauração da unidade escolhida. Mitigação: iniciar em Celsius quando a preferência não estiver disponível e continuar permitindo a alternância.
- **Dados parciais da fonte:** campos ausentes podem confundir o usuário ou ser interpretados incorretamente. Mitigação: manter o campo e indicar explicitamente “Indisponível”, sem usar zero como substituto.
- **Necessidades específicas do público:** a especificação não inclui personalização baseada em personas; novas necessidades identificadas após o MVP devem entrar como mudança de escopo.

## Ampliação aprovada — métricas do hero

FR-02 e AC-02 passam a incluir precipitação acumulada no intervalo atual da
fonte, em mm, e pressão atmosférica ao nível do mar, em hPa. Não confundir
precipitação atual com a probabilidade diária em %. FR-08 e AC-08 exigem
unidades visíveis e acessíveis também para essas duas medidas; arredondar
precipitação a uma casa decimal e pressão ao inteiro mais próximo.
Ausência/invalidez continua sendo “Indisponível”, nunca zero.
O hero mantém temperatura, sensação, condição, umidade e vento, além das
novas métricas, com ícone decorativo e temperatura em destaque.

## Out of Scope

- Aplicativo nativo para iOS ou Android.
- Autenticação, contas de usuário ou persistência de preferências em servidor.
- Exibição ou comparação simultânea de várias cidades.
- Busca por localização atual via GPS.
- Persistir/restaurar a cidade selecionada, o termo de busca ou histórico de buscas; favoritos e cidades salvas.
- Autocomplete, sugestões enquanto digita e busca automática sem submissão.
- Atualização automática ou em segundo plano, uso offline, cache/reaproveitamento de dados meteorológicos entre sessões e exibição de dados antigos como fallback.
- Previsão horária, histórico climático, mapas, radar, qualidade do ar, índice UV e alertas de tempo severo.
- Notificações, recomendações, planejamento de atividades ou compartilhamento de consulta.
- Métricas analíticas de usuário, perfis, personalização por localização ou sincronização entre dispositivos.
- Idiomas de interface diferentes de pt-BR.
- Medidas além das especificadas: nascer/pôr do sol, visibilidade e rajadas de vento.

## Open Questions

Não há questões funcionais ou de produto pendentes para desenvolver o MVP definido nesta especificação. A revisão documentada dos termos e limites vigentes da Open-Meteo, a atribuição e o aviso de privacidade são controles de conformidade obrigatórios antes da publicação; não alteram as decisões de produto nem dependem de novas respostas do solicitante.
