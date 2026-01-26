Fluxo Interativo de Agendamento (Passo a Passo)

Nesta seção descrevemos detalhadamente o fluxo de mensagens interativas no WhatsApp, incluindo a lógica implementada em cada etapa, o tratamento de linguagem natural para datas, integração com Google Calendar e armazenamento de dados. Vamos assumir que a integração básica da Z-API já está configurada no projeto (ou seja, já conseguimos receber webhooks e enviar mensagens usando os endpoints listados).

1. Mensagem inicial e seleção do serviço

Disparo inicial: Quando o cliente envia uma mensagem inicial (qualquer saudação ou palavra-chave definidora do contexto, por exemplo "Oi, gostaria de agendar um horário"), o sistema reconhece que se trata de um novo atendimento de agendamento. Podemos ter uma checagem: se a pessoa já tiver um agendamento futuro (status ativo), podemos, em vez disso, já oferecer gerenciar agendamento (ver passo 6). Mas assumindo que é um novo agendamento, o sistema responde com uma mensagem de boas-vindas e instruções.

Enviar lista de serviços: Após a mensagem introdutória (ex.: "Olá, sou o assistente de agendamentos. Por favor, escolha um serviço:"), enviamos uma lista interativa com as opções de serviço disponíveis. Usamos o endpoint /send-option-list para isso, montando o JSON conforme o exemplo já mostrado. Teremos algo como:

Título da lista: "Serviços disponíveis".

Texto do botão: "Selecionar serviço".

Opções:

Corte e Barba – descrição opcional (ex: "Serviço completo de corte de cabelo e barba").

Apenas Corte – descrição "Corte de cabelo masculino".

Apenas Barba – descrição "Aparar/Barbear".
(Podemos incluir preços ou duração na descrição para ajudar o cliente a decidir, se pertinente, desde que sejam textos curtos).

Cada opção terá um id único (digamos "serv1", "serv2", "serv3" ou simplesmente "1","2","3"). Esses IDs serão usados para identificar a escolha no webhook. Importante: Os IDs podem ser, por exemplo, os próprios IDs da tabela Serviços para facilitar o mapeamento direto.

Recebimento da seleção: Quando o cliente toca em uma das opções da lista, o WhatsApp envia uma mensagem de resposta do tipo list reply. A Z-API nos entregará via webhook um JSON contendo listResponseMessage com os campos:

"title" – título da opção escolhida (por exemplo "Corte e Barba").

"selectedRowId" – o ID da opção selecionada (por exemplo "1").

(Há também um campo "message" que pode repetir a descrição da opção, mas o essencial é o ID).

Processamento: Nosso back-end, ao receber esse webhook, identifica qual serviço foi escolhido pelo selectedRowId. Então:

Armazena essa escolha no contexto (por ex., numa variável de sessão do usuário ou banco de dados temporário), associando o telefone do cliente a servico_id selecionado.

Passa para a próxima etapa, que é perguntar pelo profissional.

2. Seleção do profissional

Carregar profissionais relevantes: Dependendo do serviço escolhido, podemos listar todos os profissionais que realizam aquele serviço. Se todos fizerem todos, simplesmente listamos todos. Se houver especialização, filtraríamos aqui (ex: se o serviço fosse "Manicure", listar apenas profissionais manicures).

Enviar lista de profissionais: Usamos novamente uma mensagem interativa de lista via /send-option-list, similar ao passo anterior. Por exemplo:

Mensagem: "Selecione o profissional desejado:".

Título: "Profissionais".

Botão: "Ver lista".

Opções: Uma para cada profissional, e se forem muitos (digamos >10), poderíamos paginar ou dividir por seção (embora a API da Z-API não suporte seções diretamente, poderíamos improvise enviando várias listas se necessário). No nosso cenário, imagina que são 3 barbeiros: opções "Carlos", "Miguel", "Roberto", cada uma com id "prof1", "prof2", etc., e talvez uma descrição como "Especialista em cortes clássicos" apenas ilustrativo.

Recebimento da seleção: O webhook nos entregará listResponseMessage com "title" = nome do profissional e selectedRowId = ID do profissional escolhido. Novamente, mapeamos esse ID a um profissional_id.

Processamento: Registramos o profissional selecionado no contexto do usuário (agora temos serviço e profissional escolhidos). Em seguida, avançamos para coletar a data desejada do agendamento.

3. Entrada da data desejada (interpretação de linguagem natural)

Perguntar a data: Agora que sabemos o serviço e com quem, precisamos saber quando. Podemos formular uma pergunta aberta ao cliente: ex: "Qual dia você gostaria? Você pode responder com a data ou usar termos como 'hoje', 'amanhã'." Essa mensagem pode ser enviada como texto simples (via /send-text) porque aqui esperamos que o usuário digite algo, não escolha dentre opções predefinidas.

Exemplo de prompt: "Por favor, informe o dia desejado para o agendamento (ex.: hoje, amanhã, ou uma data como 25/01)."

Receber resposta do usuário: O cliente pode responder de várias formas:

"hoje"

"amanhã"

"dia 25" ou "25 de janeiro"

"25/01" ou "25/01/2026"

"próxima segunda-feira" (é possível, embora não citado explicitamente, usuários podem usar dias da semana)

etc.
Nosso sistema precisa interpretar essa resposta em uma data calendário (dia, mês, ano):

Implementação da interpretação: Podemos usar uma biblioteca de processamento de linguagem natural para datas em português (por exemplo, Chrono para Node.js, ou a biblioteca Python dateparser, dependendo da linguagem do backend). Alternativamente, implementar manualmente alguns reconhecedores simples:

Converter para lowercase, remover acentos.

Se contiver "hoje": data = data atual.

Se contiver "amanh": data = data atual + 1 dia.

Se contiver "depois de amanhã": data atual + 2 dias.

Se mencionar "segunda", "terça", etc.: podemos interpretar como próxima ocorrência desse dia da semana (isso requer cuidado – se hoje já é segunda e já passou o horário, assume a próxima semana).

Se houver números, interpretar como data explícita:

Formatos possíveis: "25/01", "25-01", "25 01", "25 jan", "25 de janeiro".

Podemos usar regex para DD/?? ou DD?? etc. e inferir mês.

Se o usuário não menciona o ano, assumimos o ano corrente (2026, no exemplo). Se a data calculada já passou no calendário, e é para um futuro próximo, talvez assumimos ano seguinte (mas provavelmente o usuário marcará datas próximas).

Validação: Após obter uma data candidata, verificamos:

Se a data é válida no calendário (evitar 31/02 por erro de digitação, etc.).

Se a data não ficou no passado (se o usuário disse "ontem" ou algo inválido, devemos tratar – talvez respondendo "Data inválida, tente novamente" e não prosseguir até ter uma data futura válida).

Se a data cai em um dia de semana que o estabelecimento/profissional atende. Aqui entra a consideração de dias não úteis: ex: se for domingo e a barbearia fecha, podemos já informar que não há disponibilidade e pedir outra data. Podemos cruzar com um calendário de disponibilidade geral (talvez configurado em cada profissional, se for o caso). Para simplificar, assumiremos que todos os dias são possíveis ou que o calendário do profissional já terá bloqueado (marcado ocupado ou horário de trabalho) para fora do horário – então se cair num domingo sem eventos ocupados mas teoricamente fora do expediente, trataremos ao buscar horários (próximo passo).

Exemplo: Suponha hoje é 22/01/2026 (quinta-feira, no cenário dado). Se o cliente respondeu "amanhã", interpretamos como 23/01/2026. Se respondeu "25/01", interpretamos como 25/01/2026. Se respondeu "próxima segunda", e hoje é quinta 22, próxima segunda seria dia 26/01/2026.

Confirmação opcional: Em alguns bots, após entender a data, é bom confirmar com o usuário – "Entendi que você deseja para dia 25/01/2026 (terça-feira). Correto?". Isso evita erros de interpretação. Podemos implementar essa confirmação especialmente para entradas ambíguas. Contudo, para não alongar demais o fluxo, poderíamos optar por não confirmar explicitamente e já passar para horários disponíveis, supondo que se interpretarmos errado o usuário poderá dizer que não ou ajustar depois. Neste plano, seguiremos sem confirmação explícita, indo direto aos horários livres.

Após obter a data final (vamos chamá-la data_desejada), prosseguimos para consultar os horários.

4. Consulta de horários disponíveis (integração com Google Calendar)

Agora temos: serviço X (com duração Y minutos), profissional P, data D. Precisamos listar ao cliente os horários possíveis nesse dia para aquele profissional.

Obter horários ocupados no Google Calendar: Usamos o endpoint freeBusy do Google Calendar para o calendário do profissional P, no intervalo [D 00:00, D 23:59] (ou [D + horário de abertura, D + horário de fechamento] se quisermos delimitar jornada de trabalho). Por exemplo, se o salão funciona de 09:00 às 19:00, podemos definir:

timeMin = D 09:00

timeMax = D 19:00 (ou D 23:59 se preferir pegar tudo e filtrar depois).
Enviamos a requisição contendo o ID do calendário do profissional. A resposta virá com um objeto calendars indicando, para o calendário consultado, uma lista de intervalos busy (cada intervalo com start e end no formato datetime) em que já existem eventos.

Obs: Alternativamente, poderíamos usar events.list para pegar todos eventos daquele dia. O resultado seria similar – uma lista de eventos com seus horários. Optamos pelo freeBusy por ser direto.

Calcular intervalos livres: Com os intervalos ocupados em mãos, calculamos os slots livres durante o expediente:

Conhecer a duração do serviço: da tabela Serviços temos, por exemplo, 60 minutos para "Corte e Barba". Assim, precisamos encontrar janelas de 60 minutos livres.

Definir granularidade dos slots: Podemos oferecer horários redondos (por exemplo, de meia em meia hora). Isso é amigável para o usuário e suficiente para serviços de 30 ou 60 min. Como 60 min é nosso maior, podemos usar grade de 30 min ou 15 min para todos. Digamos que usaremos intervalos começando a cada 30 minutos (09:00, 09:30, 10:00, ...).

Disponibilidade base: Se o profissional tem horário de trabalho definido (ex: 09:00-18:00), assumimos que fora desse horário não atenderá, independentemente de estar livre no calendário. Podemos modelar isso no sistema ou simplesmente considerar que se ele não trabalha fora desse horário, provavelmente o calendário dele já estará bloqueado (podemos instruir os profissionais a marcarem ausências no calendário). Por prudência, aplicamos limites de 9h à 18h (ajustável).

Construir slots livres: Começamos no horário de abertura (ex: 09:00) e vamos avançando em incrementos (ex: 30min) até o horário de fechamento (ex: 18:00), verificando para cada horário de início potencial se aquele bloco de duração Y fica totalmente livre:

Um slot está livre se nenhum evento ocupado intercepta qualquer parte do intervalo [início, início+Y]. Em prática, podemos pegar a lista de busy e para cada slot candidato checar se início < end_busy e (início+Y) > start_busy de algum evento (condição de overlap). Se não houver overlap com nenhum busy, o slot é válido.

Alternativamente, poderíamos pegar o complemento do conjunto de busy dentro do horário de trabalho:

Por exemplo, se ocupado das 10:00 às 11:00 e das 15:00 às 15:30, então livre de 09:00-10:00, 11:00-15:00, 15:30-18:00. Depois dividir esses intervalos livres maiores em blocos do tamanho do serviço.

Exemplo de cálculo: Suponha dia 25/01 das 9h-18h e o Google Calendar retornou busy: [11:00-11:30], [13:00-13:30], [16:00-17:00]. Para um serviço de 30 min:

Intervalos livres: 9:00-11:00, 11:30-13:00, 13:30-16:00, 17:00-18:00.

Slots de 30 min dentro disso:

9:00, 9:30, 10:00, 10:30 (até 10:30-11:00 cabe, 11:00 ocupado inicia)

11:30, 12:00, 12:30 (13:00 ocupado)

13:30, 14:00, 14:30, 15:00, 15:30 (até 15:30-16:00 cabe, 16:00 ocupado)

17:00, 17:30.

Esses seriam os horários que oferecemos.

Caso nenhum horário livre: Se, por algum motivo, todos horários do dia estão ocupados (ou fora do horário), devemos informar o cliente e talvez oferecer escolher outra data. Por simplicidade, poderíamos enviar: "Infelizmente não há horários disponíveis nesse dia. Você gostaria de escolher outra data?" e retornar ao passo 3. (Mas vamos supor que geralmente haverá alguma opção).

Envio da lista de horários: Precisamos enviar os horários disponíveis encontrados de forma que o cliente escolha um. Existem duas abordagens dependendo do número de opções:

Se houver até 3 horários livres principais que queremos destacar (por exemplo, apenas 3 opções), podemos enviá-los como botões do tipo quick reply usando /send-button-actions – cada botão com o texto do horário (ex: "15:00"). Essa forma é bem prática (aparecem botões clicáveis).

Se houver mais de 3 opções (cenário provável para um dia inteiro livre), optamos por usar novamente a mensagem de lista interativa (/send-option-list). A lista suporta até 10 itens, o que deve cobrir grande parte dos casos para horários em um dia. Por exemplo, podemos listar 8 horários disponíveis em ordem crescente. Caso sejam mais que 10, poderíamos listar os 10 primeiros e talvez incluir uma opção "Ver mais horários" que o bot poderia então enviar os próximos (mas isso raramente será necessário se restringirmos a horário comercial).

Formato: a mensagem poderia ser "Horários disponíveis em 25/01:" e então a lista de opções cada uma com, por ex, título "15:00" e descrição "Disponível" (ou simplesmente o horário no título e nada na descrição). Usamos o id de cada opção para representar aquele horário, por exemplo, usar o próprio texto do horário como id ("15:00" ou "1500") ou um código enumerado.

Recebimento da escolha de horário: Novamente via webhook, receberemos ou um buttonsResponseMessage (se usamos botões) ou um listResponseMessage (se lista). Em ambos casos teremos o conteúdo selecionado:

Botão: buttonsResponseMessage.buttonId e .message com "15:00" por exemplo.

Lista: listResponseMessage.selectedRowId = id do horário, e possivelmente title = "15:00".

Processamento: Convertimos o horário escolhido para um timestamp completo combinando com a data escolhida. Ex: data_desejada = 2026-01-25 e hora_escolhida = 15:00 -> startDateTime = "2026-01-25T15:00:00". Então determinamos endDateTime = start + duração (ex: 16:00 se 1h). Antes de confirmar, podemos opcionalmente fazer uma última verificação de conflito não esperado (pouco provável, dado que derivamos dos livres, mas se múltiplas solicitações concorrem ou se o slot ficou indisponível no meio tempo, pode acontecer). Idealmente, ao reservar, fazemos um "check and book" transacional: chamamos a criação do evento no Google Calendar – se por algum acaso falhar por conflito, retornaremos erro ao usuário.

5. Confirmação e agendamento do compromisso

Nesta etapa final do fluxo principal, iremos registrar o agendamento no sistema e confirmar ao cliente:

Criar evento no Google Calendar: Usando os dados coletados (profissional -> calendar_id, startDateTime e endDateTime calculados, serviço escolhido):

Montamos o objeto do evento: por exemplo, summary = "Corte e Barba - Cliente João", start = 2026-01-25T15:00 (America/Sao_Paulo), end = 2026-01-25T16:00 (America/Sao_Paulo). Podemos incluir description com detalhes (ex: telefone do cliente, ou "Agendado via WhatsApp OmniMessenger").

Fazemos a chamada events.insert() para o calendar do profissional. Se a autenticação e permissão estiverem corretas, receberemos uma resposta com os dados do evento criado, incluindo o id do evento no Google Calendar.

Armazenar o ID do evento: Esse eventId retornado será guardado no campo google_event_id do nosso agendamento, para permitir alterações futuras. (Exemplo de eventId: "abcd1234efgh").

Notificações adicionais (opcional): Podemos configurar para enviar email de convite ao cliente adicionando-o como attendee do evento e usando sendUpdates: all, mas isso somente se o cliente tiver um email conhecido e desejar receber convite do Google. Não foi requisitado, então podemos não incluir convidados para manter simples.

Salvar agendamento no banco: Criamos um registro na tabela Agendamentos:

user_id = (buscar pelo telefone do cliente; se não existe, cadastrá-lo antes com nome genérico ou perguntar nome, mas no mínimo armazenamos o telefone),

profissional_id = id do profissional selecionado,

servico_id = id do serviço escolhido,

data_hora_inicio = timestamp escolhido,

data_hora_fim = data_hora_inicio + duração,

status = "scheduled/confirmado",

google_event_id = (o ID retornado do evento).

Registro de timestamps de criação.
Isso formaliza no nosso banco o compromisso.

Enviar confirmação ao cliente: Utilizando /send-text, enviamos uma mensagem final de confirmação. Por exemplo:

"✅ Agendamento confirmado!
Serviço: Corte e Barba
Profissional: Carlos
Data: 25/01/2026 (terça-feira)
Horário: 15:00

Você receberá um lembrete no dia do atendimento. Qualquer dúvida, estou à disposição.
Obs: Se quiser cancelar ou remarcar, é só me mandar uma mensagem aqui 📅."

Formatar a mensagem de forma clara, usando negritos ou quebras de linha para destacar detalhes (o WhatsApp suporta algumas formatações simples). Podemos incluir um emoji de confirmação (✅) e mencionar as palavras cancelar e remarcar para já indicar ao usuário que ele pode fazer isso – e no próximo contato o bot detectará essas intenções (ver próxima seção).

Após enviar essa confirmação, o fluxo de agendamento é encerrado com sucesso. No front-end (WhatsApp) do cliente, ele agora tem o registro da conversa e o compromisso marcado.

Registro de lembrete (futuro): Poderíamos agendar internamente um envio de lembrete próximo do horário (por exemplo, 1 dia antes ou 1 hora antes). Isso não foi requisitado explicitamente, mas é comum. Em produção, implementaríamos isso possivelmente via um serviço scheduler (cron/CloudWatch Event + Lambda para varrer agendamentos do dia e enviar mensagem de lembrete via Z-API).

6. Cancelamento ou Remarcação de Agendamento

Uma funcionalidade importante do cenário é permitir ao cliente, após marcar, gerenciar seu agendamento antes da data agendada. O comportamento desejado é: se o cliente enviar uma nova mensagem antes da data do compromisso, o sistema deve identificar que ele já tem um agendamento futuro e oferecer opções de cancelar ou remarcar ao invés de iniciar um novo agendamento do zero.

Detecção de agendamento ativo: Cada vez que recebemos uma mensagem de um usuário, devemos verificar no banco se aquele usuário (pelo telefone) possui um agendamento futuro com status confirmado. Por exemplo, uma query SELECT * FROM agendamentos WHERE user_id=X AND status='scheduled' AND data_hora_inicio > now(). Se existir (e possivelmente pegar o mais próximo ou relevante se houver vários – assumiremos um por vez para não complicar):

Suponha o usuário João tem um agendamento dia 25/01 às 15:00. Hoje é 22/01, então está futuro.

Ele envia "Olá, gostaria de mudar meu horário".

Nosso bot, ao receber a mensagem, encontra o agendamento ativo e portanto não inicia o fluxo de “novo agendamento”, mas sim entra no fluxo de gestão.

Oferecer opções de gerenciamento: Podemos responder imediatamente com algo do tipo:

"Você já tem um horário marcado para 25/01 às 15:00 com Carlos (Corte e Barba). Deseja remarcar ou cancelar este agendamento?"

Junto com essa mensagem, enviamos dois botões de resposta rápida: Remarcar e Cancelar, usando /send-button-actions com tipo REPLY. Cada botão terá um id, por exemplo "reschedule" e "cancel", e um label "Remarcar" e "Cancelar".

Receber escolha: Via webhook, virá buttonsResponseMessage.buttonId. Se for "cancel", ou se o próprio texto vier ("Cancelar"), identificamos.

Caso CANCELAR:

Confirmamos o cancelamento: removemos o compromisso do Google Calendar:

Chamada DELETE /events/{eventId} no calendário do profissional (eventId armazenado). Isso remove do Google Calendar (citação de doc do WhatsApp official vs API – skip; utilizaremos a referência de delete da API Google: a chamada é direta e retorna HTTP 204 se sucesso).

Atualizamos nosso banco: status = 'canceled' para aquele agendamento (e talvez registrar cancelado_em = now()).

Enviamos uma mensagem de confirmação de cancelamento ao usuário (via /send-text): "Seu agendamento para Corte e Barba em 25/01 às 15:00 foi cancelado. Esperamos atendê-lo em outra ocasião. Se precisar, fale conosco para agendar um novo horário."

Opcionalmente, podemos notificar o profissional via WhatsApp também que o horário foi cancelado (se isso fizer parte do projeto, poderia enviar uma mensagem pela Z-API para o número do profissional ou email).

Depois disso, a sessão do usuário fica livre; se ele digitar "quero agendar" de novo, começa fluxo novo.

Caso REMARCAR:

Se o usuário escolhe "Remarcar", vamos conduzi-lo por um fluxo semelhante ao de novo agendamento, porém com algumas diferenças:

Perguntar nova data: "Claro! Para qual dia você gostaria de remarcar?" – podemos já saber qual serviço e profissional se mantém os mesmos ou oferecer mudar?

Provavelmente o cliente quer apenas mudar o dia/hora, mantendo o mesmo serviço e profissional. O cenário não menciona a possibilidade de trocar de profissional ou serviço na remarcação, então assumiremos que permanece. (Se ele quisesse outro serviço, seria quase um cancelar + novo; poderíamos em teoria permitir, mas para simplicidade, remarcação = mesma configuração, só data/hora diferentes).

Assim, não perguntamos novamente o serviço nem o profissional – reusamos esses do agendamento existente.

Seguimos então para coleta de data (passo 3 novamente) e seleção de horário (passo 4) para a mesma duração de serviço e mesmo profissional.

Atualizar evento existente: Uma vez o cliente escolher o novo horário, podemos atualizar o evento do Google Calendar em vez de criar outro:

Chamar PATCH /events/{eventId} do agendamento original, alterando start e end para a nova data/hora. A API do Calendar nos permite editar eventos existentes dado o ID.

Alternativamente, se quisermos pela simplicidade de implementação, poderíamos deletar o evento antigo e criar um novo evento (especialmente se mudar de dia, não há grande diferença, exceto que o eventId muda). Mas atualizando mantemos o mesmo eventId.

Atualizamos nosso banco de dados: alterar data_hora_inicio, data_hora_fim para o novo valor, e talvez atualizar um campo updated_at.

Mantemos status "scheduled" (não muda).

Confirmação: Enviamos uma mensagem do tipo "Pronto, seu agendamento foi remarcado: agora será em 27/01 (quinta-feira) às 17:00 com Carlos. Qualquer problema, avise.👍*" (por exemplo).

O profissional verá o evento movido no seu Google Calendar (se for update) ou um novo evento e o antigo removido (se re-criamos).

Em caso de remarcação, podemos também registrar essa atividade (ex: contagem de remarcações, etc., se for relevante).

Fluxo se o cliente enviar mensagem genérica: É possível que o cliente não clique nos botões mas escreva algo como "Quero cancelar meu horário" ou "dá para remarcar para amanhã?". Nosso bot deve compreender isso também:

Podemos incluir NLP ou palavras-chave: se a mensagem recebida contém "cancelar" e temos agendamento ativo -> tratar como cancelamento direto (pedir confirmação talvez "Confirmar cancelamento?"), ou simplesmente cancelar se for afirmativo claro.

Se contém "remarcar" ou "mudar horário" -> entrar no fluxo de remarcação.

Isso adiciona complexidade (processamento de linguagem), mas é um plus. Como temos os botões, provavelmente o usuário usará eles. Ainda assim, podemos implementar um fallback simples:

ex: if "cancel" in msg_text_lower: ... etc.

Para fins deste plano, nos concentraremos no caminho principal via botões, mas projetando a solução para também lidar com entrada de texto equivalente.

Usuário sem agendamento x Usuário com agendamento: Precisamos garantir que esses fluxos não se confundam. Podemos gerenciar via estado:

Se usuário tem agendamento ativo e não está no meio de um novo agendamento, então qualquer mensagem dele aciona o menu de cancelar/remarcar.

Se usuário está no meio do fluxo de agendar (ex: ele iniciou um novo agendamento apesar de já ter um ativo, ou estamos justamente fazendo remarcação), devemos tratá-lo conforme o contexto corrente.

Uma possibilidade: ao detectar um agendamento ativo, em vez de impedir novo agendamento, podemos perguntar "Você já tem um agendamento em X, tem certeza que quer marcar outro?" Mas pelo escopo dado, parece que a ideia é focar em um por vez por cliente.