import { COUNTRIES, type Country } from "@/lib/services/currency-service"

export const COUNTRY_FIELD_LABELS: { [key: string]: { province: string; postalCode: string; taxId: string; taxIdDescription: string } } = {
  // España
  ES: { 
    province: "Provincia", 
    postalCode: "Código postal",
    taxId: "CIF/NIF",
    taxIdDescription: "Código de Identificación Fiscal para empresas o NIF para autónomos"
  },
  
  // América
  US: { 
    province: "Estado", 
    postalCode: "ZIP Code",
    taxId: "EIN",
    taxIdDescription: "Employer Identification Number (Federal Tax ID)"
  },
  CA: { 
    province: "Provincia", 
    postalCode: "Postal Code",
    taxId: "BN",
    taxIdDescription: "Business Number (CRA)"
  },
  MX: { 
    province: "Estado", 
    postalCode: "Código postal",
    taxId: "RFC",
    taxIdDescription: "Registro Federal de Contribuyentes"
  },
  AR: { 
    province: "Provincia", 
    postalCode: "Código postal",
    taxId: "CUIT",
    taxIdDescription: "Clave Única de Identificación Tributaria"
  },
  BR: { 
    province: "Estado", 
    postalCode: "CEP",
    taxId: "CNPJ",
    taxIdDescription: "Cadastro Nacional da Pessoa Jurídica"
  },
  CL: { 
    province: "Región", 
    postalCode: "Código postal",
    taxId: "RUT",
    taxIdDescription: "Rol Único Tributario"
  },
  CO: { 
    province: "Departamento", 
    postalCode: "Código postal",
    taxId: "NIT",
    taxIdDescription: "Número de Identificación Tributaria"
  },
  PE: { 
    province: "Departamento", 
    postalCode: "Código postal",
    taxId: "RUC",
    taxIdDescription: "Registro Único de Contribuyentes"
  },
  UY: { 
    province: "Departamento", 
    postalCode: "Código postal",
    taxId: "RUT",
    taxIdDescription: "Registro Único Tributario"
  },
  VE: { 
    province: "Estado", 
    postalCode: "Código postal",
    taxId: "RIF",
    taxIdDescription: "Registro de Información Fiscal"
  },
  
  // Europa
  FR: { 
    province: "Región", 
    postalCode: "Code postal",
    taxId: "SIRET",
    taxIdDescription: "Système d'Identification du Répertoire des Établissements"
  },
  DE: { 
    province: "Estado", 
    postalCode: "Postleitzahl",
    taxId: "Steuernummer",
    taxIdDescription: "Tax Identification Number (Steuernummer)"
  },
  IT: { 
    province: "Provincia", 
    postalCode: "CAP",
    taxId: "Partita IVA",
    taxIdDescription: "Partita IVA (VAT Number)"
  },
  PT: { 
    province: "Distrito", 
    postalCode: "Código postal",
    taxId: "NIPC",
    taxIdDescription: "Número de Identificação de Pessoa Coletiva"
  },
  GB: { 
    province: "Condado", 
    postalCode: "Postcode",
    taxId: "VAT Number",
    taxIdDescription: "Value Added Tax Registration Number"
  },
  IE: { 
    province: "Condado", 
    postalCode: "Eircode",
    taxId: "VAT Number",
    taxIdDescription: "Value Added Tax Registration Number"
  },
  NL: { 
    province: "Provincia", 
    postalCode: "Postcode",
    taxId: "BTW-nummer",
    taxIdDescription: "Belasting Toegevoegde Waarde (VAT Number)"
  },
  BE: { 
    province: "Provincia", 
    postalCode: "Code postal",
    taxId: "Numéro de TVA",
    taxIdDescription: "Numéro de TVA (VAT Number)"
  },
  CH: { 
    province: "Cantón", 
    postalCode: "Code postal",
    taxId: "UID",
    taxIdDescription: "Unternehmens-Identifikationsnummer"
  },
  AT: { 
    province: "Estado", 
    postalCode: "Postleitzahl",
    taxId: "UID",
    taxIdDescription: "Umsatzsteuer-Identifikationsnummer (VAT Number)"
  },
  SE: { 
    province: "Condado", 
    postalCode: "Postnummer",
    taxId: "Organisationsnummer",
    taxIdDescription: "Swedish Organization Number"
  },
  NO: { 
    province: "Condado", 
    postalCode: "Postnummer",
    taxId: "Organisasjonsnummer",
    taxIdDescription: "Norwegian Organization Number"
  },
  DK: { 
    province: "Región", 
    postalCode: "Postnummer",
    taxId: "CVR-nummer",
    taxIdDescription: "Det Centrale Virksomhedsregister (Business Registration Number)"
  },
  FI: { 
    province: "Región", 
    postalCode: "Postinumero",
    taxId: "Y-tunnus",
    taxIdDescription: "Business ID (Y-tunnus)"
  },
  PL: { 
    province: "Voivodato", 
    postalCode: "Kod pocztowy",
    taxId: "NIP",
    taxIdDescription: "Numer Identyfikacji Podatkowej (Tax ID)"
  },
  CZ: { 
    province: "Región", 
    postalCode: "PSČ",
    taxId: "IČO",
    taxIdDescription: "Identifikační číslo osoby (Business ID)"
  },
  GR: { 
    province: "Región", 
    postalCode: "Ταχυδρομικός κώδικας",
    taxId: "ΑΦΜ",
    taxIdDescription: "Αριθμός Φορολογικού Μητρώου (Tax Registration Number)"
  },
  
  // Asia
  CN: { 
    province: "Provincia", 
    postalCode: "邮政编码",
    taxId: "统一社会信用代码",
    taxIdDescription: "Unified Social Credit Code"
  },
  JP: { 
    province: "Prefectura", 
    postalCode: "郵便番号",
    taxId: "法人番号",
    taxIdDescription: "Corporate Number (Hōjin Bangō)"
  },
  KR: { 
    province: "Provincia", 
    postalCode: "우편번호",
    taxId: "사업자등록번호",
    taxIdDescription: "Business Registration Number"
  },
  IN: { 
    province: "Estado", 
    postalCode: "PIN Code",
    taxId: "GSTIN",
    taxIdDescription: "Goods and Services Tax Identification Number"
  },
  ID: { 
    province: "Provincia", 
    postalCode: "Kode pos",
    taxId: "NPWP",
    taxIdDescription: "Nomor Pokok Wajib Pajak (Tax ID)"
  },
  TH: { 
    province: "Provincia", 
    postalCode: "รหัสไปรษณีย์",
    taxId: "เลขประจำตัวผู้เสียภาษี",
    taxIdDescription: "Tax Identification Number"
  },
  VN: { 
    province: "Provincia", 
    postalCode: "Mã bưu điện",
    taxId: "Mã số thuế",
    taxIdDescription: "Tax Code (MST)"
  },
  PH: { 
    province: "Provincia", 
    postalCode: "ZIP Code",
    taxId: "TIN",
    taxIdDescription: "Tax Identification Number"
  },
  MY: { 
    province: "Estado", 
    postalCode: "Poskod",
    taxId: "SSM",
    taxIdDescription: "Companies Commission of Malaysia Registration Number"
  },
  SG: { 
    province: "Región", 
    postalCode: "Postal Code",
    taxId: "UEN",
    taxIdDescription: "Unique Entity Number"
  },
  
  // Oceanía
  AU: { 
    province: "Estado", 
    postalCode: "Postcode",
    taxId: "ABN",
    taxIdDescription: "Australian Business Number"
  },
  NZ: { 
    province: "Región", 
    postalCode: "Postcode",
    taxId: "NZBN",
    taxIdDescription: "New Zealand Business Number"
  },
  
  // África
  ZA: { 
    province: "Provincia", 
    postalCode: "Postal Code",
    taxId: "Tax Reference Number",
    taxIdDescription: "South African Revenue Service Tax Number"
  },
  EG: { 
    province: "Gobernación", 
    postalCode: "الرمز البريدي",
    taxId: "الرقم الضريبي",
    taxIdDescription: "Tax Registration Number"
  },
  MA: { 
    province: "Región", 
    postalCode: "Code postal",
    taxId: "ICE",
    taxIdDescription: "Identifiant Commun de l'Entreprise"
  },
  
  // Default fallback
  DEFAULT: { 
    province: "Provincia/Estado/Región", 
    postalCode: "Código postal",
    taxId: "Tax ID / CIF",
    taxIdDescription: "Tax Identification Number or Company Registration Number"
  }
}

export function getCountryFieldLabels(countryCode: string) {
  return COUNTRY_FIELD_LABELS[countryCode] || COUNTRY_FIELD_LABELS.DEFAULT
}

// Lista de provincias/estados por país (solo los más comunes)
export const PROVINCES_BY_COUNTRY: { [key: string]: string[] } = {
  ES: [
    "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Barcelona",
    "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real", "Córdoba", "Cuenca",
    "Girona", "Granada", "Guadalajara", "Guipúzcoa", "Huelva", "Huesca", "Islas Baleares",
    "Jaén", "La Coruña", "La Rioja", "Las Palmas", "León", "Lérida", "Lugo", "Madrid",
    "Málaga", "Murcia", "Navarra", "Orense", "Palencia", "Pontevedra", "Salamanca",
    "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel",
    "Toledo", "Valencia", "Valladolid", "Vizcaya", "Zamora", "Zaragoza"
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
    "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Guanajuato",
    "Guerrero", "Hidalgo", "Jalisco", "México", "Michoacán", "Morelos", "Nayarit",
    "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
    "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
  ],
  
  CN: { 
    province: "Provincia", 
    postalCode: "邮政编码",
    taxId: "统一社会信用代码",
    taxIdDescription: "Unified Social Credit Code"
  },
  JP: { 
    province: "Prefectura", 
    postalCode: "郵便番号",
    taxId: "法人番号",
    taxIdDescription: "Corporate Number (Hōjin Bangō)"
  },
  KR: { 
    province: "Provincia", 
    postalCode: "우편번호",
    taxId: "사업자등록번호",
    taxIdDescription: "Business Registration Number"
  },
  IN: { 
    province: "Estado", 
    postalCode: "PIN Code",
    taxId: "GSTIN",
    taxIdDescription: "Goods and Services Tax Identification Number"
  },
  ID: { 
    province: "Provincia", 
    postalCode: "Kode pos",
    taxId: "NPWP",
    taxIdDescription: "Nomor Pokok Wajib Pajak (Tax ID)"
  },
  TH: { 
    province: "Provincia", 
    postalCode: "รหัสไปรษณีย์",
    taxId: "เลขประจำตัวผู้เสียภาษี",
    taxIdDescription: "Tax Identification Number"
  },
  VN: { 
    province: "Provincia", 
    postalCode: "Mã bưu điện",
    taxId: "Mã số thuế",
    taxIdDescription: "Tax Code (MST)"
  },
  PH: { 
    province: "Provincia", 
    postalCode: "ZIP Code",
    taxId: "TIN",
    taxIdDescription: "Tax Identification Number"
  },
  MY: { 
    province: "Estado", 
    postalCode: "Poskod",
    taxId: "SSM",
    taxIdDescription: "Companies Commission of Malaysia Registration Number"
  },
  SG: { 
    province: "Región", 
    postalCode: "Postal Code",
    taxId: "UEN",
    taxIdDescription: "Unique Entity Number"
  },
  
  AU: { 
    province: "Estado", 
    postalCode: "Postcode",
    taxId: "ABN",
    taxIdDescription: "Australian Business Number"
  },
  NZ: { 
    province: "Región", 
    postalCode: "Postcode",
    taxId: "NZBN",
    taxIdDescription: "New Zealand Business Number"
  },
  
  ZA: { 
    province: "Provincia", 
    postalCode: "Postal Code",
    taxId: "Tax Reference Number",
    taxIdDescription: "South African Revenue Service Tax Number"
  },
  EG: { 
    province: "Gobernación", 
    postalCode: "الرمز البريدي",
    taxId: "الرقم الضريبي",
    taxIdDescription: "Tax Registration Number"
  },
  MA: { 
    province: "Región", 
    postalCode: "Code postal",
    taxId: "ICE",
    taxIdDescription: "Identifiant Commun de l'Entreprise"
  }
}

export function getProvincesForCountry(countryCode: string): string[] | null {
  return PROVINCES_BY_COUNTRY[countryCode] || null
}

export function getCountryInfo(countryCode: string): Country | null {
  return COUNTRIES[countryCode] || null
}

export function getCurrencyForCountry(countryCode: string): string {
  const country = COUNTRIES[countryCode]
  return country ? country.currency.code : "EUR"
}

export function getCurrencySymbolForCountry(countryCode: string): string {
  const country = COUNTRIES[countryCode]
  return country ? country.currency.symbol : "€"
}
