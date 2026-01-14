# INSS Manager

Este é um sistema de gerenciamento completo para correspondentes bancários INSS, construído com Next.js, Firebase e IA generativa.

## Link de Acesso Rápido

O link para acessar sua aplicação (após iniciar os servidores abaixo) é:

**[http://localhost:9002](http://localhost:9002)**

---

## Como Ligar e Usar o Sistema (Passo a Passo)

Seu aplicativo está pronto para ser usado. Para "ligá-lo" e acessá-lo no seu navegador, siga os passos abaixo. Você precisará usar as janelas de **Terminal** que já vêm integradas neste ambiente de desenvolvimento (geralmente localizadas na parte de baixo da sua tela).

### **Passo 1: Iniciar o Servidor Principal**

Este comando "liga" a interface do seu sistema (as telas, botões, tabelas).

1.  Encontre a **primeira aba de Terminal**.
2.  Clique nela e digite o comando abaixo:

```bash
npm run dev
```

3.  Pressione **Enter**. Deixe este terminal rodando.

---

### **Passo 2: Iniciar o Servidor de Inteligência Artificial (IA)**

Este comando "liga" o cérebro de IA do seu sistema. Ele agora observa as mudanças automaticamente, o que o torna mais estável.

1.  Encontre a **segunda aba de Terminal**. Se não houver, clique no ícone de `+` para abrir um novo.
2.  Neste segundo terminal, digite o seguinte comando:

```bash
npm run genkit:watch
```

3.  Pressione **Enter**. Deixe este segundo terminal rodando também.

---

### **Passo 3: Acessar sua Aplicação**

Com os dois terminais rodando, seu sistema estará online e pronto para uso no link [http://localhost:9002](http://localhost:9002).

**Lembrete Importante:** Para que o sistema funcione corretamente, os dois terminais devem permanecer abertos enquanto você o utiliza.

### Primeiros Passos no Sistema

1.  **Crie sua Conta:** Na primeira vez que acessar, clique em **"Cadastre-se"** para criar seu usuário e senha.
2.  **Faça Login:** Utilize as credenciais que você acabou de criar para entrar no sistema.
3.  **Explore:** Navegue pelas seções de **Dashboard**, **Clientes**, **Propostas** e **Financeiro** para começar a usar todas as funcionalidades que desenvolvemos.
4.  **Personalize:** Acesse a página de **Configurações** para ajustar as listas de opções (produtos, bancos, etc.) de acordo com suas necessidades.
