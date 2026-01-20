-- Script para añadir países de habla hispana con precios y descripciones localizadas
-- Este script añade precios master para países hispanohablantes que podrás editar desde tu panel

-- Primero, eliminamos los precios existentes de países que vamos a reemplazar
DELETE FROM price_master_by_country WHERE country_code IN ('ES', 'MX', 'CO', 'AR', 'CL', 'PE');

-- ESPAÑA (EUR) - Precios base originales
INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
SELECT 
  id,
  'ES',
  final_price,
  'EUR',
  true
FROM price_master
WHERE is_active = true;

-- MÉXICO (MXN) - Adaptado al mercado mexicano
-- Tasa aproximada: 1 EUR = 18 MXN
INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, localized_name, localized_description, is_active)
SELECT 
  pm.id,
  'MX',
  ROUND(pm.final_price * 18, 2),
  'MXN',
  CASE pm.code
    -- DERRIBOS
    WHEN '01-D-01' THEN 'MUROS DIVISORIOS DEMOLICIÓN'
    WHEN '01-D-02' THEN 'PICADO AZULEJO MUROS'
    WHEN '01-D-03' THEN 'PICADO PISOS'
    WHEN '01-D-04' THEN 'RETIRO DE PLAFÓN FALSO'
    WHEN '01-D-05' THEN 'RETIRO DE MOLDURAS'
    WHEN '01-D-06' THEN 'RETIRO DE DUELA Y RASTRAS'
    WHEN '01-D-07' THEN 'RETIRO DE RODAPIÉ DE MADERA'
    -- ALBAÑILERÍA
    WHEN '02-A-01' THEN 'MURO DIVISORIO TABLAROCA'
    WHEN '02-A-02' THEN 'MURO DIVISORIO BLOCK'
    WHEN '02-A-03' THEN 'APLANADO DE YESO'
    WHEN '02-A-04' THEN 'FIRME DE CONCRETO'
    WHEN '02-A-05' THEN 'NIVELACIÓN DE PISO'
    WHEN '02-A-06' THEN 'IMPERMEABILIZACIÓN'
    ELSE pm.name
  END,
  CASE pm.code
    WHEN '01-D-01' THEN 'Demolición de muro divisorio existente, incluyendo mano de obra y retiro de escombro.'
    WHEN '01-D-02' THEN 'Picado de muros para retiro de azulejo o revestimiento cerámico existente.'
    WHEN '01-D-03' THEN 'Picado de piso y retiro de escombro.'
    WHEN '01-D-04' THEN 'Retiro y desmontaje de plafón falso de yeso o escayola.'
    WHEN '02-A-01' THEN 'Construcción de muro divisorio con tablaroca sobre estructura metálica.'
    WHEN '02-A-02' THEN 'Construcción de muro divisorio con block de concreto.'
    ELSE pm.description
  END,
  true
FROM price_master pm
WHERE pm.is_active = true;

-- COLOMBIA (COP) - Adaptado al mercado colombiano
-- Tasa aproximada: 1 EUR = 4,500 COP
INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, localized_name, localized_description, is_active)
SELECT 
  pm.id,
  'CO',
  ROUND(pm.final_price * 4500, 0),
  'COP',
  CASE pm.code
    -- DERRIBOS
    WHEN '01-D-01' THEN 'MUROS DIVISORIOS DEMOLICIÓN'
    WHEN '01-D-02' THEN 'PICADO ENCHAPE MUROS'
    WHEN '01-D-03' THEN 'PICADO PISOS'
    WHEN '01-D-04' THEN 'RETIRO DE CIELO RASO'
    WHEN '01-D-05' THEN 'RETIRO DE MOLDURAS'
    WHEN '01-D-06' THEN 'RETIRO DE ENTABLADO Y VIGUETAS'
    WHEN '01-D-07' THEN 'RETIRO DE GUARDA ESCOBA'
    -- ALBAÑILERÍA
    WHEN '02-A-01' THEN 'MURO DIVISORIO DRYWALL'
    WHEN '02-A-02' THEN 'MURO DIVISORIO LADRILLO'
    WHEN '02-A-03' THEN 'PAÑETE Y ESTUCO'
    WHEN '02-A-04' THEN 'PLACA DE CONTRAPISO'
    WHEN '02-A-05' THEN 'NIVELACIÓN DE PISO'
    WHEN '02-A-06' THEN 'IMPERMEABILIZACIÓN'
    ELSE pm.name
  END,
  CASE pm.code
    WHEN '01-D-01' THEN 'Demolición de muro divisorio existente, incluyendo mano de obra y retiro de escombros.'
    WHEN '01-D-02' THEN 'Picado de muros para retiro de enchape cerámico o porcelanato existente.'
    WHEN '01-D-03' THEN 'Picado de piso y posterior retiro de escombros.'
    WHEN '01-D-04' THEN 'Retiro y desmontaje de cielo raso falso.'
    WHEN '02-A-01' THEN 'Construcción de muro divisorio con sistema drywall sobre estructura metálica.'
    WHEN '02-A-02' THEN 'Construcción de muro divisorio con ladrillo tolete o bloque.'
    ELSE pm.description
  END,
  true
FROM price_master pm
WHERE pm.is_active = true;

-- ARGENTINA (ARS) - Adaptado al mercado argentino
-- Tasa aproximada: 1 EUR = 1,100 ARS
INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, localized_name, localized_description, is_active)
SELECT 
  pm.id,
  'AR',
  ROUND(pm.final_price * 1100, 0),
  'ARS',
  CASE pm.code
    -- DERRIBOS
    WHEN '01-D-01' THEN 'TABIQUES DEMOLICIÓN'
    WHEN '01-D-02' THEN 'PICADO AZULEJOS PAREDES'
    WHEN '01-D-03' THEN 'PICADO PISOS'
    WHEN '01-D-04' THEN 'RETIRO DE CIELORRASO'
    WHEN '01-D-05' THEN 'RETIRO DE MOLDURAS'
    WHEN '01-D-06' THEN 'RETIRO DE ENTARIMADO Y VIGUETAS'
    WHEN '01-D-07' THEN 'RETIRO DE ZÓCALO DE MADERA'
    -- ALBAÑILERÍA
    WHEN '02-A-01' THEN 'TABIQUE DURLOCK'
    WHEN '02-A-02' THEN 'TABIQUE LADRILLO'
    WHEN '02-A-03' THEN 'REVOQUE Y ENLUCIDO'
    WHEN '02-A-04' THEN 'CONTRAPISO DE HORMIGÓN'
    WHEN '02-A-05' THEN 'NIVELACIÓN DE PISO'
    WHEN '02-A-06' THEN 'IMPERMEABILIZACIÓN'
    ELSE pm.name
  END,
  CASE pm.code
    WHEN '01-D-01' THEN 'Demolición de tabique existente, incluyendo mano de obra y retiro de escombros.'
    WHEN '01-D-02' THEN 'Picado de paredes para retiro de azulejos o revestimiento cerámico existente.'
    WHEN '01-D-03' THEN 'Picado de piso y posterior retiro de escombros.'
    WHEN '01-D-04' THEN 'Retiro y desmontaje de cielorraso falso de yeso.'
    WHEN '02-A-01' THEN 'Construcción de tabique con sistema Durlock sobre estructura metálica.'
    WHEN '02-A-02' THEN 'Construcción de tabique con ladrillo común o cerámico.'
    ELSE pm.description
  END,
  true
FROM price_master pm
WHERE pm.is_active = true;

-- CHILE (CLP) - Adaptado al mercado chileno
-- Tasa aproximada: 1 EUR = 1,050 CLP
INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, localized_name, localized_description, is_active)
SELECT 
  pm.id,
  'CL',
  ROUND(pm.final_price * 1050, 0),
  'CLP',
  CASE pm.code
    -- DERRIBOS
    WHEN '01-D-01' THEN 'TABIQUES DEMOLICIÓN'
    WHEN '01-D-02' THEN 'PICADO CERÁMICOS MUROS'
    WHEN '01-D-03' THEN 'PICADO PISOS'
    WHEN '01-D-04' THEN 'RETIRO DE CIELO FALSO'
    WHEN '01-D-05' THEN 'RETIRO DE MOLDURAS'
    WHEN '01-D-06' THEN 'RETIRO DE ENTABLADO Y VIGAS'
    WHEN '01-D-07' THEN 'RETIRO DE GUARDAPOLVO'
    -- ALBAÑILERÍA
    WHEN '02-A-01' THEN 'TABIQUE VOLCANITA'
    WHEN '02-A-02' THEN 'TABIQUE LADRILLO'
    WHEN '02-A-03' THEN 'ESTUCO Y ENLUCIDO'
    WHEN '02-A-04' THEN 'RADIER DE HORMIGÓN'
    WHEN '02-A-05' THEN 'NIVELACIÓN DE PISO'
    WHEN '02-A-06' THEN 'IMPERMEABILIZACIÓN'
    ELSE pm.name
  END,
  CASE pm.code
    WHEN '01-D-01' THEN 'Demolición de tabique existente, incluyendo mano de obra y retiro de escombros.'
    WHEN '01-D-02' THEN 'Picado de muros para retiro de cerámicos o revestimiento existente.'
    WHEN '01-D-03' THEN 'Picado de piso y posterior retiro de escombros.'
    WHEN '01-D-04' THEN 'Retiro y desmontaje de cielo falso de yeso o fibra.'
    WHEN '02-A-01' THEN 'Construcción de tabique con sistema Volcanita sobre estructura metálica.'
    WHEN '02-A-02' THEN 'Construcción de tabique con ladrillo princesa o fiscal.'
    ELSE pm.description
  END,
  true
FROM price_master pm
WHERE pm.is_active = true;

-- PERÚ (PEN) - Adaptado al mercado peruano
-- Tasa aproximada: 1 EUR = 4.2 PEN
INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, localized_name, localized_description, is_active)
SELECT 
  pm.id,
  'PE',
  ROUND(pm.final_price * 4.2, 2),
  'PEN',
  CASE pm.code
    -- DERRIBOS
    WHEN '01-D-01' THEN 'MUROS TABIQUERÍA DEMOLICIÓN'
    WHEN '01-D-02' THEN 'PICADO MAYÓLICA MUROS'
    WHEN '01-D-03' THEN 'PICADO PISOS'
    WHEN '01-D-04' THEN 'RETIRO DE FALSO CIELO RASO'
    WHEN '01-D-05' THEN 'RETIRO DE MOLDURAS'
    WHEN '01-D-06' THEN 'RETIRO DE ENTABLADO Y VIGUETAS'
    WHEN '01-D-07' THEN 'RETIRO DE CONTRAZÓCALO'
    -- ALBAÑILERÍA
    WHEN '02-A-01' THEN 'MURO TABIQUERÍA DRYWALL'
    WHEN '02-A-02' THEN 'MURO TABIQUERÍA LADRILLO'
    WHEN '02-A-03' THEN 'TARRAJEO Y ENLUCIDO'
    WHEN '02-A-04' THEN 'FALSO PISO DE CONCRETO'
    WHEN '02-A-05' THEN 'NIVELACIÓN DE PISO'
    WHEN '02-A-06' THEN 'IMPERMEABILIZACIÓN'
    ELSE pm.name
  END,
  CASE pm.code
    WHEN '01-D-01' THEN 'Demolición de muro de tabiquería existente, incluyendo mano de obra y eliminación de desmonte.'
    WHEN '01-D-02' THEN 'Picado de muros para retiro de mayólica o revestimiento cerámico existente.'
    WHEN '01-D-03' THEN 'Picado de piso y posterior eliminación de desmonte.'
    WHEN '01-D-04' THEN 'Retiro y desmontaje de falso cielo raso de yeso o fibra.'
    WHEN '02-A-01' THEN 'Construcción de muro de tabiquería con sistema drywall sobre estructura metálica.'
    WHEN '02-A-02' THEN 'Construcción de muro de tabiquería con ladrillo King Kong o pandereta.'
    ELSE pm.description
  END,
  true
FROM price_master pm
WHERE pm.is_active = true;

-- Mostrar resumen de precios insertados por país
SELECT 
  country_code,
  currency_code,
  COUNT(*) as total_precios,
  ROUND(AVG(final_price), 2) as precio_promedio,
  ROUND(MIN(final_price), 2) as precio_minimo,
  ROUND(MAX(final_price), 2) as precio_maximo
FROM price_master_by_country
WHERE country_code IN ('ES', 'MX', 'CO', 'AR', 'CL', 'PE')
GROUP BY country_code, currency_code
ORDER BY country_code;
