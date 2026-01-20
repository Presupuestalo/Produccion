DROP TABLE IF EXISTS price_master_bolivia;

CREATE TABLE price_master_bolivia (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT NOT NULL UNIQUE,
  category_id TEXT NOT NULL REFERENCES price_categories(id),
  subcategory TEXT,
  description TEXT,
  long_description TEXT,
  unit TEXT NOT NULL,
  base_price DECIMAL(10,2),
  final_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Limpiar datos existentes si los hay
DELETE FROM price_master_bolivia;

-- CATEGORÍA: DERRIBOS (5b38410c-4b7b-412a-9f57-6e74db0cc237)
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, base_price, final_price) VALUES
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES DRYWALL DEMOLICIÓN', 'Demoler tabique existente de drywall, incluyendo mano de obra y eliminación de escombros a punto autorizado.', 'm²', 17.28, 65.00),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PICADO MAYÓLICA PAREDES', 'Picado de paredes para la retirada de mayólica o revestimiento cerámico existente en paredes verticales.', 'm²', 14.40, 55.00),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PICADO PISOS', 'Picado de piso y posterior eliminación de escombros.', 'm²', 21.17, 80.00),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE FALSO CIELO RASO', 'Retiro y eliminación de falso techo de yeso o drywall.', 'm²', 14.40, 55.00),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE MOLDURAS', 'Retiro de molduras de yeso o madera en el perímetro de techos.', 'ml', 1.44, 6.00),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE PISO LAMINADO Y LISTONES', 'Desmontaje de piso laminado o piso de madera incluyendo los listones inferiores.', 'm²', 8.64, 32.00),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE CONTRAZÓCALO DE MADERA', 'Retiro de contrazócalo de madera y acopio para eliminación.', 'ml', 2.59, 10.00),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE CONTRAZÓCALO CERÁMICO', 'Retiro de contrazócalo cerámico o de mayólica.', 'ml', 5.62, 21.00),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CONTENEDOR ESCOMBROS', 'Suministro, colocación y retiro de contenedor de residuos de obra a vertedero autorizado.', 'Ud', 504.00, 1900.00),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'HORA BAJADA DE ESCOMBROS', 'Mano de obra por hora dedicada al acarreo y bajada de escombros.', 'H', 18.00, 65.00),
('01-D-11', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ANULACIÓN INSTALACIÓN ELÉCTRICA/FONTANERÍA', 'Desconexión y anulación de líneas antiguas.', 'Ud', 172.80, 650.00),
('01-D-12', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DESMONTAJE HOJAS PUERTAS Y RETIRADA', 'Desmontaje de hoja de puerta existente y posterior retirada.', 'Ud', 28.80, 110.00);

-- CATEGORÍA: ALBAÑILERÍA (d6e90b3f-3bc5-4f15-8530-19da496abc5e)
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, base_price, final_price) VALUES
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN CONTRAPISO MORTERO', 'Formación de contrapiso de mortero para nivelación y aislamiento (espesor no superior a 7cm).', 'm²', 44.64, 170.00),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CAPA AUTONIVELANTE (<= 15MM)', 'Aplicación de mortero autonivelante de bajo espesor.', 'm²', 37.44, 140.00),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN DE TRASDOSADO EN DRYWALL', 'Colocación de una capa de placa de yeso laminado de 13mm sobre perfilería.', 'm²', 59.04, 220.00),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN TABIQUE LADRILLO', 'Levantamiento de tabique de ladrillo de pequeño formato.', 'm²', 36.00, 135.00),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUES DRYWALL DOBLE CARA', 'Levantamiento de tabique con doble placa de yeso laminado de 13mm en ambas caras y aislamiento interior.', 'm²', 66.96, 250.00),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ENCHAPE PARED (Colocación MO)', 'Mano de obra de colocación de mayólica o revestimiento cerámico en paredes (No incluye material cerámico).', 'm²', 44.64, 170.00),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'EMBALDOSADO PISOS (Colocación MO)', 'Mano de obra de colocación de baldosas cerámicas o porcelánicas en pisos (No incluye material cerámico).', 'm²', 49.68, 185.00),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TARRAJEO PAREDES', 'Tarrajeo y enlucido de paredes para obtener una base lisa antes de pintar.', 'm²', 21.60, 80.00),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ENLUCIDO PAREDES (Yeso)', 'Aplicación de capa de yeso en techos y paredes.', 'm²', 20.74, 78.00),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TAPADO DE ROZAS INSTALACIONES', 'Relleno y tapado de todas las rozas realizadas para el paso de instalaciones de fontanería y electricidad.', 'Ud', 576.00, 2150.00);

-- CATEGORÍA: FONTANERÍA (3d93ed2f-bfec-4f36-834e-2d3c4d7d7260)
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, base_price, final_price) VALUES
('03-F-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RED DE BAÑO COMPLETA', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) del baño.', 'Ud', 950.40, 3550.00),
('03-F-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RED DE COCINA COMPLETA', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) de la cocina.', 'Ud', 662.40, 2480.00),
('03-F-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RETIRADA BAJANTE Y COLOCACIÓN PVC-110MM', 'Sustitución de tramo de bajante.', 'Ud', 309.60, 1160.00),
('03-F-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CONDUCTO EXTRACCIÓN BAÑO', 'Colocación de conducto para extractor de ventilación en baño.', 'Ud', 164.16, 615.00),
('03-F-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CONDUCTO CAMPANA EXTRACTORA', 'Colocación de conducto para campana extractora de humos.', 'Ud', 259.20, 970.00),
('03-F-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN INODORO (Montaje MO)', 'Montaje e instalación del inodoro.', 'Ud', 72.00, 270.00),
('03-F-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'COLOCACIÓN PLATO DE DUCHA (Montaje MO)', 'Instalación y sellado del plato de ducha.', 'Ud', 144.00, 540.00),
('03-F-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN MUEBLE LAVABO (Montaje MO)', 'Instalación de mueble y lavabo, incluyendo espejo y aplique.', 'Ud', 129.60, 485.00),
('03-F-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN GRIFO DUCHA (Montaje MO)', 'Montaje de monomando o termostática de ducha.', 'Ud', 72.00, 270.00),
('03-F-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN GRIFO LAVABO (Montaje MO)', 'Montaje de monomando de lavabo.', 'Ud', 72.00, 270.00);

-- CATEGORÍA: CARPINTERÍA (e4967edd-53b5-459a-bb68-b1fd88ee6836)
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, base_price, final_price) VALUES
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'NIVELACIÓN PISOS CON TABLERO', 'Colocación de tablero sobre listones para nivelar un piso antes de instalar piso laminado.', 'm²', 50.40, 190.00),
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN PISO LAMINADO (MO)', 'Mano de obra de colocación de piso laminado o suelo laminado.', 'm²', 20.88, 78.00),
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN PISO VINÍLICO (MO)', 'Mano de obra de colocación de piso de vinilo tipo "click".', 'm²', 27.36, 102.00),
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN CONTRAZÓCALO LACADO (MO)', 'Suministro y colocación de contrazócalo.', 'ml', 8.06, 30.00),
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PREMARCOS (MO)', 'Instalación de premarco.', 'Ud', 129.60, 485.00),
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA ABATIBLE (MO)', 'Instalación de puerta abatible en block.', 'Ud', 144.00, 540.00),
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA CORREDERA (MO)', 'Instalación de hoja de puerta corredera en su cajetín.', 'Ud', 331.20, 1240.00),
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA ENTRADA (MO)', 'Instalación de puerta de seguridad.', 'Ud', 650.00, 2430.00);

-- CATEGORÍA: ELECTRICIDAD (243dee0d-edba-4de9-94a4-2a4c17ff607d)
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, base_price, final_price) VALUES
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO GENERAL 18 ELEMENTOS', 'Instalación de tablero eléctrico con 18 módulos y elementos de protección.', 'Ud', 792.00, 2960.00),
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CANALIZACIÓN TV Y TELECOMUNICACIONES', 'Instalación de red de cableado para TV y voz/datos.', 'Ud', 252.00, 940.00),
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO DE OBRA (Instalación temporal)', 'Colocación de un tablero eléctrico provisional para la reforma.', 'Ud', 396.00, 1480.00),
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LINEA DE ENCHUFES MONOFÁSICA', 'Tendido de línea de enchufes estándar.', 'Ud', 338.40, 1265.00),
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LINEA DE ALUMBRADO', 'Tendido de línea de alumbrado general.', 'Ud', 338.40, 1265.00),
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTO DE LUZ SIMPLE', 'Mecanismo e instalación de un punto de luz simple (interruptor + luz).', 'Ud', 50.40, 188.00),
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTOS CONMUTADOS', 'Mecanismo e instalación de un punto de luz que se controla desde dos interruptores.', 'Ud', 79.20, 296.00),
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTOS DE ENCHUFES', 'Mecanismo e instalación de un enchufe de pared estándar.', 'Ud', 57.60, 215.00),
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMA DE TV', 'Mecanismo e instalación de toma de antena y telecomunicaciones.', 'Ud', 92.16, 344.00),
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'BOLETÍN Y LEGALIZACIÓN', 'Emisión del certificado de instalación eléctrica y legalización.', 'Ud', 350.00, 1310.00);

-- CATEGORÍA: CALEFACCIÓN (5090928c-9b72-4d83-8667-9d01ddbfca47)
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, base_price, final_price) VALUES
('06-CAL-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN DE RADIADOR ELÉCTRICO', 'Instalación y conexión a la línea eléctrica.', 'Ud', 57.60, 215.00),
('06-CAL-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'COLOCACIÓN CALENTADOR DE GAS (MO)', 'Mano de obra por la instalación completa de un nuevo calentador.', 'Ud', 547.20, 2045.00),
('06-CAL-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'RED ALIMENTACIÓN POR RADIADOR', 'Instalación de tubería multicapa desde el colector hasta el radiador.', 'Ud', 259.20, 970.00),
('06-CAL-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'COLOCACIÓN RADIADORES (MO)', 'Instalación de nuevo radiador o movimiento de uno existente.', 'Ud', 86.40, 323.00),
('06-CAL-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN TERMO ELÉCTRICO 80L', 'Instalación y conexionado de termo eléctrico.', 'Ud', 277.92, 1040.00);

-- CATEGORÍA: LIMPIEZA (0f95a55f-12ba-4e0e-ba0d-d01229d05c4c)
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, base_price, final_price) VALUES
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZAS PERIÓDICAS DE OBRA', 'Mano de obra por la limpieza diaria/semanal de la obra.', 'Ud', 100.80, 377.00),
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA FINAL DE OBRA', 'Limpieza exhaustiva de fin de obra y retirada de restos menores.', 'Ud', 200.00, 748.00);

-- Consulta de verificación
SELECT 
  pc.name as categoria,
  COUNT(*) as total_precios,
  MIN(pmb.final_price) as precio_minimo,
  MAX(pmb.final_price) as precio_maximo,
  ROUND(AVG(pmb.final_price), 2) as precio_promedio
FROM price_master_bolivia pmb
JOIN price_categories pc ON pmb.category_id = pc.id
GROUP BY pc.name, pc.display_order
ORDER BY pc.display_order;
