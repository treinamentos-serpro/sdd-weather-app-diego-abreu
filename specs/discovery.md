# Discovery: Aplicação de Previsão do Tempo

## Contexto

A empresa solicitou uma aplicação para consulta de informações meteorológicas. O produto deve permitir que usuários encontrem cidades, consultem as condições atuais e vejam a previsão para os próximos cinco dias. A interface também deve oferecer alternância entre Celsius e Fahrenheit e funcionar em dispositivos móveis.

O briefing define as capacidades principais, mas ainda não detalha o público-alvo, as fontes de dados, os critérios de busca ou o nível de precisão e atualização esperado.

## Requisitos Funcionais

- **RF-01 — Buscar cidades:** permitir busca por nome e apresentar resultados com cidade, região/estado quando disponível e país. O usuário deve selecionar um resultado antes da consulta; o MVP exibe uma cidade por vez.
- **RF-02 — Consultar clima atual:** exibir temperatura, sensação térmica, condição do tempo, umidade e velocidade do vento para a cidade selecionada.
- **RF-03 — Consultar previsão:** exibir cinco resumos diários: hoje e os quatro dias seguintes, com condição do tempo, temperaturas mínima e máxima e probabilidade de precipitação. As datas devem seguir o fuso horário da cidade selecionada.
- **RF-04 — Alternar unidade de temperatura:** permitir alternar entre Celsius e Fahrenheit e aplicar a unidade escolhida a todas as temperaturas exibidas.
- **RF-05 — Usar em dispositivos móveis:** disponibilizar as funcionalidades principais em uma interface responsiva, priorizando o uso em dispositivos móveis e também atendendo desktop.
- **RF-06 — Tratar estados da consulta:** exibir estado de carregamento, informar quando a busca não encontrar resultados e apresentar erro com opção para tentar novamente quando a consulta meteorológica falhar. Não apresentar dados antigos como se fossem atuais.
- **RF-07 — Manter preferência de unidade:** manter a unidade escolhida no navegador entre sessões, sem persistir essa preferência em servidor.

## Requisitos Não-Funcionais

- **RNF-01 — Responsividade:** a interface deve se adaptar a telas móveis e oferecer acesso às funcionalidades principais nesses dispositivos.
- **RNF-02 — Usabilidade:** busca, consulta da previsão e alternância de unidade devem ser compreensíveis e acessíveis ao usuário.
- **RNF-03 — Consistência:** clima atual e previsão devem usar a unidade de temperatura selecionada.
- **RNF-04 — Idioma:** textos e formatos de data devem ser apresentados em português do Brasil (pt-BR).
- **RNF-05 — Compatibilidade:** a interface deve funcionar nas versões atuais dos principais navegadores para dispositivos móveis e desktop; a matriz exata de versões deve ser definida antes da entrega.
- **RNF-06 — Dependência de dados externos:** o sistema depende dos serviços públicos da Open-Meteo. Termos de uso, limites de requisição e atribuição exigida devem ser verificados antes da entrega.
- **RNF-07 — Acessibilidade:** busca e consulta devem ser operáveis por teclado e utilizar rótulos semânticos. O nível formal de conformidade ainda precisa ser definido.

## Riscos

- **Indisponibilidade, atraso ou limite de requisições:** os serviços públicos da Open-Meteo podem falhar ou limitar consultas; o fluxo depende de acesso à rede e deve comunicar falhas sem apresentar dados antigos como atuais.
- **Localidades ambíguas:** cidades com nomes iguais ainda podem exigir comparação dos campos de região/estado e país apresentados nos resultados.
- **Condições de uso da fonte:** a ausência de API key não elimina possíveis limites, condições de uso ou obrigações de atribuição da Open-Meteo.
- **Uso móvel comprometido:** uma interface que não priorize telas pequenas pode dificultar a busca e a leitura da previsão.
- **Persistência local indisponível:** configurações do navegador podem impedir ou limpar o armazenamento local, fazendo a preferência de unidade voltar ao padrão.

## Perguntas em Aberto

- Qual deve ser a frequência de atualização dos dados e que nível de defasagem é aceitável?
- Quais são os limites de uso, termos e requisitos de atribuição aplicáveis ao uso da Open-Meteo neste produto?
- Qual nível formal de acessibilidade deve ser atendido (por exemplo, conformidade WCAG)?
- Quais versões exatas de navegadores e dispositivos devem ser suportadas?
- A busca deve aceitar nomes de cidades em outros idiomas ou apenas entradas em pt-BR?
- Qual é o público prioritário e as métricas das personas (incluindo a meta hipotética de consulta em 30 segundos) devem ser validadas com usuários?

## Suposições

- A busca é feita pelo nome da cidade; o usuário seleciona um resultado identificado por cidade, região/estado quando disponível e país.
- A previsão inclui hoje e os quatro dias seguintes, conforme o fuso horário da cidade selecionada.
- Celsius é a unidade inicial, e a preferência escolhida é mantida localmente no navegador entre sessões, quando o armazenamento estiver disponível.
- A alternância de unidade afeta as temperaturas do clima atual e da previsão.
- Não há autenticação, aplicativo nativo ou persistência de dados de usuário em servidor no escopo do MVP.
- “Usar em dispositivos móveis” significa uma interface responsiva com prioridade para telas móveis; também há suporte a desktop.
- A busca por localização atual via GPS não faz parte do escopo definido para o MVP.

## Personas

As personas abaixo são hipóteses baseadas no briefing e devem ser validadas com usuários reais.

| Persona | Objetivo principal | Contexto de uso | Métrica de sucesso pessoal |
|---|---|---|---|
| **Quem se desloca diariamente** | Saber se o clima exige levar guarda-chuva, trocar de roupa ou ajustar o trajeto. | Principalmente mobile, antes de sair ou durante o deslocamento. | Consulta a condição atual em menos de 30 segundos e consegue decidir como se preparar. |
| **Quem planeja atividades** | Comparar a previsão dos próximos dias para escolher quando realizar uma atividade ao ar livre. | Desktop para planejar; mobile para conferir atualizações. | Encontra um dia adequado entre os próximos cinco sem precisar consultar outra fonte. |
| **Quem trabalha ou passa o dia ao ar livre** | Acompanhar as condições e a temperatura para se preparar durante a rotina. | Principalmente mobile, em consultas rápidas ao longo do dia. | Verifica a temperatura na unidade preferida e entende as condições sem interromper por muito tempo a atividade. |

As métricas são sinais de sucesso do ponto de vista de cada pessoa, não metas do produto. Os limites de tempo e as necessidades específicas devem ser validados na etapa de pesquisa.

## Decisões

| Decisão | Justificativa | Perguntas em aberto que resolve |
|---|---|---|
| **Fonte de dados: Open-Meteo, sem API key** | Permite consultar dados meteorológicos sem exigir uma chave de API para o uso previsto. | Define a fonte de dados e remove a necessidade de configurar ou fornecer uma API key. |
| **“5 dias” significa hoje + 4 dias** | Torna explícito que a previsão inclui o dia da consulta e os quatro dias seguintes. | Define o período coberto pela previsão de cinco dias. |
| **Unidade padrão: Celsius** | Estabelece um padrão inicial coerente com a experiência em pt-BR. | Define a unidade usada antes de o usuário alternar para Fahrenheit. |
| **Sem autenticação e sem persistência de servidor** | Mantém o acesso direto e evita contas e armazenamento de dados de usuário no servidor. | Define que não haverá login nem dados de usuário persistidos no servidor. |
| **Idioma da interface: pt-BR** | Alinha textos e experiência ao público de língua portuguesa do Brasil. | Define o idioma da interface. |
| **Dados meteorológicos e busca via navegador** | O cliente consulta diretamente os serviços públicos de geocoding e previsão da Open-Meteo, sem backend próprio no MVP. | Define o caminho de consulta dos dados; termos, limites e atribuição continuam sujeitos a verificação antes da entrega. |
| **Dados exibidos e granularidade da previsão** | O clima atual inclui temperatura, sensação térmica, condição, umidade e vento; a previsão apresenta condição, mínimas, máximas e probabilidade de precipitação em resumos diários. | Define os campos mínimos e exclui previsão horária do MVP. |
| **Fuso horário da localidade** | Datas e definição de “hoje” seguem o fuso horário retornado para a cidade selecionada. | Resolve a ambiguidade de data entre o fuso do usuário e o da cidade consultada. |
| **Busca e seleção de localidade** | A busca é por nome; resultados mostram cidade, região/estado quando disponível e país, com seleção explícita de uma cidade por vez. | Define como o usuário identifica e escolhe uma localidade; busca por GPS não está no escopo do MVP. |
| **Preferência de unidade no navegador** | A unidade selecionada é salva localmente no navegador, sem armazenamento em servidor. | Define a duração da preferência sem introduzir autenticação ou persistência de servidor. |
| **Estados de consulta e falha** | A interface mostra carregamento, ausência de resultados e erro com opção de nova tentativa; não apresenta dados antigos como atuais. | Define o comportamento básico para busca sem resultados e falha da fonte externa. |
| **Interface responsiva com prioridade mobile** | As funções principais devem ser utilizáveis em telas móveis, com suporte também a desktop. | Torna o requisito de uso móvel mais concreto sem exigir aplicativo nativo. |