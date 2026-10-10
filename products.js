/**
 * ==============================================================================
 * HABITTARI - CADASTRO DE PRODUTOS
 * ==============================================================================
 * Edite, adicione ou remova produtos diretamente nesta lista.
 * 
 * Estrutura de cada produto:
 * - id: Identificador único (ex: "prod-1")
 * - nome: Nome do produto
 * - categoria: Categoria do item (ex: "Móveis", "Iluminação", "Decoração", "Têxtil")
 * - preco: Valor numérico em reais (ex: 1290.00 ou 450.50)
 * - descricao: Descrição detalhada, materiais, dimensões e cuidados
 * - imagens: Lista de URLs das fotos (a 1ª foto é exibida na capa; todas aparecem no modal)
 * ==============================================================================
 */

const PRODUCTS = [
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
  },
  {
    id: "prod-1",
    nome: "Poltrona Nórdica Bouclé",
    categoria: "Móveis",
    preco: 1290.00,
    descricao: "Design escandinavo com revestimento em tecido bouclé de alta gramatura e toque aveludado. Estrutura interna em madeira de reflorestamento e pés angulados em carvalho maciço com acabamento natural.\n\n• Dimensões: 78cm (L) x 82cm (P) x 75cm (A)\n• Suporta até: 140 kg\n• Acabamento: Bouclé Off-white e Carvalho Natural",
    imagens: [
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1580481077195-c22ae0062a4b?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: "prod-2",
    nome: "Sofá Orgânico Curvo 3 Lugares",
    categoria: "Móveis",
    preco: 3890.00,
    descricao: "Linhas sinuosas inspiradas na arquitetura biomórfica. Estofamento em espuma D-33 com molas ensacadas para máxima ergonomia. Revestido em linho cru impermeabilizado.\n\n• Dimensões: 230cm (L) x 95cm (P) x 80cm (A)\n• Assentos: 3 lugares confortáveis\n• Acompanha 2 almofadas cilíndricas decorativas",
    imagens: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: "prod-3",
    nome: "Mesa de Centro em Mármore & Carbono",
    categoria: "Móveis",
    preco: 840.50,
    descricao: "Estrutura geométrica contemporânea em aço carbono com pintura eletrostática preta fosca texturizada. Tampo nobre em mármore sintético branco carrara com bordas bisotadas.\n\n• Dimensões: 90cm diâmetro x 38cm (A)\n• Tampo resistente a riscos e manchas\n• Base com sapatas niveladoras anti-risco",
    imagens: [
      "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: "prod-4",
    nome: "Cadeira de Jantar em Palhinha Natural",
    categoria: "Móveis",
    preco: 580.00,
    descricao: "Elegância clássica com releitura moderna. Encosto em palha sextavada natural (estilo Rattan) com excelente ventilação, e assento estofado em linho cinza claro.\n\n• Dimensões: 48cm (L) x 52cm (P) x 84cm (A)\n• Altura até o assento: 46 cm\n• Madeira maciça de tauari com verniz fosco",
    imagens: [
      "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1580481077195-c22ae0062a4b?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: "prod-5",
    nome: "Luminária de Piso Industrial Arco",
    categoria: "Iluminação",
    preco: 499.90,
    descricao: "Luminária articulada contemporânea com base sólida e estável em pedra sabão. Haste curvada em aço escovado e cúpula ajustável em latão fosco.\n\n• Altura total: 180cm | Alcance do arco: 90cm\n• Soquete: E27 (compatível com lâmpadas inteligentes ou filamento LED)\n• Acionamento por interruptor de pedal",
    imagens: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: "prod-6",
    nome: "Pendente Jabuticaba em Latão Escovado",
    categoria: "Iluminação",
    preco: 720.00,
    descricao: "Pendente moderno com 5 globos de vidro leitoso branco e haste linear em latão escovado. Proporciona luz difusa, suave e acolhedora sobre mesas de jantar ou ilhas gourmet.\n\n• Comprimento da haste: 110cm\n• Cabo de sustentação ajustável até 1,50m\n• Inclui 5 lâmpadas G9 LED branco quente (2700K)",
    imagens: [
      "https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: "prod-7",
    nome: "Abajur Contemporâneo em Cerâmica",
    categoria: "Iluminação",
    preco: 260.00,
    descricao: "Base modelada artesanalmente em cerâmica fosca com acabamento texturizado tom areia. Cúpula cilíndrica em tecido algodão cru para iluminação indireta relaxante.\n\n• Altura: 42cm | Diâmetro da cúpula: 25cm\n• Cabo revestido em tecido trançado (1,80m)",
    imagens: [
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: "prod-8",
    nome: "Espelho Orgânico Moldura Carvalho",
    categoria: "Decoração",
    preco: 620.00,
    descricao: "Espelho lapidado com formato assimétrico fluido que valoriza halls, lavabos e quartos. Moldura delicada em lâmina de madeira nobre carvalho com corte a laser.\n\n• Dimensões: 100cm (A) x 60cm (L)\n• Vidro cristal de 4mm com película de segurança\n• Suporte duplo para instalação na horizontal ou vertical",
    imagens: [
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: "prod-9",
    nome: "Vaso de Cerâmica Terracota Artesanal",
    categoria: "Decoração",
    preco: 145.00,
    descricao: "Peça modelada individualmente em torno manual utilizando argila terracota pura. Impermeabilização interna para uso com água ou arranjos secos como capim dos pampas e eucalipto.\n\n• Dimensões: 26cm (A) x 18cm (diâmetro)\n• Acabamento: Poroso natural com textura tátil",
    imagens: [
      "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: "prod-10",
    nome: "Manta 100% Algodão com Franjas",
    categoria: "Têxtil",
    preco: 189.90,
    descricao: "Trama em tear manual tradicional com fios de algodão orgânico selecionados. Toque macio que não pinica, com franjas artesanais amarradas uma a uma.\n\n• Medidas: 140cm x 180cm\n• Cor: Cru com detalhes em cinza chumbo\n• Lavável em máquina no ciclo delicado",
    imagens: [
      "https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: "prod-11",
    nome: "Tapete Geométrico em Tear Manual",
    categoria: "Têxtil",
    preco: 950.00,
    descricao: "Tapete artesanal confeccionado em lã natural e algodão. Padrão geométrico étnico neutro que harmoniza com ambientes rústicos, industriais ou contemporâneos.\n\n• Medidas: 200cm x 150cm\n• Espessura: 10mm (conforto térmico e acústico)\n• Base com aplicação antiderrapante",
    imagens: [
      "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: "prod-12",
    nome: "Mesa de Cabeceira Ripada em Freijó",
    categoria: "Móveis",
    preco: 690.00,
    descricao: "Gaveteiro suspenso ou com pés cônicos em madeira nobre Freijó. Frente da gaveta com detalhe ripado em relevo e corrediças telescópicas de extração total.\n\n• Dimensões: 50cm (L) x 40cm (P) x 55cm (A)\n• Puxador usinado em cava invisível\n• Nicho superior aberto para livros e aparelhos",
    imagens: [
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=1000&q=80"
    ]
  }
];
