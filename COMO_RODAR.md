# Como Rodar o Projeto (Passo a Passo)

Este guia foi feito para ser seguido por qualquer pessoa, mesmo sem conhecimento técnico prévio.

## Passo 1: Instalar o Node.js
O "motor" que faz o site funcionar no seu computador se chama **Node.js**.

1.  Acesse o site oficial: [https://nodejs.org/](https://nodejs.org/)
2.  Baixe a versão **LTS** (Recomendada para a maioria dos usuários).
3.  Instale o programa clicando "Next" (Próximo) em todas as telas, como um programa comum.
4.  **Importante**: Após instalar, reinicie o seu computador (ou feche e abra o VS Code novamente) para que ele reconheça a instalação.

## Passo 2: Abrir o Terminal
Você precisa dar comandos para o computador preparar o projeto.

1.  No VS Code (onde você está vendo este arquivo), olhe para o menu superior.
2.  Clique em **Terminal** -> **New Terminal** (Novo Terminal).
3.  Uma janelinha preta vai abrir na parte de baixo da tela.

## Passo 3: Instalar as Dependências
O projeto precisa baixar algumas "peças" da internet para funcionar (bibliotecas).

1.  Na janelinha do terminal, digite o seguinte comando e aperte **Enter**:
    ```bash
    npm install
    ```
2.  Várias barrinhas de progresso vão aparecer. Espere terminar. Pode demorar alguns minutos dependendo da sua internet.
3.  Quando parar de mexer e aparecer o caminho da pasta novamente, terminou.

## Passo 4: Rodar o Projeto
Agora vamos ligar o site.

1.  No mesmo terminal, digite:
    ```bash
    npm run dev
    ```
2.  Aperte **Enter**.
3.  Você verá uma mensagem parecida com:
    ```
    Local: http://localhost:8080/
    ```
4.  Segure a tecla **Ctrl** e clique nesse link (http://localhost:8080/), ou copie e cole no seu navegador (Chrome, Edge, etc).

## Pronto! 🎉
O site deve abrir no seu navegador.

---

### Problemas Comuns

*   **Erro "npm não reconhecido"**: Significa que o Node.js não foi instalado corretamente ou você não reiniciou o VS Code após instalar.
*   **Erro de permissão**: Tente abrir o VS Code como Administrador.
