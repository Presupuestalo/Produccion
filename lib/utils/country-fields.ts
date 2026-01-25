import { COUNTRIES, type Country } from "@/lib/services/currency-service"

export const COUNTRY_FIELD_LABELS: { [key: string]: { province: string; taxId: string; taxIdDescription: string } } = {
  // España
  ES: {
    province: "Provincia",
    taxId: "CIF/NIF",
    taxIdDescription: "Código de Identificación Fiscal para empresas o NIF para autónomos"
  },

  // América
  US: {
    province: "Estado",
    taxId: "EIN",
    taxIdDescription: "Employer Identification Number (Federal Tax ID)"
  },
  CA: {
    province: "Provincia",
    taxId: "BN",
    taxIdDescription: "Business Number (CRA)"
  },
  MX: {
    province: "Estado",
    taxId: "RFC",
    taxIdDescription: "Registro Federal de Contribuyentes"
  },
  AR: {
    province: "Provincia",
    taxId: "CUIT",
    taxIdDescription: "Clave Única de Identificación Tributaria"
  },
  BR: {
    province: "Estado",
    taxId: "CNPJ",
    taxIdDescription: "Cadastro Nacional da Pessoa Jurídica"
  },
  CL: {
    province: "Región",
    taxId: "RUT",
    taxIdDescription: "Rol Único Tributario"
  },
  CO: {
    province: "Departamento",
    taxId: "NIT",
    taxIdDescription: "Número de Identificación Tributaria"
  },
  PE: {
    province: "Departamento",
    taxId: "RUC",
    taxIdDescription: "Registro Único de Contribuyentes"
  },
  UY: {
    province: "Departamento",
    taxId: "RUT",
    taxIdDescription: "Registro Único Tributario"
  },
  VE: {
    province: "Estado",
    taxId: "RIF",
    taxIdDescription: "Registro de Información Fiscal"
  },

  // Europa
  FR: {
    province: "Región",
    taxId: "SIRET",
    taxIdDescription: "Système d'Identification du Répertoire des Établissements"
  },
  DE: {
    province: "Estado",
    taxId: "Steuernummer",
    taxIdDescription: "Tax Identification Number (Steuernummer)"
  },
  IT: {
    province: "Provincia",
    taxId: "Partita IVA",
    taxIdDescription: "Partita IVA (VAT Number)"
  },
  PT: {
    province: "Distrito",
    taxId: "NIPC",
    taxIdDescription: "Número de Identificação de Pessoa Coletiva"
  },
  GB: {
    province: "Condado",
    taxId: "VAT Number",
    taxIdDescription: "Value Added Tax Registration Number"
  },
  IE: {
    province: "Condado",
    taxId: "VAT Number",
    taxIdDescription: "Value Added Tax Registration Number"
  },
  NL: {
    province: "Provincia",
    taxId: "BTW-nummer",
    taxIdDescription: "Belasting Toegevoegde Waarde (VAT Number)"
  },
  BE: {
    province: "Provincia",
    taxId: "Numéro de TVA",
    taxIdDescription: "Numéro de TVA (VAT Number)"
  },
  CH: {
    province: "Cantón",
    taxId: "UID",
    taxIdDescription: "Unternehmens-Identifikationsnummer"
  },
  AT: {
    province: "Estado",
    taxId: "UID",
    taxIdDescription: "Umsatzsteuer-Identifikationsnummer (VAT Number)"
  },
  SE: {
    province: "Condado",
    taxId: "Organisationsnummer",
    taxIdDescription: "Swedish Organization Number"
  },
  NO: {
    province: "Condado",
    taxId: "Organisasjonsnummer",
    taxIdDescription: "Norwegian Organization Number"
  },
  DK: {
    province: "Región",
    taxId: "CVR-nummer",
    taxIdDescription: "Det Centrale Virksomhedsregister (Business Registration Number)"
  },
  FI: {
    province: "Región",
    taxId: "Y-tunnus",
    taxIdDescription: "Business ID (Y-tunnus)"
  },
  PL: {
    province: "Voivodato",
    taxId: "NIP",
    taxIdDescription: "Numer Identyfikacji Podatkowej (Tax ID)"
  },
  CZ: {
    province: "Región",
    taxId: "IČO",
    taxIdDescription: "Identifikační číslo osoby (Business ID)"
  },
  GR: {
    province: "Región",
    taxId: "ΑΦΜ",
    taxIdDescription: "Αριθμός Φορολογικού Μητρώου (Tax Registration Number)"
  },

  // Asia
  CN: {
    province: "Provincia",
    taxId: "统一社会信用代码",
    taxIdDescription: "Unified Social Credit Code"
  },
  JP: {
    province: "Prefectura",
    taxId: "法人番号",
    taxIdDescription: "Corporate Number (Hōjin Bangō)"
  },
  KR: {
    province: "Provincia",
    taxId: "사업자등록번호",
    taxIdDescription: "Business Registration Number"
  },
  IN: {
    province: "Estado",
    taxId: "GSTIN",
    taxIdDescription: "Goods and Services Tax Identification Number"
  },
  ID: {
    province: "Provincia",
    taxId: "NPWP",
    taxIdDescription: "Nomor Pokok Wajib Pajak (Tax ID)"
  },
  TH: {
    province: "Provincia",
    taxId: "เลขประจำตัวผู้เสียภาษี",
    taxIdDescription: "Tax Identification Number"
  },
  VN: {
    province: "Provincia",
    taxId: "Mã số thuế",
    taxIdDescription: "Tax Code (MST)"
  },
  PH: {
    province: "Provincia",
    taxId: "TIN",
    taxIdDescription: "Tax Identification Number"
  },
  MY: {
    province: "Estado",
    taxId: "SSM",
    taxIdDescription: "Companies Commission of Malaysia Registration Number"
  },
  SG: {
    province: "Región",
    taxId: "UEN",
    taxIdDescription: "Unique Entity Number"
  },

  // Oceanía
  AU: {
    province: "Estado",
    taxId: "ABN",
    taxIdDescription: "Australian Business Number"
  },
  NZ: {
    province: "Región",
    taxId: "NZBN",
    taxIdDescription: "New Zealand Business Number"
  },

  // África
  ZA: {
    province: "Provincia",
    taxId: "Tax Reference Number",
    taxIdDescription: "South African Revenue Service Tax Number"
  },
  EG: {
    province: "Gobernación",
    taxId: "الرقم الضريبي",
    taxIdDescription: "Tax Registration Number"
  },
  MA: {
    province: "Región",
    taxId: "ICE",
    taxIdDescription: "Identifiant Commun de l'Entreprise"
  },

  // Default fallback
  DEFAULT: {
    province: "Provincia/Estado/Región",
    taxId: "Tax ID / CIF",
    taxIdDescription: "Tax Identification Number or Company Registration Number"
  }
}

export function getCountryFieldLabels(countryCode: string) {
  if (!countryCode) return COUNTRY_FIELD_LABELS.DEFAULT
  const normalized = countryCode.trim().toUpperCase()
  const code = (normalized === "ESPAÑA" || normalized === "ESPAÑA".toUpperCase()) ? "ES" : normalized
  return COUNTRY_FIELD_LABELS[code] || COUNTRY_FIELD_LABELS.DEFAULT
}

// Lista de provincias/estados por país (solo los más comunes)
export const PROVINCES_BY_COUNTRY: { [key: string]: string[] } = {
  ES: [
    "A Coruña", "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Baleares", "Barcelona",
    "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ceuta", "Ciudad Real", "Córdoba", "Cuenca", "Girona",
    "Granada", "Guadalajara", "Guipúzcoa", "Huelva", "Huesca", "Jaén", "La Rioja", "Las Palmas", "León", "Lleida",
    "Lugo", "Madrid", "Málaga", "Melilla", "Murcia", "Navarra", "Ourense", "Palencia", "Pontevedra", "Salamanca",
    "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo", "Valencia",
    "Valladolid", "Vizcaya", "Zamora", "Zaragoza"
  ],

  US: [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
    "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
    "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
    "Wisconsin", "Wyoming"
  ],

  FR: [
    "Île-de-France", "Provence-Alpes-Côte d'Azur", "Auvergne-Rhône-Alpes", "Nouvelle-Aquitaine",
    "Occitanie", "Hauts-de-France", "Grand Est", "Bretagne", "Normandie", "Pays de la Loire",
    "Centre-Val de Loire", "Bourgogne-Franche-Comté", "Corse"
  ],

  IT: [
    "Agrigento", "Alessandria", "Ancona", "Aosta", "Arezzo", "Ascoli Piceno", "Asti",
    "Avellino", "Bari", "Barletta-Andria-Trani", "Belluno", "Benevento", "Bergamo", "Biella",
    "Bologna", "Bolzano", "Brescia", "Brindisi", "Cagliari", "Caltanissetta", "Campobasso",
    "Caserta", "Catania", "Catanzaro", "Chieti", "Como", "Cosenza", "Cremona", "Crotone",
    "Cuneo", "Enna", "Fermo", "Ferrara", "Firenze", "Foggia", "Forlì-Cesena", "Frosinone",
    "Genova", "Gorizia", "Grosseto", "Imperia", "Isernia", "L'Aquila", "La Spezia", "Latina",
    "Lecce", "Lecco", "Livorno", "Lodi", "Lucca", "Macerata", "Mantova", "Massa-Carrara",
    "Matera", "Messina", "Milano", "Modena", "Monza e Brianza", "Napoli", "Novara", "Nuoro",
    "Oristano", "Padova", "Palermo", "Parma", "Pavia", "Perugia", "Pesaro e Urbino", "Pescara",
    "Piacenza", "Pisa", "Pistoia", "Pordenone", "Potenza", "Prato", "Ragusa", "Ravenna",
    "Reggio Calabria", "Reggio Emilia", "Rieti", "Rimini", "Roma", "Rovigo", "Salerno",
    "Sassari", "Savona", "Siena", "Siracusa", "Sondrio", "Sud Sardegna", "Taranto", "Teramo",
    "Terni", "Torino", "Trapani", "Trento", "Treviso", "Trieste", "Udine", "Varese", "Venezia",
    "Verbano-Cusio-Ossola", "Vercelli", "Verona", "Vibo Valentia", "Vicenza", "Viterbo"
  ],

  PT: [
    "Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro",
    "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal",
    "Viana do Castelo", "Vila Real", "Viseu", "Açores", "Madeira"
  ],


  MX: [
    "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
    "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México",
    "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit",
    "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
    "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
  ],
  AR: [
    "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa",
    "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan",
    "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"
  ],
  CO: [
    "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bolívar", "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca",
    "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta",
    "Nariño", "Norte de Santander", "Putumayo", "Quindío", "Risaralda", "San Andrés y Providencia", "Santander",
    "Sucre", "Tolima", "Valle del Cauca", "Vaupés", "Vichada", "Bogotá D.C."
  ],
  CL: [
    "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo", "Valparaíso", "Metropolitana de Santiago",
    "O'Higgins", "Maule", "Ñuble", "Biobío", "Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes"
  ],
  PE: [
    "Amazonas", "Ancash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca", "Callao", "Cusco", "Huancavelica",
    "Huánuco", "Ica", "Junín", "La Libertad", "Lambayeque", "Lima", "Loreto", "Madre de Dios", "Moquegua",
    "Pasco", "Piura", "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali"
  ]
}

export function getProvincesForCountry(countryCode: string): string[] | null {
  if (!countryCode) return null
  const normalized = countryCode.trim().toUpperCase()
  const code = (normalized === "ESPAÑA" || normalized === "ESPAÑA".toUpperCase()) ? "ES" : normalized
  return PROVINCES_BY_COUNTRY[code] || null
}

export function getCountryInfo(countryCode: string): Country | null {
  if (!countryCode) return null
  const normalized = countryCode.trim().toUpperCase()
  const code = (normalized === "ESPAÑA" || normalized === "ESPAÑA".toUpperCase()) ? "ES" : normalized
  return COUNTRIES[code] || null
}

export function getCurrencyForCountry(countryCode: string): string {
  const country = COUNTRIES[countryCode]
  return country ? country.currency.code : "EUR"
}

export function getCurrencySymbolForCountry(countryCode: string): string {
  const country = COUNTRIES[countryCode]
  return country ? country.currency.symbol : "€"
}
