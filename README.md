# INSS Manager

Este é um sistema de gerenciamento completo para correspondentes bancários INSS, construído com Next.js, Firebase e IA generativa.

## Como Usar o Sistema

Para utilizar o sistema no seu ambiente de desenvolvimento, siga os passos abaixo.

### 1. Requisitos

Certifique-se de que você tem o Node.js e o npm instalados no seu ambiente.

### 2. Iniciando os Servidores

Você precisa de dois terminais abertos para rodar a aplicação completamente.

**Terminal 1: Iniciar o Servidor Principal da Aplicação**

Este comando inicia a interface do usuário e o servidor web.

```bash
npm run dev
```

**Terminal 2: Iniciar o Servidor de Inteligência Artificial (Genkit)**

Este comando ativa os recursos de IA, como resumos de notas e lembretes.

```bash
npm run genkit:dev
```

### 3. Acessando a Aplicação

Com os dois servidores rodando, abra seu navegador e acesse a seguinte URL:

[http://localhost:9002](http://localhost:9002)

### 4. Primeiros Passos

1.  **Crie sua Conta:** Na primeira vez que acessar, clique em **"Cadastre-se"** para criar seu usuário e senha.
2.  **Faça Login:** Utilize as credenciais que você acabou de criar para entrar no sistema.
3.  **Explore:** Navegue pelas seções de **Dashboard**, **Clientes**, **Propostas** e **Financeiro** para começar a usar todas as funcionalidades que desenvolvemos.
4.  **Personalize:** Acesse a página de **Configurações** para ajustar as listas de opções (produtos, bancos, etc.) de acordo com suas necessidades.
