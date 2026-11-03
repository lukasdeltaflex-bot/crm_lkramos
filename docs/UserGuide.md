# 📘 Guia do Usuário - CRM LK RAMOS

Este guia é gerado automaticamente com base nas configurações atuais do sistema.
**Última Atualização:** 20/04/2026, 12:48:00

---

## 🚀 Fluxo de Propostas

O sistema utiliza os seguintes status para gerenciar o ciclo de vida das propostas:

- **Em Andamento**
- **Aguardando Saldo**
- **Pago**
- **Saldo Pago**
- **Pendente**
- **Reprovado**

---

## 🛠️ Produtos e Órgãos

### Produtos Homologados
- Margem
- Margem CLT
- Saque Complementar
- Cartão - Plástico
- Cartão com saque
- Portabilidade
- Refin Port
- Refin
- Saque FGTS

### Órgãos Aprovadores
- INSS
- SPPREV
- Federal
- SIAPE
- USP
- GOVERNO
- CLT
- Outro

---

## 📋 Checklist Operacional

Cada proposta passa pelas seguintes etapas de conferência:

- **Formalização**: Responsável por garantir a integridade da fase de formalização.
- **Documentação**: Responsável por garantir a integridade da fase de documentação.
- **Checklist Promotora**: Responsável por garantir a integridade da fase de checklist promotora.
- **Averbação**: Responsável por garantir a integridade da fase de averbação.

---

## 🏷️ Gestão de Clientes (Tags)

Classificamos nossos clientes utilizando as seguintes etiquetas:

- 💎 VIP
- ✅ Margem Livre
- ⚠️ Restrição
- 📞 Receptivo
- 🚀 Prospecção
- 👴 Aposentado
- 🏦 Servidor
- 💼 CLT

---

## ⚠️ Motivos de Cancelamento/Indeferimento

Principais motivos registrados no sistema para controle de qualidade:

- Retenção do cliente
- Contrato já liquidado
- Contrato não encontrado
- Saldo devedor divergente
- Erro de averbação
- Desistência do cliente
- Margem excedida
- Vínculo empregatício incompatível

---

## 🏦 Bancos e Parceiros

Atualmente operamos com as seguintes instituições:

- Banco do Brasil S.A.
- Caixa Econômica Federal
- Bradesco S.A.
- Itaú Unibanco S.A.
- Santander (Brasil) S.A.
- Nu Pagamentos S.A. - Nubank
- Inter S.A.
- C6 S.A.
- Original S.A.
- BTG Pactual S.A.
- Safra S.A.
- Votorantim S.A.
- Citibank N.A.
- PAN S.A.
- Neon S.A.
*... e mais 20 instituições.*

---

## 💻 Interface e Layout

### Painel de Cadastro de Cliente
- Modal de Cadastro ampliado (`max-w-5xl`) para proporcionar maior flexibilidade horizontal e conforto visual.
- Os blocos de Benefícios (Órgão / Espécie) possuem layout fluído, facilitando o manuseio de nomenclaturas longas (ex: opções extensas do INSS).

---

## 📡 Inteligências, Radar de Vendas e Sino de Notificações

- **Retenção / Refinanciamento**: Clientes com contratos ativos e liquidados há **mais de 1 ano (12 meses)** entrarão automaticamente no Radar de Vendas alertando oportunidade de retenção.
- **Saque Complementar**: O sistema mapeia sua carteira em busca de propostas deste tipo. Exatos **30 dias após a data de pagamento do saque**, o cliente surge no Radar de Vendas e aciona um aviso visual no Sino de Notificações, guiando os agentes a realizarem novas abordagens de relacionamento. Para não inflar o radar desnecessariamente a régua sempre utiliza o último saque daquele CPF.

### Gestão Configurável de Motivos (Dispensa)
Os motivos utilizados para dispensar clientes no Radar agora são totalmente **configuráveis**. 
Você pode acessá-regras através do menu **Configurações > Parâmetros > Motivos de Dispensa (Radar e Sino)**.
- **Criar, Editar ou Excluir:** Gerencie a lista de motivos operacionais diretamente pelo menu.
- **Sincronização Absoluta:** Os motivos registrados refletem instantaneamente no *Radar de Vendas* e nos modais rápidos de dispensa abertos pelo *Sino de Notificações*.
- **Exclusão Segura:** Se um motivo for excluído ou editado das configurações, os clientes já dispensados não perderão o histórico. O contrato lembrará do antigo motivo e sinalizará visualmente a tag de `(Desativado)`.


---


---

## 💰 Módulo Financeiro — Gestão de Receitas Avulsas

O CRM LK RAMOS dispõe de controle financeiro completo e independente para **Receitas Avulsas**, permitindo lançar entradas financeiras efetivamente recebidas que não decorram do fluxo habitual de propostas cadastradas.

### 📌 Onde encontrar
No menu lateral, acesse **Financeiro**. Dentro da página, você encontrará a aba dedicada **Receitas Avulsas** e o botão de ação principal:
**`+ Lançar Receita Avulsa`**.

### 📝 Como lançar uma receita
1. Clique no botão **`+ Lançar Receita Avulsa`**.
2. Preencha a **Descrição da Receita** (ex: *Honorários avulsos*, *Comissão de parceria externa*, *Consultoria prestada*).
3. Informe o **Valor Recebido** em Reais (R$).
4. Selecione ou digite a **Data do Recebimento** (formato dd/mm/aaaa).
5. Escolha a **Categoria** correspondente (ex: *Comissão avulsa*, *Prestação de serviços*, *Receita extraordinária*, *Consultoria*, *Bônus / Premiação*, *Outros recebimentos*).
6. Opcionalmente, indique a **Forma de Recebimento** (ex: *Pix*, *Transferência*, *Dinheiro*, *Boleto*) e adicione **Observações**.
7. Clique em **Lançar Receita**. O lançamento será persistido com isolamento seguro por usuário.

### ⚙️ Edição e Exclusão Segura
- **Editar:** Na listagem de receitas avulsas, clique no ícone de lápis correspondente para retificar valores, datas, categorias ou anotações.
- **Exclusão Segura com Confirmação:** Ao clicar no ícone de lixeira, um modal de confirmação exibirá explicitamente a descrição e o valor do registro selecionado. A exclusão afeta estritamente o lançamento avulso em questão e bloqueia múltiplos cliques para evitar acidentes.

### 📊 Separação Absoluta entre Receitas Avulsas e Comissões de Propostas
> [!IMPORTANT]
> **Receitas avulsas não são propostas de crédito.** 
> Os cards superiores do Financeiro (*Produção Digitada*, *Comissão Recebida de Propostas*, *Saldo a Receber* e *Comissão Esperada*) refletem com precisão cirúrgica a produção da esteira de crédito.
> O montante de Receitas Avulsas possui card próprio de apuração mensal e subtotalizadores independentes, impedindo que comissões de contratos sejam infladas ou duplicadas nos relatórios.

---

## 📅 Agenda & Retornos — Vinculação Otimizada de Clientes

Ao agendar ou atualizar um compromisso/retorno com um cliente, a experiência de busca e associação foi totalmente aprimorada.

### 🔍 Como associar um cliente ao retorno
1. No formulário do retorno, clique em **Clique para buscar e vincular um cliente...**.
2. Uma janela de pesquisa rápida será aberta. Você pode pesquisar por:
   - **Nome:** Busca flexível por partes do nome, nomes compostos, tolerante a acentuações e maiúsculas/minúsculas.
   - **CPF:** Digitando com ou sem máscara/pontuação.
   - **Telefone:** Digitando os números do telefone celular ou fixo.
3. Para clientes homônimos, a listagem exibe claramente o **Nome Completo**, o **CPF parcialmente mascarado** para sigilo e o **Telefone de contato**, além do **ID do cadastro**, permitindo identificar com precisão o registro correto.
4. Clique no cliente desejado para vincular. Seus dados de contato principal serão automaticamente preenchidos.

### 🔓 Vinculação 100% Opcional
- O retorno **não exige cliente vinculado**. Você pode agendar contatos avulsos ou novos prospects digitando o nome do contato diretamente.
- Se já houver um cliente vinculado e você desejar remover a ligação, basta clicar no botão **X (Remover vínculo)** ou escolher **Limpar vínculo** na busca.

### 📋 Visualização Completa de Retornos Salvos
Ao salvar um retorno na agenda, você pode consultar todos os seus detalhes e o conteúdo integral das informações registradas a qualquer momento:

1. **Como abrir um retorno:**
   - **Na aba Pendentes:** Basta clicar em qualquer card de retorno da lista.
   - **Na aba Calendário:** Clique diretamente sobre o item do retorno exibido no dia (ex: `• 14:00 - João da Silva`) para abrir a consulta imediata daquele agendamento.
   - **Na aba Histórico:** Clique sobre qualquer retorno já concluído para consultar suas anotações originais e o histórico registrado.
2. **O que é exibido na consulta:**
   - **Título do retorno** e etiqueta de status atualizado (*Pendente, Hoje, Atrasado, Concluído*).
   - **Descrição completa:** Exibida em área própria com quebras de linha e formatação preservadas, sem cortes por reticências e com rolagem suave para textos longos.
   - **Retornos sem descrição:** Caso o retorno não tenha descrição registrada, o sistema exibe uma indicação discreta (*"Nenhuma descrição registrada para este retorno"*), sem inventar informações.
   - **Data e Horário:** Exibição clara da data agendada e horário do retorno.
   - **Cliente Vinculado:** Quando houver cliente associado, exibe o nome e atalho direto para a ficha completa.
   - **Telefone e WhatsApp:** Acesso rápido ao número com atalhos para WhatsApp e cópia.
3. **Consulta Segura e Edição:**
   - **Consulta Pura:** Abrir ou fechar o retorno (pelo botão **Fechar**, pelo botão **X** ou pela tecla `Esc`) não altera, não salva e não exclui nenhum dado no banco.
   - **Editar Dados:** Para modificar o título, a descrição, a data ou o cliente vinculado, clique no botão **"Editar Dados"** no rodapé do modal de detalhes.

---

## 🔎 Busca Global e Local por CPF com e sem Pontuação

A pesquisa por CPF foi unificada e normalizada em todos os pontos do CRM LK RAMOS:
- **Central de Clientes (Tabela de Clientes):** Aceita pesquisa imediata por CPF com pontos e traço (ex: `123.456.789-00`) ou apenas dígitos (ex: `12345678900`).
- **Busca Global (Atalho Ctrl+K / Cabeçalho):** Consulta no servidor Firestore tanto na forma mascarada quanto numérica limpa, localizando o cliente instantaneamente.
- **Tabela de Propostas:** Permite pesquisar propostas pelo CPF do titular do contrato em qualquer formatação.
- **Seleção de Clientes em Propostas e Agenda:** O autocomplete e modal de busca respondem imediatamente a qualquer formato digitado.
- **Cadastro e Edição:** A verificação de duplicidade audita ambas as formatações, prevenindo que um mesmo cliente seja duplicado por variações de pontuação.

---

## ⚡ Carregamento Otimizado sem Ocultação do Histórico

O sistema adota uma estratégia híbrida de alta performance que protege os recursos da sua máquina e as cotas do banco de dados **sem nunca esconder clientes antigos ou contratos históricos**.

### 🛡️ Princípio da Preservação Integral dos Dados
Nenhum cliente ou proposta histórica é excluído, arquivado secretamente ou limitado por data. **100% da sua base permanece acessível.**

### 📦 Como funciona o Carregamento Incremental
- **Lote Inicial Rápido:** Ao abrir as telas de Clientes ou Propostas, os registros mais recentes são carregados instantaneamente, tornando o carregamento imediato.
- **Carregar Mais Registros:** No rodapé da listagem, utilize os botões **`Carregar Mais Clientes`** ou **`Carregar Próximas Propostas`** para paginar e avançar no histórico progressivamente.
- **Busca Transparente no Histórico (Fora do Lote Inicial):**
  Se você precisar localizar um cliente antigo ou um contrato do passado que esteja além da página atual, basta digitar o **CPF**, o **Número da Proposta** ou o **ID** no campo de busca. O CRM executa uma consulta direta no banco de dados, recupera o registro histórico em milissegundos e o insere na sua tabela de forma transparente, sem que você precise carregar página por página manualmente.

---

## 🛡️ Proteção Contra Fechamento Acidental do Cadastro de Propostas

O CRM LK RAMOS conta com um sistema de proteção em camadas para impedir que cliques involuntários, ações acidentais ou quedas de conexão apaguem propostas e operações em andamento.

### 1. Bloqueio de Fechamento por Clique Externo (Backdrop Lock)
- **Clique fora protegido:** Clicar acidentalmente fora da janela central de cadastro ou na área escurecida ao redor (backdrop) **não fecha o formulário**.
- Todos os campos, contratos adicionados, seleções de clientes e anexos permanecem 100% intactos e abertos para continuidade do trabalho.

### 2. Confirmação Inteligente Antes de Descartar
- Se o formulário não tiver alterações ou dados preenchidos, o fechamento ocorre normalmente.
- Caso existam informações digitadas, contratos adicionados ou vínculos não salvos, ao tentar fechar pelo botão **X**, pela tecla `Esc` ou por botões de cancelamento, o sistema exibe a confirmação de segurança:
  - **Título:** *"Você tem um cadastro em andamento!"*
  - **Mensagem:** *"Existem informações preenchidas que ainda não foram salvas. Se você sair agora, poderá perder todo o trabalho realizado. Deseja realmente descartar este cadastro?"*
  - **Botão `CONTINUAR CADASTRANDO`:** Fecha apenas o aviso e mantém todo o formulário e contratos exatamente onde estavam.
  - **Botão `DESCARTAR CADASTRO`:** Somente descarta e fecha após a sua confirmação explícita. Clicar fora da caixa de confirmação não executa o descarte.

### 3. Salvamento Automático e Indicação Visual de Rascunho
- Enquanto você digita ou adiciona contratos, o CRM salva automaticamente um rascunho seguro a cada alteração.
- Uma etiqueta discreta no topo e no rodapé do formulário informa o status em tempo real:
  - *"Salvando rascunho..."* (durante a sincronização)
  - *"Rascunho salvo automaticamente às 14:32"* (após a confirmação da persistência)
  - *"Falha ao salvar rascunho"* (em caso de instabilidade na conexão)

### 4. Recuperação Automática de Cadastros não Finalizados
- Se a página for recarregada acidentalmente, o navegador fechar ou a conexão cair, ao retornar para **Propostas > Nova Proposta**, o sistema apresenta o diálogo de restauração:
  - *"Encontramos um cadastro não finalizado. Deseja continuar de onde parou?"*
  - Exibe o tipo de operação, o cliente selecionado e a quantidade de contratos já preenchidos.
  - **Botão `RECUPERAR CADASTRO`:** Restaura imediatamente todos os dados, contratos e abas ativas.
  - **Botão `DESCARTAR RASCUNHO`:** Limpa o rascunho temporário e abre um cadastro limpo em branco.
- Ao salvar a proposta com sucesso, o rascunho temporário é encerrado automaticamente.

### 5. Proteção Especial para Junção de Parcelas
- Operações de **Portabilidade + Refin com Junção de Parcelas** preservam integralmente todos os contratos de Portabilidade adicionados e os dados unificados do **Refin Consolidado**.
- Alternar entre abas, adicionar novos contratos à operação ou abrir o seletor de clientes não reinicializa nem perde os contratos anteriores.
- Ao clicar em *"Voltar ao Modo Unitário"*, caso existam contratos preenchidos, o CRM solicita confirmação e mantém os contratos preservados no rascunho ativo.


> [!TIP]
> Para alterar qualquer uma dessas informações (Instituições, Tag, etc), acesse o menu **Configurações > Parâmetros** no CRM.
