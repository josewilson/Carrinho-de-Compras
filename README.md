# Carrinho de Compras (Mobile-First)

Aplicativo web para compras presenciais com listas predefinidas por tipo de comercio, foco em agilidade no celular e suporte a instalacao como app (PWA).

## Funcionalidades

- Listas prontas por comercio: supermercado, importados e construcao.
- Edicao rapida por item: quantidade e valor unitario.
- Marcacao de item comprado com contador de progresso.
- Historico de compras com reutilizacao em um toque.
- Busca no carrinho e filtros no historico (com limpar filtros).
- Persistencia local automatica (dados salvos no navegador).
- Backup e restauracao por arquivo JSON.
- Compartilhamento de backup para nuvem (Drive, e-mail, WhatsApp).
- PWA instalavel em Android/iOS/desktop.

## Tecnologias

- React
- Vite
- CSS responsivo
- Service Worker (PWA manual)

## Como executar

1. Instalar dependencias:

```bash
npm install
```

2. Executar em modo desenvolvimento:

```bash
npm run dev
```

3. Gerar build de producao:

```bash
npm run build
```

4. Visualizar build local:

```bash
npm run preview
```

## Instalar Como App (PWA)

- Android (Chrome): menu do navegador > Adicionar a tela inicial.
- iPhone (Safari): Compartilhar > Adicionar a Tela de Inicio.
- Desktop (Chrome/Edge): icone de instalacao na barra de enderecos.

## Publicar E Compartilhar (Link + QR)

### Publicar no Vercel

1. Suba o projeto para um repositorio GitHub.
2. Acesse https://vercel.com e conecte ao GitHub.
3. Clique em Add New Project e selecione o repositorio.
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Clique em Deploy.

### Gerar QR Code do Link Publico

1. Copie a URL publicada (exemplo: `https://seu-app.vercel.app`).
2. Abra um gerador de QR Code.
3. Cole a URL e imprima o QR para uso no caixa.

## Backup Na Nuvem (Sem Servidor)

O app permite exportar e compartilhar backup JSON.

Fluxo recomendado:

1. Clique em Compartilhar backup.
2. Envie para Drive, e-mail ou WhatsApp.
3. Em outro aparelho, abra o app e use Importar backup.
