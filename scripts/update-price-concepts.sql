-- Script para añadir los conceptos cortos (subcategory) a la tabla price_master
-- Estos son los conceptos fijos para la IA

-- DERRIBOS
UPDATE public.price_master SET subcategory = 'TABIQUES DERRIBO' WHERE id = '01-D-01';
UPDATE public.price_master SET subcategory = 'PICADO ALICATADO PAREDES' WHERE id = '01-D-02';
UPDATE public.price_master SET subcategory = 'PICADO SUELOS' WHERE id = '01-D-03';
UPDATE public.price_master SET subcategory = 'RETIRADA DE FALSO TECHO' WHERE id = '01-D-04';
UPDATE public.price_master SET subcategory = 'RETIRADA DE MOLDURAS' WHERE id = '01-D-05';
UPDATE public.price_master SET subcategory = 'RETIRADA DE TARIMA MADERA Y RASTRELES' WHERE id = '01-D-06';
UPDATE public.price_master SET subcategory = 'RETIRADA DE RODAPIE DE MADERA' WHERE id = '01-D-07';
UPDATE public.price_master SET subcategory = 'RETIRADA DE RODAPIE CERÁMICO' WHERE id = '01-D-08';
UPDATE public.price_master SET subcategory = 'CONTENEDOR DESESCOMBRO' WHERE id = '01-D-09';
UPDATE public.price_master SET subcategory = 'HR BAJADA DE ESCOMBROS' WHERE id = '01-D-10';
UPDATE public.price_master SET subcategory = 'ANULACIÓN INSTALACIÓN ELÉCTRICA/FONTANERÍA' WHERE id = '01-D-11';
UPDATE public.price_master SET subcategory = 'DESMONTAJE HOJAS PUERTAS Y RETIRADA' WHERE id = '01-D-12';
UPDATE public.price_master SET subcategory = 'PREPARACIÓN PAREDES (Gotelé/Papel)' WHERE id = '01-D-13';
UPDATE public.price_master SET subcategory = 'RETIRADA ELEMENTOS BAÑO (Sanitarios)' WHERE id = '01-D-14';
UPDATE public.price_master SET subcategory = 'RETIRADA DE MOBILIARIO COCINA' WHERE id = '01-D-15';
UPDATE public.price_master SET subcategory = 'RETIRADA DE ARMARIOS Y RESTO MOBILIARIO' WHERE id = '01-D-16';

-- ALBAÑILERÍA
UPDATE public.price_master SET subcategory = 'FORMACIÓN SOLERA MORTERO Y ARLITA' WHERE id = '02-A-01';
UPDATE public.price_master SET subcategory = 'CAPA AUTONIVELANTE (<= 15MM)' WHERE id = '02-A-02';
UPDATE public.price_master SET subcategory = 'FORMACIÓN DE TRASDOSADO EN PLADUR (13+45)' WHERE id = '02-A-03';
UPDATE public.price_master SET subcategory = 'FORMACIÓN TABIQUE LADRILLO' WHERE id = '02-A-04';
UPDATE public.price_master SET subcategory = 'TABIQUES PLADUR DOBLE CARA (13x45x13)' WHERE id = '02-A-05';
UPDATE public.price_master SET subcategory = 'ALICATADOS PARED (Colocación MO)' WHERE id = '02-A-06';
UPDATE public.price_master SET subcategory = 'EMBALDOSADO SUELOS (Colocación MO)' WHERE id = '02-A-07';
UPDATE public.price_master SET subcategory = 'EMBALDOSADO SUELO RADIANTE (Colocación MO)' WHERE id = '02-A-08';
UPDATE public.price_master SET subcategory = 'RASEO PREVIO ALICATADOS' WHERE id = '02-A-09';
UPDATE public.price_master SET subcategory = 'RASEO PREVIO LEVANTES TABIQUERÍA' WHERE id = '02-A-10';
UPDATE public.price_master SET subcategory = 'LUCIDO PAREDES (Yeso o perliescayola)' WHERE id = '02-A-11';
UPDATE public.price_master SET subcategory = 'UNIDAD TAPADO DE ROZAS INSTALACIONES' WHERE id = '02-A-12';
UPDATE public.price_master SET subcategory = 'COLOCACIÓN DE MOLDURAS' WHERE id = '02-A-13';
UPDATE public.price_master SET subcategory = 'COLOCACIÓN CAJETÍN PUERTA CORREDERA (Armazón)' WHERE id = '02-A-14';
UPDATE public.price_master SET subcategory = 'AYUDA A GREMIOS (Limpieza, acopio, transporte)' WHERE id = '02-A-15';
UPDATE public.price_master SET subcategory = 'BAJADO DE TECHOS (Pladur BA 15)' WHERE id = '02-A-16';
UPDATE public.price_master SET subcategory = 'AISLANTES TÉRMICOS (Algodón regenerado)' WHERE id = '02-A-17';

-- FONTANERÍA
UPDATE public.price_master SET subcategory = 'RED DE BAÑO (Puntos de consumo: Inodoro, Lavabo, etc.)' WHERE id = '03-F-01';
UPDATE public.price_master SET subcategory = 'RED DE COCINA (Puntos de consumo: Fregadero, L. etc.)' WHERE id = '03-F-02';
UPDATE public.price_master SET subcategory = 'RETIRADA BAJANTE FECALES Y COLOCACIÓN PVC-110MM' WHERE id = '03-F-03';
UPDATE public.price_master SET subcategory = 'SUMINISTRO Y COLOCACIÓN CONDUCTO EXTRACCIÓN BAÑO' WHERE id = '03-F-04';
UPDATE public.price_master SET subcategory = 'SUMINISTRO Y COLOCACIÓN CONDUCTO CAMPANA EXTRACTORA' WHERE id = '03-F-05';
UPDATE public.price_master SET subcategory = 'INSTALACIÓN INODORO (Montaje MO)' WHERE id = '03-F-06';
UPDATE public.price_master SET subcategory = 'COLOCACIÓN PLATO DE DUCHA (Montaje MO)' WHERE id = '03-F-07';
UPDATE public.price_master SET subcategory = 'INSTALACIÓN MUEBLE LAVABO (Montaje MO)' WHERE id = '03-F-08';
UPDATE public.price_master SET subcategory = 'INSTALACIÓN MAMPARA (Montaje MO)' WHERE id = '03-F-09';
UPDATE public.price_master SET subcategory = 'INSTALACIÓN GRIFO DUCHA (Montaje MO)' WHERE id = '03-F-10';
UPDATE public.price_master SET subcategory = 'INSTALACIÓN GRIFO LAVABO (Montaje MO)' WHERE id = '03-F-11';
UPDATE public.price_master SET subcategory = 'MONTAJE FREGADERO, LAVADORA Y LAVAVAJILLAS (MO)' WHERE id = '03-F-12';
UPDATE public.price_master SET subcategory = 'MONTAJE Y COLOCACIÓN CAMPANA EXTRACTORA COCINA (MO)' WHERE id = '03-F-13';

-- CARPINTERÍA
UPDATE public.price_master SET subcategory = 'NIVELACIÓN DE SUELOS CON TABLERO Y RASTRELES' WHERE id = '04-C-01';
UPDATE public.price_master SET subcategory = 'INSTALACIÓN PARQUET FLOTANTE (MO)' WHERE id = '04-C-02';
UPDATE public.price_master SET subcategory = 'INSTALACIÓN SUELO VINÍLICO (MO)' WHERE id = '04-C-03';
UPDATE public.price_master SET subcategory = 'COLOCACIÓN RODAPIÉ DM LACADO (MO y Materiales)' WHERE id = '04-C-04';
UPDATE public.price_master SET subcategory = 'SUMINISTRO Y COLOCACIÓN PREMARCOS (MO)' WHERE id = '04-C-05';
UPDATE public.price_master SET subcategory = 'SUMINISTRO Y COLOCACIÓN FORRO (MARCOS SIN PUERTA) (MO)' WHERE id = '04-C-06';
UPDATE public.price_master SET subcategory = 'COLOCACIÓN PUERTA ABATIBLE 1 HOJA (MO)' WHERE id = '04-C-07';
UPDATE public.price_master SET subcategory = 'COLOCACIÓN PUERTA CORREDERA (MO)' WHERE id = '04-C-08';
UPDATE public.price_master SET subcategory = 'COLOCACIÓN PUERTA ENTRADA (Blindada) (MO)' WHERE id = '04-C-09';
UPDATE public.price_master SET subcategory = 'ACUCHILLADO SUELO + BARNIZADO' WHERE id = '04-C-10';
UPDATE public.price_master SET subcategory = 'EMPLASTECIDO DE LAS LAMAS DE TARIMA' WHERE id = '04-C-11';
UPDATE public.price_master SET subcategory = 'REBAJE DE PUERTAS' WHERE id = '04-C-12';

-- ELECTRICIDAD
UPDATE public.price_master SET subcategory = 'CUADRO GENERAL 18 ELEMENTOS' WHERE id = '05-E-01';
UPDATE public.price_master SET subcategory = 'CANALIZACIÓN TV Y TELECOMUNICACIONES' WHERE id = '05-E-02';
UPDATE public.price_master SET subcategory = 'SUMINISTRO E INSTALACIÓN PORTERO CONVENCIONAL' WHERE id = '05-E-03';
UPDATE public.price_master SET subcategory = 'CUADRO DE OBRA (Instalación temporal)' WHERE id = '05-E-04';
UPDATE public.price_master SET subcategory = 'LINEA DE ENCHUFES MONOFÁSICA (2,5mm2)' WHERE id = '05-E-05';
UPDATE public.price_master SET subcategory = 'LINEA DE ALUMBRADO (1,5mm2)' WHERE id = '05-E-06';
UPDATE public.price_master SET subcategory = 'PUNTO DE LUZ SENCILLOS' WHERE id = '05-E-07';
UPDATE public.price_master SET subcategory = 'PUNTOS CONMUTADOS' WHERE id = '05-E-08';
UPDATE public.price_master SET subcategory = 'PUNTOS DE CRUZAMIENTO' WHERE id = '05-E-09';
UPDATE public.price_master SET subcategory = 'PUNTOS DE ENCHUFES' WHERE id = '05-E-10';
UPDATE public.price_master SET subcategory = 'PUNTO ENCHUFE INTEMPERIE' WHERE id = '05-E-11';
UPDATE public.price_master SET subcategory = 'TOMA DE TV' WHERE id = '05-E-12';
UPDATE public.price_master SET subcategory = 'PUNTOS ENCHUFE APARATOS DE COCINA' WHERE id = '05-E-13';
UPDATE public.price_master SET subcategory = 'SUMINISTRO Y COLOCACIÓN FOCOS (MO)' WHERE id = '05-E-14';
UPDATE public.price_master SET subcategory = 'TIMBRE DE PUERTA ENTRADA' WHERE id = '05-E-15';
UPDATE public.price_master SET subcategory = 'LÍNEA DE CUATRO PARA CALEFACCIÓN ELÉCTRICA' WHERE id = '05-E-16';
UPDATE public.price_master SET subcategory = 'BOLETÍN Y LEGALIZACIÓN' WHERE id = '05-E-17';

-- CALEFACCIÓN
UPDATE public.price_master SET subcategory = 'INSTALACIÓN DE RADIADOR ELÉCTRICO' WHERE id = '06-CAL-01';
UPDATE public.price_master SET subcategory = 'RECOLOCAR CALDERA DE GAS-SIN DESPLAZAMIENTO' WHERE id = '06-CAL-02';
UPDATE public.price_master SET subcategory = 'COLOCACIÓN CALDERA DE GAS (Montaje MO)' WHERE id = '06-CAL-03';
UPDATE public.price_master SET subcategory = 'RED ALIMENTACIÓN POR RADIADOR' WHERE id = '06-CAL-04';
UPDATE public.price_master SET subcategory = 'COLOCACIÓN Y MOVIMIENTO RADIADORES (MO)' WHERE id = '06-CAL-05';
UPDATE public.price_master SET subcategory = 'LEGALIZACIÓN INSTALACIÓN (Certificación)' WHERE id = '06-CAL-06';
UPDATE public.price_master SET subcategory = 'INSTALACIÓN SUELO RADIANTE HÚMEDO' WHERE id = '06-CAL-07';
UPDATE public.price_master SET subcategory = 'ACOMETIDA DE GAS (Aprox.)' WHERE id = '06-CAL-08';
UPDATE public.price_master SET subcategory = 'CAMBIO DE RACORES RADIADOR' WHERE id = '06-CAL-09';
UPDATE public.price_master SET subcategory = 'INSTALACIÓN TERMO FLECK DUO 80L' WHERE id = '06-CAL-10';

-- LIMPIEZA
UPDATE public.price_master SET subcategory = 'LIMPIEZAS PERIÓDICAS DE OBRA' WHERE id = '07-L-01';
UPDATE public.price_master SET subcategory = 'LIMPIEZA FINAL DE OBRA' WHERE id = '07-L-02';

-- MATERIALES
UPDATE public.price_master SET subcategory = 'PLATO DE DUCHA DE RESINA BLANCO' WHERE id = '08-M-01';
UPDATE public.price_master SET subcategory = 'VÁLVULA PARA PLATO DE DUCHA' WHERE id = '08-M-02';
UPDATE public.price_master SET subcategory = 'INODORO' WHERE id = '08-M-03';
UPDATE public.price_master SET subcategory = 'MONOMANDO LAVABO' WHERE id = '08-M-04';
UPDATE public.price_master SET subcategory = 'DUCHA TERMOSTÁTICA' WHERE id = '08-M-05';
UPDATE public.price_master SET subcategory = 'MAMPARA DE DUCHA' WHERE id = '08-M-06';
UPDATE public.price_master SET subcategory = 'CONJUNTO DE MUEBLE CON LAVABO' WHERE id = '08-M-07';
UPDATE public.price_master SET subcategory = 'BALDOSA Y AZULEJO' WHERE id = '08-M-08';
UPDATE public.price_master SET subcategory = 'PARQUET FLOTANTE' WHERE id = '08-M-09';
UPDATE public.price_master SET subcategory = 'SUELO VINÍLICO CLIC' WHERE id = '08-M-10';
UPDATE public.price_master SET subcategory = 'MANTA SUELO PARQUET FLOTANTE' WHERE id = '08-M-11';
UPDATE public.price_master SET subcategory = 'SUMINISTRO RODAPIÉ DM LACADO' WHERE id = '08-M-12';
UPDATE public.price_master SET subcategory = 'PUERTA ABATIBLE EN BLOCK UNA HOJA' WHERE id = '08-M-13';
UPDATE public.price_master SET subcategory = 'CAJÓN PUERTA CORREDERA' WHERE id = '08-M-14';
UPDATE public.price_master SET subcategory = 'PUERTA CORREDERA EN KIT' WHERE id = '08-M-15';
UPDATE public.price_master SET subcategory = 'PUERTA ENTRADA' WHERE id = '08-M-16';
UPDATE public.price_master SET subcategory = 'FORRO PUERTA ENTRADA' WHERE id = '08-M-17';
UPDATE public.price_master SET subcategory = 'CALDERA CONDENSACIÓN' WHERE id = '08-M-18';
UPDATE public.price_master SET subcategory = 'RADIADOR ELÉCTRICO' WHERE id = '08-M-19';
UPDATE public.price_master SET subcategory = 'RADIADORES' WHERE id = '08-M-20';
UPDATE public.price_master SET subcategory = 'RADIADOR TOALLERO' WHERE id = '08-M-21';
UPDATE public.price_master SET subcategory = 'TERMOSTATO AMBIENTE' WHERE id = '08-M-22';
UPDATE public.price_master SET subcategory = 'TERMO ELÉCTRICO' WHERE id = '08-M-23';
