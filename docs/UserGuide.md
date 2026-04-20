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

> [!TIP]
> Para alterar qualquer uma dessas informações (Instituições, Tag, etc), acesse o menu **Configurações > Parâmetros** no CRM.
