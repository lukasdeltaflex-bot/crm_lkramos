
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
npm run genkit:watch
```

3.  Pressione **Enter**. Deixe este segundo terminal rodando também.

---

### **Passo 3: Acessar sua Aplicação**

Com os dois terminais rodando, seu sistema estará online e pronto para uso no link [http://localhost:9002](http://localhost:9002).

**Lembrete Importante:** Para que o sistema funcione corretamente, os dois terminais devem permanecer abertos enquanto você o utiliza.

---

## Configurando a Inteligência Artificial (Gemini)

Para que as funções de extração de dados, resumos e análise funcionem, você precisa de uma chave gratuita do Google.

1.  Acesse **[aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)**.
2.  Clique em **"Create API key"**.
3.  Copie a chave gerada.
4.  Abra o arquivo `.env` na pasta principal do projeto.
5.  Substitua `sua_chave_aqui_sem_aspas` pela chave que você copiou.
6.  Salve o arquivo e reinicie os terminais.

---

## Configurando o Envio de E-mails (Gmail)

Para habilitar o envio de e-mails de resumo, você precisa configurar o sistema para usar sua conta do Gmail.

### **Passo 1: Gerar uma Senha de App no Gmail**

Como o sistema envia e-mails em seu nome, você precisa de uma senha especial chamada "Senha de App". Isso é mais seguro do que usar sua senha principal.

1.  Acesse as configurações da sua Conta Google: [myaccount.google.com](https://myaccount.google.com/)
2.  Vá para a seção **Segurança**.
3.  Certifique-se de que a **Verificação em duas etapas** está **ativada**.
4.  Ainda na seção Segurança, encontre e clique em **Senhas de app**.
5.  Selecione "E-mail" como o app e "Outro (nome personalizado)" como o dispositivo. Dê um nome, como "LK Ramos App".
6.  Clique em **Gerar**.
7.  O Google mostrará uma senha de 16 caracteres. **Copie esta senha**.

### **Passo 2: Configurar as Variáveis de Ambiente**

1.  Abra o arquivo `.env`.
2.  Substitua `seu-email-gmail@gmail.com` pelo seu e-mail real.
3.  Substitua `sua-senha-de-app-de-16-digitos` pela senha de 16 caracteres que você copiou (sem espaços).
4.  Salve o arquivo e reinicie os terminais.
