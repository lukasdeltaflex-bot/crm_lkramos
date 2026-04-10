# Guia de Índices do Firestore - CRM LK RAMOS

Para que o CRM funcione corretamente em produção, o Firestore exige a criação manual de **Índices Compostos**. Sem eles, algumas telas podem aparecer vazias ou apresentar erros silenciosos.

Siga as instruções abaixo para criar os índices no [Console do Firebase](https://console.firebase.google.com/).

## Como Criar um Índice
1. Vá para **Firestore Database** > **Índices** > **Composto**.
2. Clique em **Criar Índice**.
3. Preencha os campos conforme as tabelas abaixo.

---

### Coleção: `loanProposals`

Estes índices são vitais para o Dashboard, Financeiro e Resumo Diário.

| Índice # | Campo 1 | Ordem | Campo 2 | Ordem | Campo 3 | Ordem | Usado em: |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `ownerId` | Ascendente | `deleted` | Ascendente | `dateDigitized` | Descendente | Dashboard / Financeiro |
| **2** | `ownerId` | Ascendente | `deleted` | Ascendente | `dateDigitized` | Ascendente | Resumo Diário |
| **3** | `ownerId` | Ascendente | `customerId` | Ascendente | - | - | Ficha do Cliente |
| **4** | `ownerId` | Ascendente | `deleted` | Ascendente | - | - | Lixeira |

---

### Coleção: `customers`

Estes índices garantem que a listagem de clientes e a lixeira funcionem perfeitamente.

| Índice # | Campo 1 | Ordem | Campo 2 | Ordem | Usado em: |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `ownerId` | Ascendente | `numericId` | Descendente | Lista Financeira / Clientes |
| **2** | `ownerId` | Ascendente | `deleted` | Ascendente | Lixeira |

---

### Coleção: `users/{uid}/followUps`

| Índice # | Campo 1 | Ordem | Usado em: |
| :--- | :--- | :--- | :--- |
| **1** | `deleted` | Ascendente | Lixeira de Retornos |

> [!NOTE] 
> O Firebase pode levar alguns minutos para "Construir" o índice após a criação. Durante esse tempo, as queries ainda podem falhar.

> [!TIP]
> **Dica Pro**: Se você abrir o console do navegador (F12) em uma página que está falhando por falta de índice, o Firebase costuma exibir um link direto no log de erro. Clicar nesse link já preenche os campos do índice automaticamente para você!
