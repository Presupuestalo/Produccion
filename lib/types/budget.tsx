export interface Budget {
  id: string
  project_id: string
  user_id: string
  version_number: number
  name: string
  description?: string
  is_original: boolean
  parent_budget_id?: string
  status: "draft" | "sent" | "approved" | "rejected"
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  notes?: string
  custom_introduction_text?: string | null
  custom_additional_notes?: string | null
  accepted_at?: string | null
  accepted_amount_without_vat?: number | null
  accepted_amount_with_vat?: number | null
  accepted_vat_rate?: number | null
  accepted_vat_amount?: number | null
  accepted_includes_vat?: boolean | null
  created_at: string
  updated_at: string
}

export interface BudgetLineItem {
  id: string
  budget_id: string
  category: string
  concept_code?: string // Código del precio desde price_master (ej: "01-D-01")
  concept: string // Concepto/subcategory desde price_master
  description: string // Descripción completa desde price_master
  color?: string // Color del producto/material
  brand?: string // Marca del producto/material
  model?: string // Modelo del producto/material
  unit: string
  quantity: number
  unit_price: number // Solo precio final, sin desglose
  total_price: number
  is_custom: boolean
  sort_order: number
  base_price_id?: string // Referencia UUID a price_master.id
  price_type?: "master" | "custom" | "imported" // Tipo de origen del precio
  created_at: string
  updated_at: string
}

export interface BudgetWithLineItems extends Budget {
  line_items: BudgetLineItem[]
}

export interface BudgetCategory {
  category: string
  items: BudgetLineItem[]
  subtotal: number
}

export interface BudgetSummary {
  categories: BudgetCategory[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
}

// Catálogo de precios base (del archivo proporcionado)
export interface PriceCatalogItem {
  id: string
  category: string
  concept: string
  description: string
  unit: string
  base_price: number
}

export const PRICE_CATALOG: PriceCatalogItem[] = [
  // 01. DERRIBOS
  {
    id: "01-D-01",
    category: "01. DERRIBOS",
    concept: "TABIQUES DERRIBO",
    description: "Tirar tabique existente, incluyendo mano de obra y desescombro a punto autorizado.",
    unit: "m²",
    base_price: 17.28,
  },
  {
    id: "01-D-02",
    category: "01. DERRIBOS",
    concept: "PICADO ALICATADO PAREDES",
    description:
      "Picado de paredes para la retirada del alicatado o revestimiento cerámico existente en parámetros verticales.",
    unit: "m²",
    base_price: 14.4,
  },
  {
    id: "01-D-03",
    category: "01. DERRIBOS",
    concept: "PICADO SUELOS",
    description: "Picado de suelo y posterior desescombro.",
    unit: "m²",
    base_price: 21.17,
  },
  {
    id: "01-D-04",
    category: "01. DERRIBOS",
    concept: "RETIRADA DE FALSO TECHO",
    description: "Retirada y desescombro de falso techo de escayola o placa de yeso laminado.",
    unit: "m²",
    base_price: 14.4,
  },
  {
    id: "01-D-05",
    category: "01. DERRIBOS",
    concept: "RETIRADA DE MOLDURAS",
    description: "Retirada de molduras de escayola o madera en el perímetro de techos.",
    unit: "ml",
    base_price: 1.44,
  },
  {
    id: "01-D-06",
    category: "01. DERRIBOS",
    concept: "RETIRADA DE TARIMA MADERA Y RASTRELES",
    description: "Desmontaje de tarima flotante o suelo de madera incluyendo los rastreles inferiores.",
    unit: "m²",
    base_price: 8.64,
  },
  {
    id: "01-D-07",
    category: "01. DERRIBOS",
    concept: "RETIRADA DE RODAPIE DE MADERA",
    description: "Retirada de rodapié de madera y acopio para desescombro.",
    unit: "ml",
    base_price: 2.59,
  },
  {
    id: "01-D-08",
    category: "01. DERRIBOS",
    concept: "RETIRADA DE RODAPIE CERÁMICO",
    description: "Retirada de rodapié cerámico o de azulejo.",
    unit: "ml",
    base_price: 5.62,
  },
  {
    id: "01-D-09",
    category: "01. DERRIBOS",
    concept: "CONTENEDOR DESESCOMBRO",
    description: "Suministro, colocación y retirada de contenedor de residuos de obra a vertedero autorizado.",
    unit: "Ud",
    base_price: 504,
  },
  {
    id: "01-D-10",
    category: "01. DERRIBOS",
    concept: "HR BAJADA DE ESCOMBROS",
    description: "Mano de obra por hora dedicada al acarreo y bajada de escombros.",
    unit: "H",
    base_price: 18,
  },
  {
    id: "01-D-12",
    category: "01. DERRIBOS",
    concept: "DESMONTAJE HOJAS PUERTAS Y RETIRADA",
    description: "Desmontaje de hoja de puerta existente y posterior retirada.",
    unit: "Ud",
    base_price: 28.8,
  },
  {
    id: "01-D-13",
    category: "01. DERRIBOS",
    concept: "PREPARACIÓN PAREDES (Gotelé/Papel)",
    description: "Rascado de paredes para eliminación de gotelé, papel pintado o materiales blandos.",
    unit: "m²",
    base_price: 3.6,
  },
  {
    id: "01-D-14",
    category: "01. DERRIBOS",
    concept: "RETIRADA ELEMENTOS BAÑO (Sanitarios)",
    description: "Desmontaje y retirada de inodoro, bidé, lavabo o bañera.",
    unit: "Ud",
    base_price: 172.8,
  },
  {
    id: "01-D-15",
    category: "01. DERRIBOS",
    concept: "RETIRADA DE MOBILIARIO COCINA",
    description: "Desmontaje de muebles altos y bajos de cocina existentes.",
    unit: "Ud",
    base_price: 345.6,
  },
  {
    id: "01-D-16",
    category: "01. DERRIBOS",
    concept: "RETIRADA DE ARMARIOS Y RESTO MOBILIARIO",
    description: "Desmontaje de armarios empotrados o mobiliario fijo a medida.",
    unit: "Ud",
    base_price: 515.52,
  },
  {
    id: "01-D-18",
    category: "01. DERRIBOS",
    concept: "RETIRAR CALDERA",
    description: "Retirada de caldera de gas o gasoil existente",
    unit: "Ud",
    base_price: 74.75,
  },
  {
    id: "01-D-19",
    category: "01. DERRIBOS",
    concept: "RETIRAR TERMO ELÉCTRICO",
    description: "Retirada de termo eléctrico existente",
    unit: "Ud",
    base_price: 51.75,
  },
  {
    id: "01-D-20",
    category: "01. DERRIBOS",
    concept: "RETIRADA DE RADIADORES",
    description: "Desmontaje y retirada de radiadores de agua existentes.",
    unit: "Ud",
    base_price: 15.15,
  },

  // 02. ALBAÑILERÍA
  {
    id: "02-A-01",
    category: "02. ALBAÑILERÍA",
    concept: "FORMACIÓN SOLERA MORTERO Y ARLITA",
    description: "Formación de solera de mortero para nivelación y aislamiento (espesor no superior a 7cm).",
    unit: "m²",
    base_price: 44.64,
  },
  {
    id: "02-A-02",
    category: "02. ALBAÑILERÍA",
    concept: "CAPA AUTONIVELANTE (<= 15MM)",
    description: "Aplicación de mortero autonivelante de bajo espesor.",
    unit: "m²",
    base_price: 37.44,
  },
  {
    id: "02-A-03",
    category: "02. ALBAÑILERÍA",
    concept: "FORMACIÓN DE TRASDOSADO EN PLACA DE YESO LAMINADO (13+45)",
    description: "Colocación de una capa de placa de yeso laminado de 13mm sobre perfilería.",
    unit: "m²",
    base_price: 59.04,
  },
  {
    id: "02-A-04",
    category: "02. ALBAÑILERÍA",
    concept: "FORMACIÓN TABIQUE LADRILLO",
    description: "Levantamiento de tabique de ladrillo de pequeño formato (rasilla o hueco doble).",
    unit: "m²",
    base_price: 36,
  },
  {
    id: "02-A-05",
    category: "02. ALBAÑILERÍA",
    concept: "TABIQUES PLACA DE YESO LAMINADO DOBLE CARA (13x45x13)",
    description:
      "Levantamiento de tabique con doble placa de yeso laminado de 13mm en ambas caras y aislamiento interior.",
    unit: "m²",
    base_price: 66.96,
  },
  {
    id: "02-A-06",
    category: "02. ALBAÑILERÍA",
    concept: "ALICATADOS PARED (Colocación MO)",
    description:
      "Mano de obra de colocación de azulejos o revestimiento cerámico en paredes (No incluye material cerámico).",
    unit: "m²",
    base_price: 44.64,
  },
  {
    id: "02-A-07",
    category: "02. ALBAÑILERÍA",
    concept: "EMBALDOSADO SUELOS (Colocación MO)",
    description:
      "Mano de obra de colocación de baldosas cerámicas o porcelánicas en suelos (No incluye material cerámico).",
    unit: "m²",
    base_price: 49.68,
  },
  {
    id: "02-A-08",
    category: "02. ALBAÑILERÍA",
    concept: "EMBALDOSADO SUELO RADIANTE (Colocación MO)",
    description: "Mano de obra de colocación de baldosas sobre suelo radiante (Requiere mortero y juntas específicos).",
    unit: "m²",
    base_price: 50.4,
  },
  {
    id: "02-A-09",
    category: "02. ALBAÑILERÍA",
    concept: "RASEO PREVIO ALICATADOS DE PARED",
    description: "Raseo de las paredes para obtener una base lisa y plomada antes de alicatar.",
    unit: "m²",
    base_price: 21.6,
  },
  {
    id: "02-A-10",
    category: "02. ALBAÑILERÍA",
    concept: "RASEO PREVIO EMBALDOSADOS SUELO",
    description: "Raseo del suelo para obtener una base lisa antes de embaldosar.",
    unit: "m²",
    base_price: 21.6,
  },
  {
    id: "02-A-11",
    category: "02. ALBAÑILERÍA",
    concept: "LUCIDO PAREDES (Yeso o perliescayola)",
    description: "Aplicación de capa de yeso o perlita en techos y paredes.",
    unit: "m²",
    base_price: 20.74,
  },
  {
    id: "02-A-12",
    category: "02. ALBAÑILERÍA",
    concept: "UNIDAD TAPADO DE ROZAS INSTALACIONES",
    description:
      "Relleno y tapado de todas las rozas realizadas para el paso de instalaciones de fontanería y electricidad.",
    unit: "Ud",
    base_price: 576,
  },
  {
    id: "02-A-13",
    category: "02. ALBAÑILERÍA",
    concept: "COLOCACIÓN DE MOLDURAS",
    description: "Suministro y colocación de moldura de escayola.",
    unit: "ml",
    base_price: 21.6,
  },
  {
    id: "02-A-14",
    category: "02. ALBAÑILERÍA",
    concept: "COLOCACIÓN CAJETÍN PUERTA CORREDERA (Armazón)",
    description: "Instalación y raseo del armazón metálico para puerta corredera.",
    unit: "Ud",
    base_price: 273.6,
  },
  {
    id: "02-A-15",
    category: "02. ALBAÑILERÍA",
    concept: "AYUDA A GREMIOS (Limpieza, acopio, transporte)",
    description: "Asistencia de albañilería a fontaneros, electricistas o carpinteros.",
    unit: "Ud",
    base_price: 432,
  },
  {
    id: "02-A-16",
    category: "02. ALBAÑILERÍA",
    concept: "BAJADO DE TECHOS (Placa de yeso laminado BA 15)",
    description: "Instalación de falso techo en placa de yeso laminado.",
    unit: "m²",
    base_price: 38.76,
  },
  {
    id: "02-A-17",
    category: "02. ALBAÑILERÍA",
    concept: "AISLANTES TÉRMICOS (Algodón regenerado)",
    description: "Suministro y colocación de aislamiento térmico o acústico.",
    unit: "m²",
    base_price: 19,
  },
  {
    id: "02-A-20",
    category: "02. ALBAÑILERÍA",
    concept: "FIJACIÓN DE EMISOR TÉRMICO",
    description:
      "Mano de obra para la fijación física a la pared (marcar, taladrar, colocar soportes y colgar) de un radiador eléctrico. Excluye la conexión eléctrica y el suministro del aparato",
    unit: "Ud",
    base_price: 37.95,
  },

  // 03. TABIQUES
  {
    id: "03-T-01",
    category: "03. TABIQUES",
    concept: "FORMACIÓN DE TRASDOSADO EN PLACA DE YESO LAMINADO (13+45)",
    description: "Colocación de una capa de placa de yeso laminado de 13mm sobre perfilería.",
    unit: "m²",
    base_price: 59.04,
  },
  {
    id: "03-T-02",
    category: "03. TABIQUES",
    concept: "FORMACIÓN TABIQUE LADRILLO",
    description: "Levantamiento de tabique de ladrillo de pequeño formato (rasilla o hueco doble).",
    unit: "m²",
    base_price: 36,
  },
  {
    id: "03-T-03",
    category: "03. TABIQUES",
    concept: "TABIQUES PLACA DE YESO LAMINADO DOBLE CARA (13x45x13)",
    description:
      "Levantamiento de tabique con doble placa de yeso laminado de 13mm en ambas caras y aislamiento interior.",
    unit: "m²",
    base_price: 66.96,
  },

  // 04. FONTANERÍA
  {
    id: "04-F-01",
    category: "04. FONTANERÍA",
    concept: "RED DE BAÑO (Puntos de consumo: Inodoro, Lavabo, etc.)",
    description: "Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) del baño.",
    unit: "Ud",
    base_price: 950.4,
  },
  {
    id: "04-F-02",
    category: "04. FONTANERÍA",
    concept: "RED DE COCINA (Puntos de consumo: Fregadero, L. etc.)",
    description: "Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) de la cocina.",
    unit: "Ud",
    base_price: 662.4,
  },
  {
    id: "04-F-03",
    category: "04. FONTANERÍA",
    concept: "RETIRADA BAJANTE FECALES Y COLOCACIÓN PVC-110MM",
    description: "Sustitución de tramo de bajante.",
    unit: "Ud",
    base_price: 309.6,
  },
  {
    id: "04-F-030",
    category: "04. FONTANERÍA",
    concept: "RETIRADA BAJANTE FECALES Y COLOCACIÓN PVC-110MM",
    description: "Sustitución de tramo de bajante.",
    unit: "Ud",
    base_price: 309.6,
  },
  {
    id: "04-F-04",
    category: "04. FONTANERÍA",
    concept: "SUMINISTRO Y COLOCACIÓN CONDUCTO EXTRACCIÓN BAÑO",
    description: "Colocación de conducto para extractor de ventilación en baño.",
    unit: "Ud",
    base_price: 164.16,
  },
  {
    id: "04-F-05",
    category: "04. FONTANERÍA",
    concept: "SUMINISTRO Y COLOCACIÓN CONDUCTO CAMPANA EXTRACTORA",
    description: "Colocación de conducto para campana extractora de humos.",
    unit: "Ud",
    base_price: 259.2,
  },
  {
    id: "04-F-06",
    category: "04. FONTANERÍA",
    concept: "INSTALACIÓN INODORO (Montaje MO)",
    description: "Montaje e instalación del inodoro.",
    unit: "Ud",
    base_price: 72,
  },
  {
    id: "04-F-07",
    category: "04. FONTANERÍA",
    concept: "COLOCACIÓN PLATO DE DUCHA (Montaje MO)",
    description: "Instalación y sellado del plato de ducha.",
    unit: "Ud",
    base_price: 144,
  },
  {
    id: "04-F-08",
    category: "04. FONTANERÍA",
    concept: "INSTALACIÓN MUEBLE LAVABO (Montaje MO)",
    description: "Instalación de mueble y lavabo, incluyendo espejo y aplique.",
    unit: "Ud",
    base_price: 129.6,
  },
  {
    id: "04-F-09",
    category: "04. FONTANERÍA",
    concept: "INSTALACIÓN MAMPARA (Montaje MO)",
    description: "Montaje de mampara de ducha o bañera.",
    unit: "Ud",
    base_price: 136.8,
  },
  {
    id: "04-F-10",
    category: "04. FONTANERÍA",
    concept: "INSTALACIÓN GRIFO DUCHA (Montaje MO)",
    description: "Montaje de monomando o termostática de ducha.",
    unit: "Ud",
    base_price: 72,
  },
  {
    id: "04-F-11",
    category: "04. FONTANERÍA",
    concept: "INSTALACIÓN GRIFO LAVABO (Montaje MO)",
    description: "Montaje de monomando de lavabo.",
    unit: "Ud",
    base_price: 72,
  },
  {
    id: "04-F-12",
    category: "04. FONTANERÍA",
    concept: "MONTAJE FREGADERO, LAVADORA Y LAVAVAJILLAS (MO)",
    description: "Instalación y conexionado de electrodomésticos de agua.",
    unit: "Ud",
    base_price: 93.6,
  },
  {
    id: "04-F-13",
    category: "04. FONTANERÍA",
    concept: "MONTAJE Y COLOCACIÓN CAMPANA EXTRACTORA COCINA (MO)",
    description: "Instalación de campana extractora en cocina.",
    unit: "Ud",
    base_price: 72,
  },

  // 05. CARPINTERÍA
  {
    id: "05-C-01",
    category: "05. CARPINTERÍA",
    concept: "NIVELACIÓN DE SUELOS CON TABLERO Y RASTREL",
    description: "Colocación de tablero sobre rastreles para nivelar un suelo antes de instalar tarima.",
    unit: "m²",
    base_price: 50.4,
  },
  {
    id: "05-C-02",
    category: "05. CARPINTERÍA",
    concept: "INSTALACIÓN PARQUET FLOTANTE (MO)",
    description: "Mano de obra de colocación de tarima flotante o suelo laminado.",
    unit: "m²",
    base_price: 20.88,
  },
  {
    id: "05-C-03",
    category: "05. CARPINTERÍA",
    concept: "INSTALACIÓN SUELO VINÍLICO (MO)",
    description: 'Mano de obra de colocación de suelo de vinilo tipo "click".',
    unit: "m²",
    base_price: 27.36,
  },
  {
    id: "05-C-19",
    category: "05. CARPINTERÍA",
    concept: "INSTALACIÓN SUELO LAMINADO (MO)",
    description: "Mano de obra de colocación de suelo laminado tipo click.",
    unit: "m²",
    base_price: 18.5,
  },
  {
    id: "05-C-04",
    category: "05. CARPINTERÍA",
    concept: "COLOCACIÓN RODAPIÉ DM LACADO (MO y Materiales)",
    description: "Suministro y colocación de rodapié.",
    unit: "ml",
    base_price: 8.06,
  },
  {
    id: "05-C-05",
    category: "05. CARPINTERÍA",
    concept: "SUMINISTRO Y COLOCACIÓN PREMARCOS (MO)",
    description: "Instalación de premarco.",
    unit: "Ud",
    base_price: 129.6,
  },
  {
    id: "05-C-06",
    category: "05. CARPINTERÍA",
    concept: "SUMINISTRO Y COLOCACIÓN FORRO (MARCOS SIN PUERTA) (MO)",
    description: "Instalación de forro de marco sin hoja de puerta.",
    unit: "Ud",
    base_price: 286.56,
  },
  {
    id: "05-C-07",
    category: "05. CARPINTERÍA",
    concept: "COLOCACIÓN PUERTA ABATIBLE 1 HOJA (MO)",
    description: "Instalación de puerta abatible en block.",
    unit: "Ud",
    base_price: 144,
  },
  {
    id: "05-C-08",
    category: "05. CARPINTERÍA",
    concept: "COLOCACIÓN PUERTA CORREDERA (MO)",
    description: "Instalación de hoja de puerta corredera en su cajetín.",
    unit: "Ud",
    base_price: 331.2,
  },
  {
    id: "05-C-09",
    category: "05. CARPINTERÍA",
    concept: "COLOCACIÓN PUERTA ENTRADA (Blindada) (MO)",
    description: "Instalación de puerta de seguridad.",
    unit: "Ud",
    base_price: 650,
  },
  {
    id: "05-C-10",
    category: "05. CARPINTERÍA",
    concept: "ACUCHILLADO SUELO + BARNIZADO",
    description: "Lijado y barnizado de suelo de madera existente.",
    unit: "m²",
    base_price: 23.04,
  },
  {
    id: "05-C-11",
    category: "05. CARPINTERÍA",
    concept: "EMPLASTECIDO DE LAS LAMAS DE TARIMA",
    description: "Relleno de juntas de tarima.",
    unit: "m²",
    base_price: 7.2,
  },
  {
    id: "05-C-12",
    category: "05. CARPINTERÍA",
    concept: "REBAJE DE PUERTAS",
    description: "Rebaje inferior de puertas para ajuste a la altura del nuevo suelo.",
    unit: "Ud",
    base_price: 23.04,
  },
  {
    id: "05-C-17",
    category: "05. CARPINTERÍA",
    concept: "FORRO PUERTA DE ENTRADA (MO)",
    description: "Instalación de forro de marco para puerta de entrada.",
    unit: "Ud",
    base_price: 144,
  },
  {
    id: "05-C-18",
    category: "05. CARPINTERÍA",
    concept: "COLOCACIÓN PUERTA CORREDERA EXTERIOR CON CARRIL (MO)",
    description: "Instalación de puerta corredera exterior con sistema de carril visto.",
    unit: "Ud",
    base_price: 288,
  },

  // 06. ELECTRICIDAD
  {
    id: "06-E-01",
    category: "06. ELECTRICIDAD",
    concept: "CUADRO GENERAL 18 ELEMENTOS",
    description: "Instalación de cuadro eléctrico con 18 módulos y elementos de protección.",
    unit: "Ud",
    base_price: 792,
  },
  {
    id: "06-E-02",
    category: "06. ELECTRICIDAD",
    concept: "CANALIZACIÓN TV Y TELECOMUNICACIONES",
    description: "Instalación de red de cableado para TV y voz/datos.",
    unit: "Ud",
    base_price: 252,
  },
  {
    id: "06-E-03",
    category: "06. ELECTRICIDAD",
    concept: "SUMINISTRO E INSTALACIÓN PORTERO CONVENCIONAL",
    description: "Instalación de telefonillo.",
    unit: "Ud",
    base_price: 136.8,
  },
  {
    id: "06-E-04",
    category: "06. ELECTRICIDAD",
    concept: "CUADRO DE OBRA (Instalación temporal)",
    description: "Colocación de un cuadro eléctrico provisional para la reforma.",
    unit: "Ud",
    base_price: 396,
  },
  {
    id: "06-E-05",
    category: "06. ELECTRICIDAD",
    concept: "LINEA DE ENCHUFES MONOFÁSICA (2,5mm2)",
    description: "Tendido de línea de enchufes estándar.",
    unit: "Ud",
    base_price: 338.4,
  },
  {
    id: "06-E-06",
    category: "06. ELECTRICIDAD",
    concept: "LINEA DE ALUMBRADO (1,5mm2)",
    description: "Tendido de línea de alumbrado general.",
    unit: "Ud",
    base_price: 338.4,
  },
  {
    id: "06-E-07",
    category: "06. ELECTRICIDAD",
    concept: "PUNTO DE LUZ SENCILLOS",
    description: "Mecanismo e instalación de un punto de luz simple (interruptor + luz).",
    unit: "Ud",
    base_price: 50.4,
  },
  {
    id: "06-E-08",
    category: "06. ELECTRICIDAD",
    concept: "PUNTOS CONMUTADOS",
    description: "Mecanismo e instalación de un punto de luz que se controla desde dos interruptores.",
    unit: "Ud",
    base_price: 79.2,
  },
  {
    id: "06-E-09",
    category: "06. ELECTRICIDAD",
    concept: "PUNTOS DE CRUZAMIENTO",
    description: "Mecanismo e instalación de un punto de luz que se controla desde tres o más interruptores.",
    unit: "Ud",
    base_price: 93.6,
  },
  {
    id: "06-E-10",
    category: "06. ELECTRICIDAD",
    concept: "PUNTOS DE ENCHUFES",
    description: "Mecanismo e instalación de un enchufe de pared estándar.",
    unit: "Ud",
    base_price: 57.6,
  },
  {
    id: "06-E-12",
    category: "06. ELECTRICIDAD",
    concept: "TOMA DE TV",
    description: "Mecanismo e instalación de toma de antena y telecomunicaciones.",
    unit: "Ud",
    base_price: 92.16,
  },
  {
    id: "06-E-14",
    category: "06. ELECTRICIDAD",
    concept: "SUMINISTRO Y COLOCACIÓN FOCOS (MO)",
    description: "Mano de obra por la instalación de focos empotrados en falso techo (focos no incluidos).",
    unit: "Ud",
    base_price: 43.2,
  },
  {
    id: "06-E-15",
    category: "06. ELECTRICIDAD",
    concept: "TIMBRE DE PUERTA ENTRADA",
    description: "Instalación de pulsador y timbre.",
    unit: "Ud",
    base_price: 64.8,
  },
  {
    id: "06-E-16",
    category: "06. ELECTRICIDAD",
    concept: "LÍNEA DE CUATRO PARA CALEFACCIÓN ELÉCTRICA",
    description: "Tendido de línea independiente para radiadores eléctricos.",
    unit: "Ud",
    base_price: 280,
  },
  {
    id: "06-E-17",
    category: "06. ELECTRICIDAD",
    concept: "BOLETÍN Y LEGALIZACIÓN",
    description: "Emisión del certificado de instalación eléctrica y legalización.",
    unit: "Ud",
    base_price: 350,
  },
  {
    id: "06-E-18",
    category: "06. ELECTRICIDAD",
    concept: "INSTALACIÓN DE TOMA DE TIERRA",
    description: "Instalación completa de sistema de puesta a tierra según normativa vigente.",
    unit: "Ud",
    base_price: 149.5,
  },

  // 07. CALEFACCIÓN
  {
    id: "07-CAL-01",
    category: "07. CALEFACCIÓN",
    concept: "INSTALACIÓN DE RADIADOR ELÉCTRICO",
    description: "Instalación y conexión a la línea eléctrica.",
    unit: "Ud",
    base_price: 57.6,
  },
  {
    id: "07-CAL-02",
    category: "07. CALEFACCIÓN",
    concept: "RECOLOCAR CALDERA DE GAS-SIN DESPLAZAMIENTO",
    description: "Desmontaje y montaje de caldera en el mismo sitio.",
    unit: "Ud",
    base_price: 57.6,
  },
  {
    id: "07-CAL-03",
    category: "07. CALEFACCIÓN",
    concept: "COLOCACIÓN CALDERA DE GAS (Montaje MO)",
    description: "Mano de obra por la instalación completa de una nueva caldera.",
    unit: "Ud",
    base_price: 547.2,
  },
  {
    id: "07-CAL-04",
    category: "07. CALEFACCIÓN",
    concept: "RED ALIMENTACIÓN POR RADIADOR",
    description: "Instalación de tubería multicapa desde el colector hasta el radiador.",
    unit: "Ud",
    base_price: 259.2,
  },
  {
    id: "07-CAL-05",
    category: "07. CALEFACCIÓN",
    concept: "COLOCACIÓN Y MOVIMIENTO RADIADORES (MO)",
    description: "Instalación de nuevo radiador o movimiento de uno existente.",
    unit: "Ud",
    base_price: 86.4,
  },
  {
    id: "07-CAL-06",
    category: "07. CALEFACCIÓN",
    concept: "LEGALIZACIÓN INSTALACIÓN (Certificación)",
    description: "Emisión de certificados y legalización de la instalación de gas.",
    unit: "Ud",
    base_price: 460.8,
  },
  {
    id: "07-CAL-07",
    category: "07. CALEFACCIÓN",
    concept: "INSTALACIÓN SUELO RADIANTE HÚMEDO",
    description: "Instalación de red de tuberías de suelo radiante sobre base aislante.",
    unit: "m²",
    base_price: 91.15,
  },
  {
    id: "07-CAL-08",
    category: "07. CALEFACCIÓN",
    concept: "ACOMETIDA DE GAS (Aprox.)",
    description: "Coste estimado de conexión a la red de gas general.",
    unit: "Ud",
    base_price: 1440,
  },
  {
    id: "07-CAL-09",
    category: "07. CALEFACCIÓN",
    concept: "CAMBIO DE RACORES RADIADOR",
    description: "Sustitución de piezas de conexión del radiador.",
    unit: "Ud",
    base_price: 64.8,
  },
  {
    id: "07-CAL-10",
    category: "07. CALEFACCIÓN",
    concept: "INSTALACIÓN TERMO FLECK DUO 80L",
    description: "Instalación y conexionado de termo eléctrico.",
    unit: "Ud",
    base_price: 277.92,
  },
  {
    id: "07-CAL-11",
    category: "07. CALEFACCIÓN",
    concept: "SUELO RADIANTE COMPLETO (Colector, aislante, tubo y capa compresora)",
    description:
      "Sistema completo de suelo radiante incluyendo colector de distribución, aislante térmico, tubería multicapa y capa compresora.",
    unit: "m²",
    base_price: 60,
  },

  // 08. LIMPIEZA
  {
    id: "08-L-01",
    category: "08. LIMPIEZA",
    concept: "LIMPIEZAS PERIÓDICAS DE OBRA",
    description: "Mano de obra por la limpieza diaria/semanal de la obra.",
    unit: "Ud",
    base_price: 100.8,
  },
  {
    id: "08-L-02",
    category: "08. LIMPIEZA",
    concept: "LIMPIEZA FINAL DE OBRA",
    description: "Limpieza exhaustiva de fin de obra y retirada de restos menores.",
    unit: "Ud",
    base_price: 0,
  },

  // 09. PINTURA
  {
    id: "09-P-01",
    category: "09. PINTURA",
    concept: "PINTURA DE PAREDES",
    description: "Pintura plástica lisa en paredes",
    unit: "m²",
    base_price: 10.0,
  },
  {
    id: "09-P-02",
    category: "09. PINTURA",
    concept: "PINTURA DE TECHOS",
    description: "Pintura plástica lisa en techos",
    unit: "m²",
    base_price: 11.0,
  },

  // 10. MATERIALES
  {
    id: "10-M-01",
    category: "10. MATERIALES",
    concept: "PLATO DE DUCHA DE RESINA BLANCO",
    description: "Plato de ducha de resina extraplano (Suministro, no instalación).",
    unit: "Ud",
    base_price: 370,
  },
  {
    id: "10-M-02",
    category: "10. MATERIALES",
    concept: "VÁLVULA PARA PLATO DE DUCHA",
    description: "Válvula de desagüe para plato de ducha.",
    unit: "Ud",
    base_price: 60,
  },
  {
    id: "10-M-03",
    category: "10. MATERIALES",
    concept: "INODORO",
    description: "Inodoro cerámico (Suministro, no instalación).",
    unit: "Ud",
    base_price: 250,
  },
  {
    id: "10-M-04",
    category: "10. MATERIALES",
    concept: "MONOMANDO LAVABO",
    description: "Grifo monomando para lavabo.",
    unit: "Ud",
    base_price: 97,
  },
  {
    id: "10-M-05",
    category: "10. MATERIALES",
    concept: "DUCHA TERMOSTÁTICA",
    description: "Grifo termostático para ducha.",
    unit: "Ud",
    base_price: 215,
  },
  {
    id: "10-M-06",
    category: "10. MATERIALES",
    concept: "MAMPARA DE DUCHA",
    description: "Mampara de ducha (Suministro, no instalación).",
    unit: "Ud",
    base_price: 350,
  },
  {
    id: "10-M-07",
    category: "10. MATERIALES",
    concept: "CONJUNTO DE MUEBLE CON LAVABO",
    description: "Mueble de baño con lavabo integrado.",
    unit: "Ud",
    base_price: 320,
  },
  {
    id: "10-M-08",
    category: "10. MATERIALES",
    concept: "BALDOSA Y AZULEJO",
    description: "Coste del metro cuadrado de baldosa o azulejo para revestimientos.",
    unit: "m²",
    base_price: 20,
  },
  {
    id: "10-M-09",
    category: "10. MATERIALES",
    concept: "PARQUET FLOTANTE",
    description: "Coste del metro cuadrado de tarima laminada de alta calidad.",
    unit: "m²",
    base_price: 33,
  },
  {
    id: "10-M-10",
    category: "10. MATERIALES",
    concept: "SUELO VINÍLICO CLIC",
    description: "Coste del metro cuadrado de suelo de vinilo.",
    unit: "m²",
    base_price: 25,
  },
  {
    id: "10-M-11",
    category: "10. MATERIALES",
    concept: "MANTA SUELO PARQUET FLOTANTE",
    description: "Suministro de lámina aislante bajo tarima.",
    unit: "m²",
    base_price: 4,
  },
  {
    id: "10-M-12",
    category: "10. MATERIALES",
    concept: "SUMINISTRO RODAPIÉ DM LACADO",
    description: "Coste del rodapié de madera.",
    unit: "ml",
    base_price: 5,
  },
  {
    id: "10-M-13",
    category: "10. MATERIALES",
    concept: "PUERTA ABATIBLE EN BLOCK UNA HOJA",
    description: "Coste de puerta de interior en kit.",
    unit: "Ud",
    base_price: 290,
  },
  {
    id: "10-M-14",
    category: "10. MATERIALES",
    concept: "CAJÓN PUERTA CORREDERA",
    description: "Coste del armazón metálico para puerta corredera.",
    unit: "Ud",
    base_price: 220,
  },
  {
    id: "10-M-15",
    category: "10. MATERIALES",
    concept: "PUERTA CORREDERA EN KIT",
    description: "Coste de hoja de puerta corredera.",
    unit: "Ud",
    base_price: 320,
  },
  {
    id: "10-M-16",
    category: "10. MATERIALES",
    concept: "PUERTA ENTRADA",
    description: "Coste de puerta de seguridad.",
    unit: "Ud",
    base_price: 1823,
  },
  {
    id: "10-M-17",
    category: "10. MATERIALES",
    concept: "FORRO PUERTA ENTRADA",
    description: "Forro de marco para puerta de entrada.",
    unit: "Ud",
    base_price: 95,
  },
  {
    id: "10-M-18",
    category: "10. MATERIALES",
    concept: "CALDERA CONDENSACIÓN",
    description: "Suministro de caldera de condensación.",
    unit: "Ud",
    base_price: 1910,
  },
  {
    id: "10-M-19",
    category: "10. MATERIALES",
    concept: "RADIADOR ELÉCTRICO",
    description: "Coste de radiador eléctrico.",
    unit: "Ud",
    base_price: 200,
  },
  {
    id: "10-M-20",
    category: "10. MATERIALES",
    concept: "RADIADORES",
    description: "Suministro de radiador de agua.",
    unit: "Ud",
    base_price: 310,
  },
  {
    id: "10-M-21",
    category: "10. MATERIALES",
    concept: "RADIADOR TOALLERO",
    description: "Suministro de radiador toallero.",
    unit: "Ud",
    base_price: 310,
  },
  {
    id: "10-M-22",
    category: "10. MATERIALES",
    concept: "TERMOSTATO AMBIENTE",
    description: "Suministro de termostato.",
    unit: "Ud",
    base_price: 60,
  },
  {
    id: "10-M-23",
    category: "10. MATERIALES",
    concept: "TERMO ELÉCTRICO",
    description: "Suministro de termo eléctrico.",
    unit: "Ud",
    base_price: 570,
  },
  {
    id: "10-M-24",
    category: "10. MATERIALES",
    concept: "SUELO LAMINADO",
    description: "Coste del metro cuadrado de suelo laminado tipo click.",
    unit: "m²",
    base_price: 25,
  },
  {
    id: "10-M-25",
    category: "10. MATERIALES",
    concept: "EMISOR TÉRMICO",
    description: "Emisor Térmico Seco de bajo consumo-programable 24/7, Calor Rápido, 15m², Aluminio",
    unit: "Ud",
    base_price: 189.75,
  },

  // 11. VENTANAS
  {
    id: "11-V-01",
    category: "11. VENTANAS",
    concept: "VENTANA PVC CRISTAL SENCILLO",
    description: "Ventana de PVC con cristal sencillo (Suministro e instalación)",
    unit: "Ud",
    base_price: 350,
  },
  {
    id: "11-V-02",
    category: "11. VENTANAS",
    concept: "VENTANA PVC DOBLE ACRISTALAMIENTO",
    description: "Ventana de PVC con doble acristalamiento (Suministro e instalación)",
    unit: "Ud",
    base_price: 500,
  },
  {
    id: "11-V-03",
    category: "11. VENTANAS",
    concept: "VENTANA PVC CRISTAL ACÚSTICO",
    description: "Ventana de PVC con cristal acústico (Suministro e instalación)",
    unit: "Ud",
    base_price: 650,
  },
]
