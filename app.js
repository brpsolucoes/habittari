/**
 * ==============================================================================
 * HABITTARI - CATÁLOGO DIGITAL ESTÁTICO (GITHUB PAGES READY)
 * ==============================================================================
 * Arquitetura Vanilla JavaScript Modular
 * - Consumo de dados via Google Sheets (formato CSV público)
 * - Persistência de carrinho em LocalStorage
 * - Interface Mobile-first reativa com Tailwind CSS
 * - Checkout direto para o WhatsApp
 * ==============================================================================
 */

// ==============================================================================
// 1. CONFIGURAÇÕES & CONSTANTES GLOBAIS
// ==============================================================================

/**
 * URL do CSV publicado da sua planilha do Google Sheets.
 * 
 * Como obter essa URL:
 * 1. No Google Sheets: Arquivo > Compartilhar > Publicar na Web.
 * 2. Em "Link", selecione a aba desejada e troque "Página da Web" por "Valores separados por vírgula (.csv)".
 * 3. Clique em Publicar e cole a URL gerada abaixo.
 * 
 * As colunas obrigatórias no cabeçalho da planilha são:
 * - id
 * - nome
 * - descricao
 * - preco
 * - imagens (URLs separadas por vírgula)
 */
const GOOGLE_SHEETS_CSV_URL = ""; 

/**
 * Número do WhatsApp para recebimento dos pedidos (DDI + DDD + Telefone, apenas números).
 * Exemplo para Brasil (SP): 5511999999999
 */
const WHATSAPP_PHONE_NUMBER = "5511964729650";

/**
 * Chave de armazenamento no LocalStorage para o carrinho
 */
const STORAGE_CART_KEY = "habittari_cart_v1";

/**
 * Placeholder para produtos sem imagem cadastrada
 */
const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80";

/**
 * Dados de demonstração (fallback inteligente):
 * Usado automaticamente caso GOOGLE_SHEETS_CSV_URL esteja vazio ou a requisição falhe,
 * garantindo que a aplicação sempre funcione imediatamente para testes locais e demonstração.
 */
const DEMO_PRODUCTS = [
  {
    id: "rolinha-esqueceram-de-mim",
    nome: "Rolinha da Amizade (Esqueceram de Mim)",
    categoria: "Decoração",
    preco: 12.90,
    descricao: "Inspirada no clássico 'Esqueceram de Mim', um símbolo afetivo de união e lealdade para presentear ou decorar com significado.\n\n\"Enquanto cada um de nós tiver a sua rolinha, seremos amigos para sempre.\"\n\n• Produto Voolt\n• Fabricação: Impresso em 3D com alta precisão\n• Material: PLA ecológico e resistente\n• Cor: Branco Off-white",
    imagens: [
      "assets/img/products/rolinha-esqueceram-de-mim/rolinha%20capa.jpeg",
      "assets/img/products/rolinha-esqueceram-de-mim/rolinha%2001.jpeg"
    ]
  }
];

// ==============================================================================
// 2. ESTADO GLOBAL DA APLICAÇÃO (STATE MANAGEMENT)
// ==============================================================================

const AppState = {
  products: [],
  filteredProducts: [],
  cart: [],
  modalProduct: null,
  activeImageIndex: 0,
  modalQuantity: 1,
  searchQuery: "",
  selectedCategory: "all",
  sortBy: "default",
  isCartOpen: false,
  isProductModalOpen: false
};

// ==============================================================================
// 3. UTILITÁRIOS E HELPERS
// ==============================================================================

/**
 * Formata um valor numérico para a moeda Real Brasileiro (BRL)
 * @param {number} value
 * @returns {string} Ex: "R$ 1.250,00"
 */
function formatBRL(value) {
  const safeNumber = isNaN(value) ? 0 : Number(value);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(safeNumber);
}

/**
 * Converte strings de preço em número float confiável.
 * Lida com valores como "1.250,50", "150,00", "150.00", "R$ 99,90"
 * @param {string|number} priceStr
 * @returns {number}
 */
function parsePrice(priceStr) {
  if (typeof priceStr === "number") return priceStr;
  if (!priceStr) return 0;

  let cleaned = priceStr.toString().replace(/[^\d.,]/g, "").trim();
  if (cleaned.includes(",") && cleaned.includes(".")) {
    // Ex: 1.250,50 -> 1250.50
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    // Ex: 150,50 -> 150.50
    cleaned = cleaned.replace(",", ".");
  }
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parser RFC-4180 robusto para CSV.
 * Lida com aspas, quebras de linha e vírgulas internas em campos como descrições ou listas de imagens.
 * @param {string} text
 * @returns {string[][]} Matriz de linhas e colunas
 */
function parseCSV(text) {
  const rows = [];
  let currentRow = [""];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Aspas duplas escapadas dentro de campo com aspas
        currentRow[currentRow.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push("");
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      if (currentRow.length > 1 || currentRow[0].trim() !== "") {
        rows.push(currentRow);
      }
      currentRow = [""];
    } else {
      currentRow[currentRow.length - 1] += char;
    }
  }

  if (currentRow.length > 1 || currentRow[0].trim() !== "") {
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Exibe notificação temporária (Toast)
 * @param {string} message
 */
let toastTimeout;
function showToast(message) {
  const toast = document.getElementById("toastNotification");
  const msgEl = document.getElementById("toastMessage");
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2800);
}

// ==============================================================================
// 4. PERSISTÊNCIA DO CARRINHO (LOCALSTORAGE)
// ==============================================================================

function loadCartFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_CART_KEY);
    AppState.cart = stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error("Erro ao carregar carrinho do localStorage:", err);
    AppState.cart = [];
  }
  updateCartCounters();
}

function saveCartToStorage() {
  try {
    localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(AppState.cart));
  } catch (err) {
    console.error("Erro ao salvar carrinho no localStorage:", err);
  }
  updateCartCounters();
}

/**
 * Adiciona um produto ao carrinho ou incrementa sua quantidade
 * @param {object} product
 * @param {number} quantity
 */
function addToCart(product, quantity = 1) {
  if (!product || !product.id) return;
  const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);

  const existingIndex = AppState.cart.findIndex(item => item.product.id === product.id);

  if (existingIndex > -1) {
    AppState.cart[existingIndex].quantity += qtyToAdd;
  } else {
    AppState.cart.push({
      product: {
        id: product.id,
        nome: product.nome,
        preco: product.preco,
        imagem: (product.imagens && product.imagens.length > 0) ? product.imagens[0] : PLACEHOLDER_IMAGE
      },
      quantity: qtyToAdd
    });
  }

  saveCartToStorage();
  showToast(`"${product.nome}" adicionado ao carrinho!`);
  renderCartModal();
}

/**
 * Atualiza a quantidade de um item no carrinho
 * @param {string} productId
 * @param {number} delta Variação (+1 ou -1)
 */
function updateItemQuantity(productId, delta) {
  const itemIndex = AppState.cart.findIndex(item => item.product.id === productId);
  if (itemIndex === -1) return;

  AppState.cart[itemIndex].quantity += delta;

  if (AppState.cart[itemIndex].quantity <= 0) {
    AppState.cart.splice(itemIndex, 1);
  }

  saveCartToStorage();
  renderCartModal();
}

/**
 * Remove um item do carrinho completamente
 * @param {string} productId
 */
function removeFromCart(productId) {
  AppState.cart = AppState.cart.filter(item => item.product.id !== productId);
  saveCartToStorage();
  renderCartModal();
}

/**
 * Atualiza os contadores numéricos de itens do carrinho na interface
 */
function updateCartCounters() {
  const totalItems = AppState.cart.reduce((sum, item) => sum + item.quantity, 0);

  const headerBadge = document.getElementById("headerCartCount");
  const floatingBadge = document.getElementById("floatingCartCount");
  const summaryCount = document.getElementById("cartItemSummaryCount");

  if (headerBadge) headerBadge.textContent = totalItems;
  if (floatingBadge) floatingBadge.textContent = totalItems;
  if (summaryCount) {
    summaryCount.textContent = totalItems === 1 ? "1 item selecionado" : `${totalItems} itens selecionados`;
  }
}

/**
 * Calcula o valor total do carrinho
 * @returns {number}
 */
function getCartTotal() {
  return AppState.cart.reduce((total, item) => {
    return total + (item.product.preco * item.quantity);
  }, 0);
}

// ==============================================================================
// 5. CARREGAMENTO E CONSUMO DOS DADOS (GOOGLE SHEETS CSV)
// ==============================================================================

/**
 * Realiza o split das imagens separadas por vírgula na coluna 'imagens'
 * @param {string} imagensField
 * @returns {string[]} Lista de URLs limpas
 */
function splitImageUrls(imagensField) {
  if (!imagensField || typeof imagensField !== "string") {
    return [PLACEHOLDER_IMAGE];
  }

  const urls = imagensField
    .split(",")
    .map(url => url.trim())
    .filter(url => url.length > 0);

  return urls.length > 0 ? urls : [PLACEHOLDER_IMAGE];
}

/**
 * Inicializa os produtos da aplicação.
 * Prioriza a lista PRODUCTS definida em products.js (fácil de editar diretamente no código).
 * Se GOOGLE_SHEETS_CSV_URL estiver configurada, busca dinamicamente da planilha.
 */
async function loadProductsData() {
  const skeleton = document.getElementById("loadingSkeleton");
  const grid = document.getElementById("productsGrid");

  // 1. Catálogo local direto no código (products.js)
  if (typeof PRODUCTS !== "undefined" && Array.isArray(PRODUCTS) && PRODUCTS.length > 0 && (!GOOGLE_SHEETS_CSV_URL || GOOGLE_SHEETS_CSV_URL.trim() === "")) {
    AppState.products = PRODUCTS;
    AppState.filteredProducts = [...PRODUCTS];
    if (skeleton) skeleton.classList.add("hidden");
    if (grid) grid.classList.remove("hidden");
    renderCategoryFilters();
    renderProducts();
    return;
  }

  // 2. Se houver URL do Google Sheets configurada, busca da planilha
  if (GOOGLE_SHEETS_CSV_URL && GOOGLE_SHEETS_CSV_URL.trim() !== "") {
    await fetchProductsFromSheets();
    return;
  }

  // 3. Fallback
  AppState.products = (typeof PRODUCTS !== "undefined" && PRODUCTS.length > 0) ? PRODUCTS : DEMO_PRODUCTS;
  AppState.filteredProducts = [...AppState.products];
  if (skeleton) skeleton.classList.add("hidden");
  if (grid) grid.classList.remove("hidden");
  renderCategoryFilters();
  renderProducts();
}

/**
 * Faz o fetch do CSV e popula o AppState.products
 */
async function fetchProductsFromSheets() {
  const skeleton = document.getElementById("loadingSkeleton");
  const grid = document.getElementById("productsGrid");
  const errorState = document.getElementById("errorState");
  const emptyState = document.getElementById("emptyState");

  // Se o usuário não configurou a URL ou ela for vazia, usamos os produtos em código
  if (!GOOGLE_SHEETS_CSV_URL || GOOGLE_SHEETS_CSV_URL.trim() === "") {
    AppState.products = (typeof PRODUCTS !== "undefined" && PRODUCTS.length > 0) ? PRODUCTS : DEMO_PRODUCTS;
    AppState.filteredProducts = [...AppState.products];
    renderProducts();
    if (skeleton) skeleton.classList.add("hidden");
    if (grid) grid.classList.remove("hidden");
    return;
  }

  try {
    if (skeleton) skeleton.classList.remove("hidden");
    if (grid) grid.classList.add("hidden");
    if (errorState) errorState.classList.add("hidden");
    if (emptyState) emptyState.classList.add("hidden");

    const response = await fetch(GOOGLE_SHEETS_CSV_URL, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Erro HTTP ao buscar planilha: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();
    const parsedRows = parseCSV(csvText);

    if (parsedRows.length < 2) {
      throw new Error("A planilha está vazia ou não contém produtos cadastrados.");
    }

    // Identificar índices das colunas no cabeçalho
    const headerRow = parsedRows[0].map(col => col.trim().toLowerCase());
    const idIdx = headerRow.findIndex(h => h === "id");
    const nomeIdx = headerRow.findIndex(h => h === "nome" || h === "produto");
    const descIdx = headerRow.findIndex(h => h === "descricao" || h === "descrição");
    const precoIdx = headerRow.findIndex(h => h === "preco" || h === "preço" || h === "valor");
    const imagensIdx = headerRow.findIndex(h => h === "imagens" || h === "imagem" || h === "fotos");
    const catIdx = headerRow.findIndex(h => h === "categoria" || h === "tipo");

    if (nomeIdx === -1 || precoIdx === -1) {
      throw new Error("Cabeçalho inválido no CSV. Certifique-se de ter as colunas: id, nome, descricao, preco, imagens.");
    }

    // Mapear linhas de dados
    const products = [];
    for (let i = 1; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      if (!row || row.length === 0 || !row[nomeIdx] || row[nomeIdx].trim() === "") continue;

      const rawId = (idIdx !== -1 && row[idIdx]) ? row[idIdx].trim() : `prod-${i}`;
      const nome = row[nomeIdx].trim();
      const descricao = (descIdx !== -1 && row[descIdx]) ? row[descIdx].trim() : "Sem descrição detalhada.";
      const preco = parsePrice(row[precoIdx]);
      const rawImagens = (imagensIdx !== -1 && row[imagensIdx]) ? row[imagensIdx] : "";
      const categoria = (catIdx !== -1 && row[catIdx]) ? row[catIdx].trim() : "Geral";
      const imagens = splitImageUrls(rawImagens);

      products.push({
        id: rawId,
        nome,
        categoria,
        descricao,
        preco,
        imagens
      });
    }

    AppState.products = products;
    AppState.filteredProducts = [...products];

    if (skeleton) skeleton.classList.add("hidden");
    if (grid) grid.classList.remove("hidden");
    renderProducts();

  } catch (error) {
    console.error("Falha ao obter produtos via Google Sheets:", error);
    AppState.products = (typeof PRODUCTS !== "undefined" && PRODUCTS.length > 0) ? PRODUCTS : DEMO_PRODUCTS;
    AppState.filteredProducts = [...AppState.products];

    if (skeleton) skeleton.classList.add("hidden");
    if (grid) grid.classList.remove("hidden");
    renderProducts();
  }
}

// ==============================================================================
// 6. RENDERIZAÇÃO DA INTERFACE PRINCIPAL (GRID DE PRODUTOS & CATEGORIAS)
// ==============================================================================

/**
 * Renderiza dinamicamente as pílulas de categoria se houver mais de uma categoria cadastrada.
 * Caso haja apenas 1 categoria (ou nenhuma), oculta a barra para manter o visual limpo e focado.
 */
function renderCategoryFilters() {
  const container = document.getElementById("categoryFilters");
  if (!container) return;

  const categories = [...new Set(AppState.products.map(p => p.categoria).filter(Boolean))];

  // Se houver 1 ou nenhuma categoria, esconde as pílulas para não poluir
  if (categories.length <= 1) {
    container.innerHTML = "";
    container.classList.add("hidden");
    return;
  }

  container.classList.remove("hidden");
  container.innerHTML = [
    `<button class="category-btn ${AppState.selectedCategory === 'all' ? 'active bg-pine-900 text-white shadow-sm font-bold' : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200 font-semibold'} px-4 py-2 rounded-full text-xs transition-all" data-category="all">Todas as Peças</button>`,
    ...categories.map(cat => `
      <button class="category-btn ${AppState.selectedCategory === cat ? 'active bg-pine-900 text-white shadow-sm font-bold' : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200 font-semibold'} px-4 py-2 rounded-full text-xs transition-all" data-category="${cat}">
        ${cat}
      </button>
    `)
  ].join("");

  container.querySelectorAll(".category-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      AppState.selectedCategory = btn.getAttribute("data-category") || "all";
      renderCategoryFilters();
      renderProducts();
    });
  });
}

/**
 * Renderiza o grid de produtos
 */
function renderProducts() {
  const grid = document.getElementById("productsGrid");
  const countLabel = document.getElementById("productsCount");
  const emptyState = document.getElementById("emptyState");

  if (!grid) return;

  // Filtragem por busca e categoria
  let list = AppState.products.filter(item => {
    // Filtro por Categoria
    if (AppState.selectedCategory && AppState.selectedCategory !== "all") {
      if (item.categoria !== AppState.selectedCategory) return false;
    }

    // Filtro por Busca de Texto
    if (!AppState.searchQuery) return true;
    const q = AppState.searchQuery.toLowerCase();
    const nomeMatches = item.nome && item.nome.toLowerCase().includes(q);
    const descMatches = item.descricao && item.descricao.toLowerCase().includes(q);
    const catMatches = item.categoria && item.categoria.toLowerCase().includes(q);
    return nomeMatches || descMatches || catMatches;
  });

  // Ordenação
  if (AppState.sortBy === "price-asc") {
    list.sort((a, b) => a.preco - b.preco);
  } else if (AppState.sortBy === "price-desc") {
    list.sort((a, b) => b.preco - a.preco);
  } else if (AppState.sortBy === "name-asc") {
    list.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  AppState.filteredProducts = list;

  // Atualizar contador
  if (countLabel) {
    countLabel.textContent = `${list.length} ${list.length === 1 ? "peça disponível" : "peças disponíveis"}`;
  }

  // Estado Vazio
  if (list.length === 0) {
    grid.innerHTML = "";
    grid.classList.add("hidden");
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  if (emptyState) emptyState.classList.add("hidden");
  grid.classList.remove("hidden");

  // Construir HTML dos Cards (Elegância Natalina & Detalhe de Impressão 3D)
  grid.innerHTML = list.map(product => {
    const firstImage = (product.imagens && product.imagens.length > 0) ? product.imagens[0] : PLACEHOLDER_IMAGE;
    const totalImages = product.imagens ? product.imagens.length : 1;

    return `
      <div 
        class="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-festive-card hover:border-gold-300 transition-all duration-300 flex flex-col group relative"
        data-id="${product.id}"
      >
        <!-- Imagem do Produto com clique para detalhes -->
        <div 
          class="relative aspect-square w-full bg-warm-100 overflow-hidden cursor-pointer js-open-details"
          data-id="${product.id}"
          title="Ver detalhes de ${product.nome}"
        >
          <img 
            src="${firstImage}" 
            alt="${product.nome}" 
            loading="lazy"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onerror="this.onerror=null; this.src='${PLACEHOLDER_IMAGE}';"
          >

          <!-- Badges Superiores -->
          <div class="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            ${product.categoria ? `
              <span class="bg-white/95 backdrop-blur-md text-pine-900 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs border border-stone-100">
                ${product.categoria}
              </span>
            ` : "<span></span>"}

            <span class="bg-pine-900/85 backdrop-blur-md text-gold-300 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs border border-gold-400/20">
              <span>✦</span> 3D
            </span>
          </div>

          ${totalImages > 1 ? `
            <span class="absolute bottom-2.5 right-2.5 bg-pine-950/75 backdrop-blur-md text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
              <svg class="w-3 h-3 text-gold-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              ${totalImages} fotos
            </span>
          ` : ""}
        </div>

        <!-- Conteúdo do Card -->
        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <!-- Micro Tag de Fabricação 3D -->
            <div class="flex items-center gap-1.5 text-[10px] font-semibold text-stone-400 mb-1.5 uppercase tracking-wider">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>PLA Ecológico • Alta Fidelidade</span>
            </div>

            <!-- Nome do Produto -->
            <h3 
              class="font-serif font-bold text-pine-950 text-base leading-snug line-clamp-2 hover:text-pine-700 cursor-pointer transition-colors js-open-details"
              data-id="${product.id}"
              title="${product.nome}"
            >
              ${product.nome}
            </h3>

            <!-- Preço Formatado em BRL -->
            <p class="mt-2 text-xl font-black text-pine-800">
              ${formatBRL(product.preco)}
            </p>
          </div>

          <!-- Botão Adicionar ao Carrinho -->
          <button 
            type="button"
            class="mt-4 w-full py-2.5 px-4 rounded-xl bg-pine-900 hover:bg-pine-800 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all js-add-cart-btn group"
            data-id="${product.id}"
          >
            <svg class="w-4 h-4 text-gold-300 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
    `;
  }).join("");

  // Atrelar eventos aos elementos recém-renderizados
  attachProductCardEvents();
}

/**
 * Associa os listeners de evento aos cards de produto
 */
function attachProductCardEvents() {
  // Abertura de modal via foto ou nome
  document.querySelectorAll(".js-open-details").forEach(el => {
    el.addEventListener("click", () => {
      const prodId = el.getAttribute("data-id");
      openProductModal(prodId);
    });
  });

  // Botão Adicionar ao Carrinho
  document.querySelectorAll(".js-add-cart-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const prodId = btn.getAttribute("data-id");
      const product = AppState.products.find(p => p.id === prodId);
      if (product) {
        addToCart(product, 1);
      }
    });
  });
}

// ==============================================================================
// 7. MODAL DE DETALHES DO PRODUTO & CARROSSEL DE IMAGENS
// ==============================================================================

/**
 * Abre o Modal com os dados do produto e inicializa a galeria/carrossel
 * @param {string} productId
 */
function openProductModal(productId) {
  const product = AppState.products.find(p => p.id === productId);
  if (!product) return;

  AppState.modalProduct = product;
  AppState.activeImageIndex = 0;
  AppState.modalQuantity = 1;
  AppState.isProductModalOpen = true;

  const modal = document.getElementById("productModal");
  const modalName = document.getElementById("modalProductName");
  const modalPrice = document.getElementById("modalProductPrice");
  const modalDesc = document.getElementById("modalProductDescription");
  const modalQtyVal = document.getElementById("modalQtyValue");

  if (modalName) modalName.textContent = product.nome;
  if (modalPrice) modalPrice.textContent = formatBRL(product.preco);
  if (modalDesc) modalDesc.textContent = product.descricao || "Sem descrição disponível.";
  if (modalQtyVal) modalQtyVal.textContent = "1";

  // Atualizar carrossel de imagens
  updateCarouselView();

  if (modal) {
    modal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden"); // Bloqueia scroll de fundo
  }
}

/**
 * Fecha o modal de detalhes do produto
 */
function closeProductModal() {
  const modal = document.getElementById("productModal");
  if (modal) {
    modal.classList.add("hidden");
  }
  AppState.isProductModalOpen = false;
  AppState.modalProduct = null;
  if (!AppState.isCartOpen) {
    document.body.classList.remove("overflow-hidden");
  }
}

/**
 * Atualiza o visual do carrossel no modal de detalhes
 */
function updateCarouselView() {
  const product = AppState.modalProduct;
  if (!product) return;

  const images = (product.imagens && product.imagens.length > 0) ? product.imagens : [PLACEHOLDER_IMAGE];
  const total = images.length;
  const currentIdx = Math.max(0, Math.min(AppState.activeImageIndex, total - 1));
  AppState.activeImageIndex = currentIdx;

  const mainImg = document.getElementById("carouselMainImg");
  const badge = document.getElementById("carouselBadge");
  const prevBtn = document.getElementById("carouselPrevBtn");
  const nextBtn = document.getElementById("carouselNextBtn");
  const thumbnailsContainer = document.getElementById("carouselThumbnails");

  // Imagem Principal
  if (mainImg) {
    mainImg.src = images[currentIdx];
    mainImg.alt = `${product.nome} - Imagem ${currentIdx + 1}`;
    mainImg.onerror = () => { mainImg.src = PLACEHOLDER_IMAGE; };
  }

  // Indicador
  if (badge) {
    badge.textContent = `${currentIdx + 1} / ${total}`;
    badge.style.display = total > 1 ? "block" : "none";
  }

  // Controles de Navegação
  if (prevBtn) prevBtn.style.display = total > 1 ? "flex" : "none";
  if (nextBtn) nextBtn.style.display = total > 1 ? "flex" : "none";

  // Miniaturas
  if (thumbnailsContainer) {
    if (total <= 1) {
      thumbnailsContainer.innerHTML = "";
    } else {
      thumbnailsContainer.innerHTML = images.map((url, idx) => `
        <button 
          type="button"
          class="w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${idx === currentIdx ? "border-emerald-600 scale-95 shadow-md" : "border-transparent opacity-60 hover:opacity-100"}"
          onclick="selectCarouselImage(${idx})"
          aria-label="Ver imagem ${idx + 1}"
        >
          <img src="${url}" alt="Miniatura ${idx + 1}" class="w-full h-full object-cover" onerror="this.src='${PLACEHOLDER_IMAGE}';">
        </button>
      `).join("");
    }
  }
}

/**
 * Seleciona imagem diretamente pelas miniaturas
 * @param {number} index
 */
window.selectCarouselImage = function(index) {
  AppState.activeImageIndex = index;
  updateCarouselView();
};

/**
 * Navega para a imagem anterior
 */
function prevCarouselImage() {
  if (!AppState.modalProduct || !AppState.modalProduct.imagens) return;
  const total = AppState.modalProduct.imagens.length;
  AppState.activeImageIndex = (AppState.activeImageIndex - 1 + total) % total;
  updateCarouselView();
}

/**
 * Navega para a próxima imagem
 */
function nextCarouselImage() {
  if (!AppState.modalProduct || !AppState.modalProduct.imagens) return;
  const total = AppState.modalProduct.imagens.length;
  AppState.activeImageIndex = (AppState.activeImageIndex + 1) % total;
  updateCarouselView();
}

// ==============================================================================
// 8. MODAL DO CARRINHO DE COMPRAS
// ==============================================================================

/**
 * Abre o Modal do Carrinho
 */
function openCartModal() {
  AppState.isCartOpen = true;
  renderCartModal();

  const modal = document.getElementById("cartModal");
  if (modal) {
    modal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  }
}

/**
 * Fecha o Modal do Carrinho
 */
function closeCartModal() {
  AppState.isCartOpen = false;
  const modal = document.getElementById("cartModal");
  if (modal) {
    modal.classList.add("hidden");
  }
  if (!AppState.isProductModalOpen) {
    document.body.classList.remove("overflow-hidden");
  }
}

/**
 * Renderiza o conteúdo do modal do carrinho
 */
function renderCartModal() {
  const container = document.getElementById("cartItemsList");
  const emptyView = document.getElementById("emptyCartView");
  const footer = document.getElementById("cartFooter");
  const subtotalEl = document.getElementById("cartSubtotalValue");
  const totalEl = document.getElementById("cartTotalValue");

  if (!container) return;

  if (AppState.cart.length === 0) {
    container.innerHTML = "";
    container.classList.add("hidden");
    if (emptyView) emptyView.classList.remove("hidden");
    if (footer) footer.classList.add("hidden");
    return;
  }

  if (emptyView) emptyView.classList.add("hidden");
  if (footer) footer.classList.remove("hidden");
  container.classList.remove("hidden");

  // Renderizar itens
  container.innerHTML = AppState.cart.map(item => {
    const itemTotal = item.product.preco * item.quantity;
    const itemImage = (item.product.imagens && item.product.imagens.length > 0) 
      ? item.product.imagens[0] 
      : (item.product.imagem || PLACEHOLDER_IMAGE);

    return `
      <div class="py-4 flex gap-4 items-center justify-between">
        <!-- Foto miniatura -->
        <img 
          src="${itemImage}" 
          alt="${item.product.nome}" 
          class="w-16 h-16 rounded-xl object-cover bg-warm-100 border border-stone-200 flex-shrink-0"
          onerror="this.src='${PLACEHOLDER_IMAGE}';"
        >

        <!-- Informações e Quantidade -->
        <div class="flex-1 min-w-0">
          <h4 class="font-serif text-sm font-bold text-pine-950 truncate" title="${item.product.nome}">
            ${item.product.nome}
          </h4>
          <p class="text-xs text-stone-500 mt-0.5">
            ${formatBRL(item.product.preco)} cada
          </p>

          <!-- Controles de Quantidade -->
          <div class="flex items-center gap-2 mt-2">
            <button 
              type="button"
              class="w-7 h-7 rounded-lg bg-warm-100 hover:bg-warm-200 text-stone-700 font-bold text-xs flex items-center justify-center transition-colors"
              onclick="updateCartItemQty('${item.product.id}', -1)"
              aria-label="Diminuir quantidade"
            >-</button>
            <span class="text-xs font-bold text-pine-900 w-5 text-center">${item.quantity}</span>
            <button 
              type="button"
              class="w-7 h-7 rounded-lg bg-warm-100 hover:bg-warm-200 text-stone-700 font-bold text-xs flex items-center justify-center transition-colors"
              onclick="updateCartItemQty('${item.product.id}', 1)"
              aria-label="Aumentar quantidade"
            >+</button>
          </div>
        </div>

        <!-- Preço e Botão Remover -->
        <div class="text-right flex flex-col items-end justify-between self-stretch">
          <button 
            type="button" 
            class="text-stone-400 hover:text-berry-600 transition-colors p-1"
            onclick="removeCartItem('${item.product.id}')"
            title="Remover produto"
            aria-label="Remover produto"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
          <span class="text-sm font-black text-pine-900">
            ${formatBRL(itemTotal)}
          </span>
        </div>
      </div>
    `;
  }).join("");

  // Atualizar totais
  const grandTotal = getCartTotal();
  if (subtotalEl) subtotalEl.textContent = formatBRL(grandTotal);
  if (totalEl) totalEl.textContent = formatBRL(grandTotal);
}

// Helpers globais para eventos inline do carrinho
window.updateCartItemQty = function(id, delta) {
  updateItemQuantity(id, delta);
};

window.removeCartItem = function(id) {
  removeFromCart(id);
};

// ==============================================================================
// 9. CHECKOUT VIA WHATSAPP (MENSAGEM ENCODADA)
// ==============================================================================

/**
 * Lê o estado do carrinho, monta a mensagem do pedido formatada
 * e redireciona o usuário para o link wa.me
 */
function checkoutViaWhatsApp() {
  if (AppState.cart.length === 0) {
    showToast("Seu carrinho está vazio!");
    return;
  }

  // 1. Limpeza do número de telefone (apenas números)
  const cleanPhone = WHATSAPP_PHONE_NUMBER.replace(/\D/g, "");

  // 2. Montagem dos itens do pedido
  const itensFormatados = AppState.cart.map(item => {
    const itemSubtotal = formatBRL(item.product.preco * item.quantity);
    return `• ${item.quantity}x ${item.product.nome} (${formatBRL(item.product.preco)}) = ${itemSubtotal}`;
  }).join("\n");

  const totalFormatado = formatBRL(getCartTotal());

  // 3. Montagem da mensagem final
  const mensagem = [
    "🎄 *Olá, Habittari! Gostaria de fazer o seguinte pedido de Natal:*",
    "",
    itensFormatados,
    "",
    `✨ *Total das Peças: ${totalFormatado}*`,
    "",
    "Poderia me informar as opções de frete, prazos de produção e entrega para o meu CEP?"
  ].join("\n");

  // 4. Codificação da URL
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensagem)}`;

  // 5. Redirecionamento
  window.open(whatsappUrl, "_blank");
}

// ==============================================================================
// 10. INICIALIZAÇÃO DE EVENTOS & CICLO DE VIDA (DOM READY)
// ==============================================================================

function setupEventListeners() {
  // 1. Botões de abertura do carrinho
  const cartHeaderBtn = document.getElementById("cartHeaderBtn");
  const cartFloatingBtn = document.getElementById("cartFloatingBtn");
  const closeCartBtn = document.getElementById("closeCartModalBtn");
  const continueShoppingBtn = document.getElementById("continueShoppingBtn");

  if (cartHeaderBtn) cartHeaderBtn.addEventListener("click", openCartModal);
  if (cartFloatingBtn) cartFloatingBtn.addEventListener("click", openCartModal);
  if (closeCartBtn) closeCartBtn.addEventListener("click", closeCartModal);
  if (continueShoppingBtn) continueShoppingBtn.addEventListener("click", closeCartModal);

  // 2. Fechamento de modal ao clicar no backdrop escuro
  const cartModal = document.getElementById("cartModal");
  if (cartModal) {
    cartModal.addEventListener("click", (e) => {
      if (e.target === cartModal) closeCartModal();
    });
  }

  const productModal = document.getElementById("productModal");
  if (productModal) {
    productModal.addEventListener("click", (e) => {
      if (e.target === productModal) closeProductModal();
    });
  }

  // 3. Botão de fechar modal de produto
  const closeProductModalBtn = document.getElementById("closeProductModalBtn");
  if (closeProductModalBtn) {
    closeProductModalBtn.addEventListener("click", closeProductModal);
  }

  // 4. Controles do Carrossel
  const carouselPrevBtn = document.getElementById("carouselPrevBtn");
  const carouselNextBtn = document.getElementById("carouselNextBtn");
  if (carouselPrevBtn) carouselPrevBtn.addEventListener("click", prevCarouselImage);
  if (carouselNextBtn) carouselNextBtn.addEventListener("click", nextCarouselImage);

  // 5. Quantidade dentro do modal de produto
  const modalQtyMinus = document.getElementById("modalQtyMinus");
  const modalQtyPlus = document.getElementById("modalQtyPlus");
  const modalQtyVal = document.getElementById("modalQtyValue");
  const modalAddToCartBtn = document.getElementById("modalAddToCartBtn");

  if (modalQtyMinus) {
    modalQtyMinus.addEventListener("click", () => {
      if (AppState.modalQuantity > 1) {
        AppState.modalQuantity--;
        if (modalQtyVal) modalQtyVal.textContent = AppState.modalQuantity;
      }
    });
  }

  if (modalQtyPlus) {
    modalQtyPlus.addEventListener("click", () => {
      AppState.modalQuantity++;
      if (modalQtyVal) modalQtyVal.textContent = AppState.modalQuantity;
    });
  }

  if (modalAddToCartBtn) {
    modalAddToCartBtn.addEventListener("click", () => {
      if (AppState.modalProduct) {
        addToCart(AppState.modalProduct, AppState.modalQuantity);
        closeProductModal();
      }
    });
  }

  // 6. Botão de Checkout via WhatsApp
  const whatsappBtn = document.getElementById("whatsappCheckoutBtn");
  if (whatsappBtn) {
    whatsappBtn.addEventListener("click", checkoutViaWhatsApp);
  }

  // 7. Campo de Busca (Desktop & Mobile)
  const searchInput = document.getElementById("searchInput");
  const searchMobileInput = document.getElementById("searchMobileInput");
  const resetSearchBtn = document.getElementById("resetSearchBtn");

  const handleSearch = (val) => {
    AppState.searchQuery = val.trim();
    if (searchInput) searchInput.value = val;
    if (searchMobileInput) searchMobileInput.value = val;
    renderProducts();
  };

  if (searchInput) {
    searchInput.addEventListener("input", (e) => handleSearch(e.target.value));
  }
  if (searchMobileInput) {
    searchMobileInput.addEventListener("input", (e) => handleSearch(e.target.value));
  }
  if (resetSearchBtn) {
    resetSearchBtn.addEventListener("click", () => {
      handleSearch("");
      AppState.selectedCategory = "all";
      renderCategoryFilters();
      renderProducts();
    });
  }

  // 9. Seletor de Ordenação
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      AppState.sortBy = e.target.value;
      renderProducts();
    });
  }

  // 10. Botão de Tentar Novamente no Erro
  const retryBtn = document.getElementById("retryBtn");
  if (retryBtn) {
    retryBtn.addEventListener("click", loadProductsData);
  }

  // 11. Atalhos de Teclado (ESC fecha modais, Setas navegam fotos)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (AppState.isProductModalOpen) closeProductModal();
      if (AppState.isCartOpen) closeCartModal();
    } else if (AppState.isProductModalOpen) {
      if (e.key === "ArrowLeft") prevCarouselImage();
      if (e.key === "ArrowRight") nextCarouselImage();
    }
  });

  // 12. Ano atual no rodapé
  const yearEl = document.getElementById("currentYear");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

// ==============================================================================
// 11. SISTEMA MULTI-MODO DE NEVE (CANVAS DINÂMICO & OTIMIZADO)
// Modos: Suave ➔ Intensa ➔ Tempestade ➔ Desligada
// ==============================================================================

const SNOW_PRESETS = {
  suave: {
    id: "suave",
    icon: "❄️",
    label: "Neve: Suave",
    title: "Modo Atual: Neve Suave (delicada). Clique para alternar para Neve Intensa.",
    desktopCount: 45,
    mobileCount: 24,
    speedMin: 0.5,
    speedMax: 1.2,
    wind: 0.1,
    swing: 0.4,
    radiusMin: 0.8,
    radiusMax: 2.2,
    opacityMin: 0.2,
    opacityMax: 0.55,
    canvasOpacity: "0.7"
  },
  intensa: {
    id: "intensa",
    icon: "❄️",
    label: "Neve: Intensa",
    title: "Modo Atual: Neve Intensa. Clique para alternar para Tempestade.",
    desktopCount: 130,
    mobileCount: 65,
    speedMin: 0.9,
    speedMax: 2.3,
    wind: 0.4,
    swing: 0.7,
    radiusMin: 1.0,
    radiusMax: 3.2,
    opacityMin: 0.3,
    opacityMax: 0.75,
    canvasOpacity: "0.85"
  },
  tempestade: {
    id: "tempestade",
    icon: "🌨️",
    label: "Tempestade de Neve",
    title: "Modo Atual: Tempestade de Neve. Clique para desativar o efeito.",
    desktopCount: 260,
    mobileCount: 120,
    speedMin: 2.0,
    speedMax: 4.8,
    wind: 1.8,
    swing: 0.9,
    radiusMin: 1.2,
    radiusMax: 4.5,
    opacityMin: 0.35,
    opacityMax: 0.9,
    canvasOpacity: "0.95"
  },
  desligada: {
    id: "desligada",
    icon: "⏸️",
    label: "Neve: Desligada",
    title: "Neve desativada. Clique para reativar em modo Suave.",
    desktopCount: 0,
    mobileCount: 0,
    speedMin: 0,
    speedMax: 0,
    wind: 0,
    swing: 0,
    radiusMin: 0,
    radiusMax: 0,
    opacityMin: 0,
    opacityMax: 0,
    canvasOpacity: "0"
  }
};

const SNOW_MODE_ORDER = ["intensa", "tempestade", "desligada", "suave"];

function initSnowEffect() {
  const canvas = document.getElementById("snowCanvas");
  const toggleBtn = document.getElementById("toggleSnowBtn");
  const statusText = document.getElementById("snowStatusText");
  const snowIcon = document.getElementById("snowIcon");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  // Recuperar preferência salva ou iniciar no padrão "intensa"
  const savedMode = localStorage.getItem("habittari_snow_mode");
  const legacyEnabled = localStorage.getItem("habittari_snow_enabled");
  let currentMode = "intensa";

  if (savedMode && SNOW_PRESETS[savedMode]) {
    currentMode = savedMode;
  } else if (legacyEnabled === "false") {
    currentMode = "desligada";
  }

  const flakes = [];

  function createFlake(preset, isInitial = false) {
    const radius = Math.random() * (preset.radiusMax - preset.radiusMin) + preset.radiusMin;
    const speedY = Math.random() * (preset.speedMax - preset.speedMin) + preset.speedMin;
    const opacity = Math.random() * (preset.opacityMax - preset.opacityMin) + preset.opacityMin;

    return {
      x: Math.random() * (width + 100) - 50,
      y: isInitial ? Math.random() * height : -10,
      radius,
      speedY,
      swing: preset.swing,
      angle: Math.random() * Math.PI * 2,
      angleSpeed: Math.random() * 0.03 + 0.015,
      opacity
    };
  }

  function applyMode(modeKey) {
    currentMode = modeKey;
    const preset = SNOW_PRESETS[modeKey];
    if (!preset) return;

    localStorage.setItem("habittari_snow_mode", modeKey);

    if (snowIcon) snowIcon.textContent = preset.icon;
    if (statusText) statusText.textContent = preset.label;
    if (toggleBtn) toggleBtn.title = preset.title;

    canvas.style.opacity = preset.canvasOpacity;

    if (modeKey === "desligada") {
      canvas.classList.add("snow-disabled");
      flakes.length = 0;
    } else {
      canvas.classList.remove("snow-disabled");
      const count = window.innerWidth < 640 ? preset.mobileCount : preset.desktopCount;
      flakes.length = 0;
      for (let i = 0; i < count; i++) {
        flakes.push(createFlake(preset, true));
      }
    }
  }

  applyMode(currentMode);

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const currentIndex = SNOW_MODE_ORDER.indexOf(currentMode);
      const nextIndex = (currentIndex + 1) % SNOW_MODE_ORDER.length;
      applyMode(SNOW_MODE_ORDER[nextIndex]);
    });
  }

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    if (currentMode !== "desligada") {
      applyMode(currentMode);
    }
  });

  function render() {
    ctx.clearRect(0, 0, width, height);

    if (currentMode !== "desligada" && flakes.length > 0) {
      const preset = SNOW_PRESETS[currentMode];
      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        f.angle += f.angleSpeed;
        f.y += f.speedY;
        f.x += Math.sin(f.angle) * f.swing + preset.wind;

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${f.opacity})`;

        // Efeito de desfoque sutil nos flocos maiores para profundidade
        if (f.radius > 3.0) {
          ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
          ctx.shadowBlur = 4;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fill();

        // Reposicionar quando sair da tela
        if (f.y > height + 10) {
          f.y = -10;
          f.x = Math.random() * (width + 60) - 30;
        }
        if (f.x > width + 30) {
          f.x = -20;
        } else if (f.x < -30) {
          f.x = width + 20;
        }
      }
    }

    requestAnimationFrame(render);
  }

  render();
}

// ==============================================================================
// 12. BOOTSTRAP DA APLICAÇÃO
// ==============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // 1. Inicializar efeito sutil de neve
  initSnowEffect();

  // 2. Registrar event listeners
  setupEventListeners();

  // 3. Carregar carrinho persistido no LocalStorage
  loadCartFromStorage();

  // 4. Inicializar catálogo de produtos
  loadProductsData();
});
