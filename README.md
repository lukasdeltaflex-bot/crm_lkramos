# LK RAMOS

Este é um sistema de gerenciamento completo para correspondentes bancários, construído com Next.js, Firebase e IA generativa.

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
rch
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

---

## Configurando o Envio de E-mails (Gmail)

Para habilitar o envio de e-mails de resumo, você precisa configurar o sistema para usar sua conta do Gmail.

### **Passo 1: Gerar uma Senha de App no Gmail**

Como o sistema envia e-mails em seu nome, você precisa de uma senha especial chamada "Senha de App". Isso é mais seguro do que usar sua senha principal.

1.  Acesse as configurações da sua Conta Google: [myaccount.google.com](https://myaccount.google.com/)
2.  Vá para a seção **Segurança**.
3.  Certifique-se de que a **Verificação em duas etapas** está **ativada**. Você não pode criar uma Senha de App sem isso.
4.  Ainda na seção Segurança, encontre e clique em **Senhas de app**.
5.  Selecione "E-mail" como o app e "Outro (nome personalizado)" como o dispositivo. Dê um nome, como "LK Ramos App".
6.  Clique em **Gerar**.
7.  O Google mostrará uma senha de 16 caracteres. **Copie esta senha**. Ela não será mostrada novamente.

### **Passo 2: Configurar as Variáveis de Ambiente**

Agora, você precisa informar ao sistema seu e-mail e a senha que acabou de gerar.

1.  Abra o arquivo chamado `.env` que está na pasta principal do seu projeto.
2.  Você verá o seguinte conteúdo:

    ```
    EMAIL_USER=seu-email-gmail@gmail.com
    EMAIL_PASS=sua-senha-de-app-aqui
    ```

3.  **Substitua** `seu-email-gmail@gmail.com` pelo seu endereço de e-mail completo do Gmail.
4.  **Substitua** `sua-senha-de-app-aqui` pela senha de 16 caracteres que você copiou no passo anterior (sem espaços).
5.  Salve o arquivo `.env`.

### **Passo 3: Reinicie os Servidores**

Para que as novas configurações sejam aplicadas, você precisa parar e iniciar novamente os dois servidores.

1.  Vá em cada uma das janelas de **Terminal**.
2.  Pressione `Ctrl + C` para parar o processo em cada uma.
3.  Siga os [passos 1 e 2 do guia de início](#como-ligar-e-usar-o-sistema-passo-a-passo) para iniciá-los novamente.

Pronto! A função de enviar e-mail de resumo agora usará sua conta do Gmail para enviar os e-mails de verdade.
