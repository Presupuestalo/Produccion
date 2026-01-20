-- Script para crear y poblar la tabla de precios de Bolivia
-- Moneda: Boliviano (Bs.)

-- Primero eliminamos la tabla si existe
DROP TABLE IF EXISTS price_master_bolivia;

-- Crear la tabla price_master_bolivia con la misma estructura que price_master
CREATE TABLE price_master_bolivia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    category_id UUID REFERENCES price_categories(id),
    subcategory VARCHAR(255),
    description TEXT,
    long_description TEXT,
    unit VARCHAR(50),
    labor_cost DECIMAL(10,2) DEFAULT 0,
    material_cost DECIMAL(10,2) DEFAULT 0,
    equipment_cost DECIMAL(10,2) DEFAULT 0,
    other_cost DECIMAL(10,2) DEFAULT 0,
    base_price DECIMAL(10,2) NOT NULL,
    margin_percentage DECIMAL(5,2) DEFAULT 0,
    final_price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_custom BOOLEAN DEFAULT false,
    user_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertar precios para Bolivia (más de 60 conceptos)
-- Precios ajustados al mercado boliviano en Bolivianos (Bs.)

-- CATEGORÍA: DEMOLICIONES (DERRIBOS)
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, base_price, final_price) VALUES
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES DRYWALL DEMOLICIÓN', 'Demoler tabique existente de drywall, incluyendo mano de obra y eliminación de escombros a punto autorizado.', 'm²', 60.00, 60.00),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PICADO MAYÓLICA PAREDES', 'Picado de paredes para la retirada de mayólica o revestimiento cerámico existente en paredes verticales.', 'm²', 48.00, 48.00),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PICADO PISOS', 'Picado de piso y posterior eliminación de escombros.', 'm²', 70.00, 70.00),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE FALSO CIELO RASO', 'Retirada y eliminación de falso techo de yeso o drywall.', 'm²', 48.00, 48.00),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE MOLDURAS', 'Retirada de molduras de yeso o madera en el perímetro de techos.', 'ml', 5.00, 5.00),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE PISO LAMINADO Y LISTONES', 'Desmontaje de piso laminado o de madera incluyendo los listones inferiores.', 'm²', 28.00, 28.00),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE CONTRAZÓCALO DE MADERA', 'Retirada de contrazócalo de madera y acopio para eliminación.', 'ml', 9.00, 9.00),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE CONTRAZÓCALO CERÁMICO', 'Retirada de contrazócalo cerámico o de mayólica.', 'ml', 19.00, 19.00),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CONTENEDOR ESCOMBROS', 'Suministro, colocación y retirada de contenedor de residuos de obra a vertedero autorizado.', 'Ud', 1700.00, 1700.00),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'HORA BAJADA DE ESCOMBROS', 'Mano de obra por hora dedicada al acarreo y bajada de escombros.', 'H', 50.00, 50.00),
('01-D-11', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ANULACIÓN INSTALACIÓN ELÉCTRICA/FONTANERÍA', 'Desconexión y anulación de líneas antiguas de electricidad y fontanería.', 'Ud', 580.00, 580.00),
('01-D-12', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DESMONTAJE HOJAS PUERTAS Y RETIRADA', 'Desmontaje de hoja de puerta existente y posterior retirada.', 'Ud', 95.00, 95.00),
('01-D-13', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PREPARACIÓN PAREDES (Gotelé/Papel)', 'Raspado de paredes para eliminación de gotelé, papel pintado o materiales blandos.', 'm²', 12.00, 12.00),
('01-D-14', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRADA ELEMENTOS BAÑO (Sanitarios)', 'Desmontaje y retirada de inodoro, bidé, lavabo o bañera.', 'Ud', 580.00, 580.00),
('01-D-15', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRADA DE MOBILIARIO COCINA', 'Desmontaje de muebles altos y bajos de cocina existentes.', 'Ud', 1160.00, 1160.00);

-- CATEGORÍA: ALBAÑILERÍA
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, base_price, final_price) VALUES
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN CONTRAPISO MORTERO', 'Formación de contrapiso de mortero para nivelación y aislamiento (espesor no superior a 7cm).', 'm²', 150.00, 150.00),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CAPA AUTONIVELANTE (<= 15MM)', 'Aplicación de mortero autonivelante de bajo espesor para nivelar pisos.', 'm²', 125.00, 125.00),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN DE TRASDOSADO EN DRYWALL', 'Colocación de una capa de placa de yeso laminado sobre perfilería metálica.', 'm²', 198.00, 198.00),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN TABIQUE LADRILLO', 'Levantamiento de tabique de ladrillo de pequeño formato.', 'm²', 120.00, 120.00),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUES DRYWALL DOBLE CARA', 'Levantamiento de tabique con doble placa de yeso laminado en ambas caras y aislamiento interior.', 'm²', 225.00, 225.00),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ENCHAPE PARED (Colocación MO)', 'Mano de obra de colocación de mayólica o revestimiento cerámico en paredes (No incluye material cerámico).', 'm²', 150.00, 150.00),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'EMBALDOSADO PISOS (Colocación MO)', 'Mano de obra de colocación de baldosas cerámicas o porcelánicas en pisos (No incluye material cerámico).', 'm²', 167.00, 167.00),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'REVOQUE PREVIO ENCHAPES', 'Revoque de las paredes para obtener una base lisa y plomada antes de colocar mayólica.', 'm²', 72.00, 72.00),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'REVOQUE PREVIO LEVANTES TABIQUERÍA', 'Revoque y enlucido de tabiquería nueva antes de pintar.', 'm²', 72.00, 72.00),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ENLUCIDO PAREDES (Yeso)', 'Aplicación de capa de yeso en techos y paredes para acabado liso.', 'm²', 70.00, 70.00),
('02-A-11', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'UNIDAD TAPADO DE ROZAS INSTALACIONES', 'Relleno y tapado de todas las rozas realizadas para el paso de instalaciones de fontanería y electricidad.', 'Ud', 1935.00, 1935.00),
('02-A-12', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'COLOCACIÓN DE MOLDURAS', 'Suministro y colocación de moldura de yeso decorativa.', 'ml', 72.00, 72.00),
('02-A-13', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'BAJADO DE TECHOS (Drywall)', 'Instalación de falso techo en placa de yeso laminado.', 'm²', 130.00, 130.00);

-- CATEGORÍA: FONTANERÍA
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, base_price, final_price) VALUES
('03-F-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RED DE BAÑO (Puntos de consumo)', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) del baño.', 'Ud', 3190.00, 3190.00),
('03-F-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RED DE COCINA (Puntos de consumo)', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) de la cocina.', 'Ud', 2225.00, 2225.00),
('03-F-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RETIRADA BAJANTE Y COLOCACIÓN PVC-110MM', 'Sustitución de tramo de bajante de desagüe.', 'Ud', 1040.00, 1040.00),
('03-F-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'SUMINISTRO Y COLOCACIÓN CONDUCTO EXTRACCIÓN BAÑO', 'Colocación de conducto para extractor de ventilación en baño.', 'Ud', 551.00, 551.00),
('03-F-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN INODORO (Montaje MO)', 'Montaje e instalación del inodoro con sus accesorios.', 'Ud', 242.00, 242.00),
('03-F-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'COLOCACIÓN PLATO DE DUCHA (Montaje MO)', 'Instalación y sellado del plato de ducha.', 'Ud', 483.00, 483.00),
('03-F-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN MUEBLE LAVABO (Montaje MO)', 'Instalación de mueble y lavabo, incluyendo espejo y aplique.', 'Ud', 435.00, 435.00),
('03-F-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN MAMPARA (Montaje MO)', 'Montaje de mampara de ducha o bañera.', 'Ud', 459.00, 459.00),
('03-F-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN GRIFO DUCHA (Montaje MO)', 'Montaje de monomando o termostática de ducha.', 'Ud', 242.00, 242.00),
('03-F-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN GRIFO LAVABO (Montaje MO)', 'Montaje de monomando de lavabo.', 'Ud', 242.00, 242.00);

-- CATEGORÍA: CARPINTERÍA
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, base_price, final_price) VALUES
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'NIVELACIÓN DE PISOS CON TABLERO Y LISTONES', 'Colocación de tablero sobre listones para nivelar un piso antes de instalar piso laminado.', 'm²', 169.00, 169.00),
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN PISO LAMINADO (MO)', 'Mano de obra de colocación de piso laminado flotante.', 'm²', 70.00, 70.00),
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN PISO VINÍLICO (MO)', 'Mano de obra de colocación de piso de vinilo tipo "click".', 'm²', 92.00, 92.00),
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN CONTRAZÓCALO LACADO (MO y Materiales)', 'Suministro y colocación de contrazócalo de madera lacada.', 'ml', 27.00, 27.00),
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'SUMINISTRO Y COLOCACIÓN PREMARCOS (MO)', 'Instalación de premarco de madera o metal para puertas.', 'Ud', 435.00, 435.00),
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA ABATIBLE 1 HOJA (MO)', 'Instalación de puerta abatible en block completo.', 'Ud', 483.00, 483.00),
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA CORREDERA (MO)', 'Instalación de hoja de puerta corredera en su cajetín.', 'Ud', 1112.00, 1112.00),
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA ENTRADA (Blindada) (MO)', 'Instalación de puerta de seguridad blindada.', 'Ud', 2183.00, 2183.00);

-- CATEGORÍA: ELECTRICIDAD
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, base_price, final_price) VALUES
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO GENERAL 18 ELEMENTOS', 'Instalación de tablero eléctrico con 18 módulos y elementos de protección.', 'Ud', 2660.00, 2660.00),
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CANALIZACIÓN TV Y TELECOMUNICACIONES', 'Instalación de red de cableado para TV y voz/datos.', 'Ud', 846.00, 846.00),
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO DE OBRA (Instalación temporal)', 'Colocación de un tablero eléctrico provisional para la reforma.', 'Ud', 1330.00, 1330.00),
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LINEA DE TOMACORRIENTES MONOFÁSICA', 'Tendido de línea de tomacorrientes estándar con cable de 2,5mm².', 'Ud', 1136.00, 1136.00),
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LINEA DE ALUMBRADO', 'Tendido de línea de alumbrado general con cable de 1,5mm².', 'Ud', 1136.00, 1136.00),
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTO DE LUZ SENCILLO', 'Mecanismo e instalación de un punto de luz simple (interruptor + luz).', 'Ud', 169.00, 169.00),
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTOS CONMUTADOS', 'Mecanismo e instalación de un punto de luz que se controla desde dos interruptores.', 'Ud', 266.00, 266.00),
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTOS DE TOMACORRIENTES', 'Mecanismo e instalación de un tomacorriente de pared estándar.', 'Ud', 193.00, 193.00),
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMA DE TV', 'Mecanismo e instalación de toma de antena y telecomunicaciones.', 'Ud', 309.00, 309.00),
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'SUMINISTRO Y COLOCACIÓN FOCOS (MO)', 'Mano de obra por la instalación de focos empotrados en falso techo (focos no incluidos).', 'Ud', 145.00, 145.00);

-- CATEGORÍA: CALEFACCIÓN
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, base_price, final_price) VALUES
('06-CAL-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN DE RADIADOR ELÉCTRICO', 'Instalación y conexión de radiador eléctrico a la línea eléctrica.', 'Ud', 193.00, 193.00),
('06-CAL-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'COLOCACIÓN CALENTADOR DE GAS (Montaje MO)', 'Mano de obra por la instalación completa de un nuevo calentador de gas.', 'Ud', 1838.00, 1838.00),
('06-CAL-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'COLOCACIÓN Y MOVIMIENTO RADIADORES (MO)', 'Instalación de nuevo radiador o movimiento de uno existente.', 'Ud', 290.00, 290.00),
('06-CAL-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN TERMO ELÉCTRICO 80L', 'Instalación y conexionado de termo eléctrico de 80 litros.', 'Ud', 933.00, 933.00);

-- CATEGORÍA: LIMPIEZA
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, base_price, final_price) VALUES
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZAS PERIÓDICAS DE OBRA', 'Mano de obra por la limpieza diaria/semanal de la obra durante el proceso de construcción.', 'Ud', 338.00, 338.00),
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA FINAL DE OBRA', 'Limpieza exhaustiva de fin de obra y retirada de restos menores.', 'Ud', 676.00, 676.00);

-- Consulta de verificación
SELECT 
    pc.name as categoria,
    COUNT(*) as total_precios,
    MIN(pmb.final_price) as precio_minimo,
    MAX(pmb.final_price) as precio_maximo,
    AVG(pmb.final_price) as precio_promedio
FROM price_master_bolivia pmb
JOIN price_categories pc ON pmb.category_id = pc.id
GROUP BY pc.name, pc.display_order
ORDER BY pc.display_order;
