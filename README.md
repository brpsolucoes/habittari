# Habittari - Catálogo Digital Estático

Catálogo web moderno, estático e de alta performance desenvolvido com **HTML5, Tailwind CSS e Vanilla JavaScript**, pronto para hospedagem gratuita no **GitHub Pages** sem necessidade de compilação ou ferramentas de build (Node.js, Webpack, Vite, etc).

O catálogo é sincronizado dinamicamente com uma planilha pública do **Google Sheets** em formato CSV e envia os pedidos prontos diretamente para o **WhatsApp**.

---

## 🚀 Funcionalidades

- **Design Mobile-First & Responsivo:** Interface construída com Tailwind CSS (via CDN) com visual refinado, tipografia moderna e animações suaves.
- **Sincronização em Tempo Real (Google Sheets):** Consumo dinâmico de dados via `fetch` de um arquivo CSV público.
- **Tratamento de Múltiplas Fotos:** Suporte a múltiplas URLs de imagens por produto (separadas por vírgula na coluna `imagens`).
- **Galeria e Carrossel Interativo:** Modal de detalhes com navegação entre fotos, miniaturas selecionáveis e suporte a atalhos de teclado (`←` e `→` / `ESC`).
- **Carrinho com Persistência:** Mantém os itens salvos mesmo após fechar ou atualizar o navegador via `localStorage`.
- **Botão Flutuante (FAB) com Contador:** Acesso rápido ao resumo do carrinho a partir de qualquer ponto da tela.
- **Checkout Direto para WhatsApp:** Geração automática da mensagem formatada com itens, quantidades, valores e link direto para conversa via `https://wa.me/`.
- **Busca e Ordenação Instantâneas:** Filtro em tempo real por nome/descrição e ordenação por preço (crescente/decrescente) ou alfabética.
- **Resiliente / Fallback Demonstrativo:** Caso a planilha ainda não tenha sido configurada ou a conexão falhe, a aplicação exibe produtos de demonstração automaticamente.

---

## 📁 Estrutura de Arquivos

```text
habittari/
├── index.html     # Estrutura semântica, layout e Tailwind CSS CDN
├── products.js    # Banco de dados de produtos (edite ou adicione itens aqui!)
├── app.js         # Lógica do carrinho, carrossel, filtros e checkout WhatsApp
├── style.css      # Estilizações finas, animações de modal e utilitários
└── README.md      # Documentação e instruções de configuração
```

---

## 🛍️ Como Cadastrar ou Editar Produtos

Os produtos estão organizados de forma limpa e comentada no arquivo [`products.js`](file:///home/bruno/dev/pessoal/habittari/products.js).

Para adicionar um produto, basta inserir um novo objeto na lista:

```javascript
{
  id: "prod-13",
  nome: "Nome do Produto",
  categoria: "Móveis", // ou "Iluminação", "Decoração", "Têxtil"
  preco: 450.00,
  descricao: "Descrição completa com medidas e materiais...",
  imagens: [
    "https://link-da-foto-capa.jpg",
    "https://link-da-foto-detalhe.jpg"
  ]
}
```

- **Primeira foto:** Exibida no card principal do catálogo.
- **Demais fotos:** Formam o carrossel interativo do modal de detalhes.
- **Categorias:** Geram automaticamente as abas de filtro na parte superior do catálogo.

### 2. Publicar a Planilha como CSV
1. No menu superior da planilha, clique em **Arquivo** > **Compartilhar** > **Publicar na Web**.
2. Na aba **Link**, selecione a página da planilha desejada.
3. Altere o formato de **Página da Web** para **Valores separados por vírgula (.csv)**.
4. Clique no botão **Publicar**.
5. Copie o link gerado e cole na constante `GOOGLE_SHEETS_CSV_URL` no arquivo [`app.js`](file:///home/bruno/dev/pessoal/habittari/app.js#L26).

---

## 🌐 Como Publicar no GitHub Pages

1. Faça o commit e o push dos arquivos para o seu repositório no GitHub:
   ```bash
   git add .
   git commit -m "feat: catálogo digital completo com integração google sheets e whatsapp"
   git push origin main
   ```
2. No repositório no GitHub, acesse a aba **Settings** > **Pages** (no menu lateral esquerdo).
3. Na seção **Build and deployment**:
   - **Source:** selecione `Deploy from a branch`
   - **Branch:** selecione `main` e a pasta `/ (root)`
4. Clique em **Save**.
5. Em alguns instantes, o GitHub Pages fornecerá a URL pública do seu catálogo (ex: `https://seu-usuario.github.io/habittari/`).

---

## 🧪 Testando Localmente

Como o projeto é 100% estático, você pode testá-lo de qualquer uma das seguintes formas:
- Dê um duplo clique no arquivo [`index.html`](file:///home/bruno/dev/pessoal/habittari/index.html) para abrir diretamente no navegador.
- Ou use qualquer servidor estático local:
  ```bash
  # Python 3
  python3 -m http.server 8000
  ```
  Acesse `http://localhost:8000`.
