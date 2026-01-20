DROP TABLE IF EXISTS price_master_bolivia;

CREATE TABLE price_master_bolivia (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category_id TEXT NOT NULL REFERENCES price_categories(id),
  subcategory TEXT,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  unit TEXT NOT NULL,
  base_price DECIMAL(10,2),
  final_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DERRIBOS (5b38410c-4b7b-412a-9f57-6e74db0cc237)
INSERT INTO price_master_bolivia (category_id, subcategory, code, description, long_description, unit, final_price) VALUES
('5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES DRYWALL DEMOLICIÓN', '01-D-01', 'Demoler tabique existente de drywall, incluyendo mano de obra y eliminación de escombros a punto autorizado.', 'Demolición completa de tabique de drywall o yeso laminado, incluyendo la mano de obra necesaria y el transporte de escombros a vertedero autorizado.', 'm²', 65.50),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PICADO MAYÓLICA PAREDES', '01-D-02', 'Picado de paredes para la retirada de mayólica o revestimiento cerámico existente en paredes.', 'Trabajo de picado y retiro de azulejos, mayólicas o cerámicos de paredes verticales, incluyendo limpieza básica.', 'm²', 54.50),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PICADO PISOS', '01-D-03', 'Picado de piso y posterior eliminación de escombros.', 'Demolición de piso cerámico, porcelanato o similar, incluyendo mortero base y transporte de escombros.', 'm²', 79.80),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE FALSO CIELO RASO', '01-D-04', 'Retirada y eliminación de falso techo de yeso o drywall.', 'Desmontaje completo de cielo raso falso de yeso, escayola o drywall, incluyendo estructura y limpieza.', 'm²', 54.50),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE MOLDURAS', '01-D-05', 'Retirada de molduras de yeso o madera en el perímetro de techos.', 'Desmontaje cuidadoso de molduras decorativas de cielos rasos, en yeso o madera.', 'ml', 6.05),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE PISO LAMINADO Y LISTONES', '01-D-06', 'Desmontaje de piso flotante o laminado incluyendo los listones inferiores.', 'Retiro completo de piso laminado tipo flotante, incluyendo base de listones de madera y limpieza.', 'm²', 32.30),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE CONTRAZÓCALO DE MADERA', '01-D-07', 'Retirada de contrazócalo de madera y acopio para eliminación.', 'Desmontaje de guardapolvo o contrazócalo de madera, incluyendo extracción de clavos y limpieza.', 'ml', 10.10),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE CONTRAZÓCALO CERÁMICO', '01-D-08', 'Retirada de contrazócalo cerámico o de azulejo.', 'Picado y retiro de guardapolvo cerámico o de mayólica, incluyendo limpieza de la zona.', 'ml', 21.20),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CONTENEDOR ESCOMBROS', '01-D-09', 'Suministro, colocación y retirada de contenedor de residuos de obra a vertedero autorizado.', 'Alquiler de contenedor para escombros, incluyendo transporte, colocación, retirada y disposición final en vertedero autorizado.', 'Ud', 1920.00),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', 'HORA BAJADA DE ESCOMBROS', '01-D-10', 'Mano de obra por hora dedicada al acarreo y bajada de escombros.', 'Trabajo manual de carga, transporte y bajada de escombros desde el lugar de trabajo hasta el contenedor o punto de acopio.', 'H', 52.50),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ANULACIÓN INSTALACIÓN ELÉCTRICA/FONTANERÍA', '01-D-11', 'Desconexión y anulación de líneas antiguas de electricidad o fontanería.', 'Trabajo de desconexión segura de instalaciones eléctricas y de fontanería obsoletas, incluyendo sellado de puntos.', 'Ud', 151.50),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DESMONTAJE HOJAS PUERTAS Y RETIRADA', '01-D-12', 'Desmontaje de hoja de puerta existente y posterior retirada.', 'Retiro de puertas incluyendo bisagras, manijas y marcos si es necesario, con acopio para eliminación.', 'Ud', 25.25),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PREPARACIÓN PAREDES (Gotelé/Papel)', '01-D-13', 'Rascado de paredes para eliminación de gotelé, papel pintado o materiales blandos.', 'Trabajo de preparación de superficies mediante rascado o lijado para eliminar acabados antiguos.', 'm²', 31.60),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRADA ELEMENTOS BAÑO (Sanitarios)', '01-D-14', 'Desmontaje y retirada de inodoro, bidé, lavabo o bañera.', 'Desinstalación completa de aparatos sanitarios, incluyendo desconexión de agua y desagüe.', 'Ud', 151.50),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRADA DE MOBILIARIO COCINA', '01-D-15', 'Desmontaje de muebles altos y bajos de cocina existentes.', 'Retiro completo de muebles de cocina, incluyendo puertas, cajones, estantes y estructura.', 'Ud', 303.00),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRADA DE ARMARIOS Y RESTO MOBILIARIO', '01-D-16', 'Desmontaje de armarios empotrados o mobiliario fijo a medida.', 'Desinstalación de armarios empotrados, closets o muebles fijos, incluyendo puertas y estructura interna.', 'Ud', 452.00);

-- ALBAÑILERÍA (d6e90b3f-3bc5-4f15-8530-19da496abc5e)
INSERT INTO price_master_bolivia (category_id, subcategory, code, description, long_description, unit, final_price) VALUES
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN CONTRAPISO MORTERO', '02-A-01', 'Formación de contrapiso de mortero para nivelación y aislamiento (espesor no superior a 7cm).', 'Construcción de base de mortero para nivelar pisos, incluyendo materiales, mano de obra y compactación.', 'm²', 39.15),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CAPA AUTONIVELANTE (<= 15MM)', '02-A-02', 'Aplicación de mortero autonivelante de bajo espesor para acabado de pisos.', 'Colocación de mortero autonivelante para obtener superficie perfectamente plana, ideal para pisos laminados.', 'm²', 32.85),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN DE TRASDOSADO EN DRYWALL', '02-A-03', 'Colocación de una capa de placa de yeso laminado sobre perfilería metálica.', 'Instalación de sistema de drywall para revestir paredes, incluyendo perfiles, placas y fijaciones.', 'm²', 51.80),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN TABIQUE LADRILLO', '02-A-04', 'Levantamiento de tabique de ladrillo de pequeño formato.', 'Construcción de pared divisoria con ladrillo hueco o macizo, incluyendo mortero y mano de obra.', 'm²', 31.60),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUES DRYWALL DOBLE CARA', '02-A-05', 'Levantamiento de tabique con doble placa de yeso laminado en ambas caras y aislamiento interior.', 'Sistema completo de tabiquería en drywall con doble placa por lado, perfilería metálica y aislamiento acústico.', 'm²', 58.75),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ENCHAPE PARED (Colocación MO)', '02-A-06', 'Mano de obra de colocación de mayólica o revestimiento cerámico en paredes (No incluye material cerámico).', 'Trabajo de instalación de cerámicos en paredes, incluyendo pegamento, nivelación y fragüe. Material cerámico no incluido.', 'm²', 39.15),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', 'EMBALDOSADO SUELOS (Colocación MO)', '02-A-07', 'Mano de obra de colocación de baldosas cerámicas o porcelanato en suelos (No incluye material cerámico).', 'Instalación de pisos cerámicos o porcelanato, incluyendo pegamento, nivelación y fragüe. Material no incluido.', 'm²', 43.60),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TARRAJEO PREVIO ENCHAPES', '02-A-08', 'Tarrajeo de las paredes para obtener una base lisa y plomada antes de colocar cerámicos.', 'Aplicación de mortero fino en paredes para nivelar y preparar superficie antes del enchape cerámico.', 'm²', 18.95),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TARRAJEO PREVIO TABIQUERÍA', '02-A-09', 'Tarrajeo y enlucido de tabiquería nueva antes de pintar.', 'Acabado fino de paredes nuevas con mortero o yeso, listo para recibir pintura.', 'm²', 18.95),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ENLUCIDO PAREDES (Yeso)', '02-A-10', 'Aplicación de capa de yeso en techos y paredes para acabado liso.', 'Trabajo de enlucido fino con yeso para obtener superficies lisas y uniformes.', 'm²', 18.20),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TAPADO DE ROZAS INSTALACIONES', '02-A-11', 'Relleno y tapado de todas las rozas realizadas para el paso de instalaciones.', 'Cierre de canales en paredes donde se instalaron tuberías y cables, con mortero y nivelación.', 'Ud', 505.00),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', 'COLOCACIÓN DE MOLDURAS', '02-A-12', 'Suministro y colocación de moldura de yeso o poliestireno.', 'Instalación de molduras decorativas en perímetro de cielos rasos, incluyendo material y fijación.', 'ml', 18.95),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', 'COLOCACIÓN CAJÓN PUERTA CORREDERA', '02-A-13', 'Instalación y tarrajeo del armazón metálico para puerta corredera.', 'Montaje de estructura metálica empotrada en pared para sistema de puerta corredera, incluyendo acabado.', 'Ud', 240.00),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', 'AYUDA A GREMIOS', '02-A-14', 'Asistencia de albañilería a fontaneros, electricistas o carpinteros.', 'Apoyo de albañil para trabajos complementarios de otros oficios, incluyendo limpieza y acarreo.', 'Ud', 379.00),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', 'BAJADO DE TECHOS (Drywall)', '02-A-15', 'Instalación de falso techo en placa de yeso laminado.', 'Sistema completo de cielo raso falso en drywall, incluyendo estructura metálica, placas y acabado.', 'm²', 34.00),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', 'AISLANTES TÉRMICOS', '02-A-16', 'Suministro y colocación de aislamiento térmico o acústico.', 'Instalación de material aislante (lana de vidrio, poliestireno, etc.) en paredes o techos.', 'm²', 16.65);

-- FONTANERÍA (3d93ed2f-bfec-4f36-834e-2d3c4d7d7260)
INSERT INTO price_master_bolivia (category_id, subcategory, code, description, long_description, unit, final_price) VALUES
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RED DE BAÑO COMPLETA', '03-F-01', 'Renovación completa de red de agua fría y caliente del baño.', 'Instalación nueva de toda la red de fontanería del baño, incluyendo tuberías, conexiones y puntos de consumo.', 'Ud', 833.50),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RED DE COCINA COMPLETA', '03-F-02', 'Renovación completa de red de agua fría y caliente de la cocina.', 'Instalación nueva de red de fontanería de cocina, incluyendo puntos para fregadero, lavadora y lavavajillas.', 'Ud', 581.00),
('3d93ed2f-bfec-4f36-834e-2d7d7260', 'RETIRADA BAJANTE Y COLOCACIÓN PVC-110MM', '03-F-03', 'Sustitución de tramo de bajante de desagüe.', 'Cambio de tubería de desagüe vertical, incluyendo retiro de antigua y colocación de nueva en PVC.', 'Ud', 271.50),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CONDUCTO EXTRACCIÓN BAÑO', '03-F-04', 'Colocación de conducto para extractor de ventilación en baño.', 'Instalación de ducto de ventilación para extractor de aire en baño, incluyendo materiales y mano de obra.', 'Ud', 144.00),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CONDUCTO CAMPANA EXTRACTORA', '03-F-05', 'Colocación de conducto para campana extractora de humos.', 'Instalación de ducto de extracción de humos de cocina, desde campana hasta salida exterior.', 'Ud', 227.30),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN INODORO (Montaje MO)', '03-F-06', 'Montaje e instalación del inodoro.', 'Trabajo de instalación de inodoro, incluyendo conexión a desagüe, agua y sellado. Inodoro no incluido.', 'Ud', 63.15),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'COLOCACIÓN PLATO DE DUCHA (Montaje MO)', '03-F-07', 'Instalación y sellado del plato de ducha.', 'Montaje de plato de ducha, incluyendo nivelación, conexión a desagüe y sellado. Plato no incluido.', 'Ud', 126.30),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN MUEBLE LAVABO (Montaje MO)', '03-F-08', 'Instalación de mueble y lavabo, incluyendo espejo y aplique.', 'Montaje completo de mueble de baño con lavabo, grifería, espejo y accesorios. Materiales no incluidos.', 'Ud', 113.65),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN MAMPARA (Montaje MO)', '03-F-09', 'Montaje de mampara de ducha o bañera.', 'Instalación de mampara de vidrio o acrílico, incluyendo perfiles, sellado y ajustes. Mampara no incluida.', 'Ud', 120.00),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN GRIFO DUCHA (Montaje MO)', '03-F-10', 'Montaje de monomando o termostática de ducha.', 'Instalación de grifería de ducha, incluyendo conexiones y pruebas. Grifo no incluido.', 'Ud', 63.15),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN GRIFO LAVABO (Montaje MO)', '03-F-11', 'Montaje de monomando de lavabo.', 'Instalación de grifería de lavabo, incluyendo conexiones y ajustes. Grifo no incluido.', 'Ud', 63.15),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'MONTAJE FREGADERO Y ELECTRODOMÉSTICOS', '03-F-12', 'Instalación y conexionado de fregadero, lavadora y lavavajillas.', 'Montaje de fregadero y conexión de electrodomésticos de agua, incluyendo desagües y llaves de paso.', 'Ud', 82.10),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'MONTAJE CAMPANA EXTRACTORA COCINA', '03-F-13', 'Instalación de campana extractora en cocina.', 'Montaje de campana extractora, incluyendo fijación, conexión eléctrica y ducto. Campana no incluida.', 'Ud', 63.15);

-- CARPINTERÍA (e4967edd-53b5-459a-bb68-b1fd88ee6836)
INSERT INTO price_master_bolivia (category_id, subcategory, code, description, long_description, unit, final_price) VALUES
('e4967edd-53b5-459a-bb68-b1fd88ee6836', 'NIVELACIÓN DE SUELOS CON TABLERO', '04-C-01', 'Colocación de tablero sobre listones para nivelar un suelo antes de instalar piso.', 'Sistema de nivelación de pisos mediante tableros y estructura de listones de madera.', 'm²', 44.20),
('e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN PISO LAMINADO (MO)', '04-C-02', 'Mano de obra de colocación de piso flotante o laminado.', 'Trabajo de instalación de piso laminado tipo click, incluyendo base y terminaciones. Material no incluido.', 'm²', 18.30),
('e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN SUELO VINÍLICO (MO)', '04-C-03', 'Mano de obra de colocación de piso de vinilo tipo click.', 'Instalación de piso vinílico, incluyendo preparación y colocación. Material no incluido.', 'm²', 24.00),
('e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN CONTRAZÓCALO (MO y Materiales)', '04-C-04', 'Suministro y colocación de contrazócalo o guardapolvo.', 'Instalación de contrazócalo de MDF o madera, incluyendo material, cortes, fijación y acabado.', 'ml', 7.05),
('e4967edd-53b5-459a-bb68-b1fd88ee6836', 'SUMINISTRO Y COLOCACIÓN PREMARCOS', '04-C-05', 'Instalación de premarco metálico para puertas.', 'Colocación de estructura metálica de premarco, incluyendo nivelación y fijación a obra.', 'Ud', 113.65),
('e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN MARCOS SIN PUERTA', '04-C-06', 'Instalación de marco o forro sin hoja de puerta.', 'Montaje de marco de madera o MDF para vanos sin puerta, incluyendo ajustes y acabado.', 'Ud', 251.30),
('e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA ABATIBLE 1 HOJA', '04-C-07', 'Instalación de puerta abatible en block.', 'Montaje de puerta interior abatible, incluyendo bisagras, manija y ajustes. Puerta no incluida.', 'Ud', 126.30),
('e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA CORREDERA', '04-C-08', 'Instalación de hoja de puerta corredera en su cajón.', 'Montaje de puerta corredera en estructura empotrada, incluyendo rieles y herrajes. Puerta no incluida.', 'Ud', 290.50),
('e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA ENTRADA BLINDADA', '04-C-09', 'Instalación de puerta de seguridad o blindada.', 'Montaje de puerta de entrada de seguridad, incluyendo marco, cerradura y ajustes. Puerta no incluida.', 'Ud', 570.00),
('e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ACUCHILLADO SUELO + BARNIZADO', '04-C-10', 'Lijado y barnizado de suelo de madera existente.', 'Restauración de piso de madera mediante lijado profesional y aplicación de barniz o laca.', 'm²', 20.20),
('e4967edd-53b5-459a-bb68-b1fd88ee6836', 'REBAJE DE PUERTAS', '04-C-11', 'Rebaje inferior de puertas para ajuste a la altura del nuevo suelo.', 'Corte y ajuste de altura de puertas existentes para adaptarlas a nuevo nivel de piso.', 'Ud', 20.20);

-- ELECTRICIDAD (243dee0d-edba-4de9-94a4-2a4c17ff607d)
INSERT INTO price_master_bolivia (category_id, subcategory, code, description, long_description, unit, final_price) VALUES
('243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO GENERAL 18 ELEMENTOS', '05-E-01', 'Instalación de tablero eléctrico con 18 módulos y elementos de protección.', 'Suministro e instalación de tablero eléctrico completo con interruptores termomagnéticos y diferenciales.', 'Ud', 694.50),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CANALIZACIÓN TV Y TELECOMUNICACIONES', '05-E-02', 'Instalación de red de cableado para TV y voz/datos.', 'Tendido de cables y tubería para red de telecomunicaciones, TV e internet.', 'Ud', 221.00),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', 'SUMINISTRO E INSTALACIÓN PORTERO', '05-E-03', 'Instalación de portero eléctrico o videoportero.', 'Montaje completo de sistema de portero, incluyendo unidad exterior, interior y cableado.', 'Ud', 120.00),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO DE OBRA TEMPORAL', '05-E-04', 'Colocación de un tablero eléctrico provisional para la reforma.', 'Instalación de tablero temporal para suministro eléctrico durante la obra.', 'Ud', 347.25),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LINEA DE TOMACORRIENTES MONOFÁSICA', '05-E-05', 'Tendido de línea de tomacorrientes estándar (2,5mm2).', 'Instalación de circuito eléctrico para tomacorrientes, incluyendo cable, tubería y cajas.', 'Ud', 296.75),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LINEA DE ALUMBRADO', '05-E-06', 'Tendido de línea de alumbrado general (1,5mm2).', 'Instalación de circuito eléctrico para iluminación, incluyendo cable, tubería y cajas.', 'Ud', 296.75),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTO DE LUZ SENCILLO', '05-E-07', 'Mecanismo e instalación de un punto de luz simple (interruptor + luz).', 'Instalación de interruptor simple y punto de luz, incluyendo mecanismo y conexiones.', 'Ud', 44.20),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTOS CONMUTADOS', '05-E-08', 'Mecanismo e instalación de punto de luz controlado desde dos interruptores.', 'Sistema de conmutación para controlar una luz desde dos puntos diferentes.', 'Ud', 69.45),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTOS DE CRUZAMIENTO', '05-E-09', 'Mecanismo e instalación de punto de luz controlado desde tres o más interruptores.', 'Sistema de cruzamiento para controlar una luz desde tres o más puntos.', 'Ud', 82.10),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTOS DE TOMACORRIENTES', '05-E-10', 'Mecanismo e instalación de un tomacorriente de pared estándar.', 'Instalación de tomacorriente doble, incluyendo mecanismo, placa y conexiones.', 'Ud', 50.50),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMACORRIENTE INTEMPERIE', '05-E-11', 'Mecanismo e instalación de tomacorriente apto para exterior.', 'Instalación de tomacorriente con protección IP para uso en exteriores.', 'Ud', 72.00),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMA DE TV', '05-E-12', 'Mecanismo e instalación de toma de antena y telecomunicaciones.', 'Instalación de punto de TV/datos, incluyendo mecanismo, placa y conexiones.', 'Ud', 80.80),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMACORRIENTES APARATOS DE COCINA', '05-E-13', 'Tomacorriente para electrodomésticos (lavadora, horno, etc.).', 'Instalación de tomacorriente especial para electrodomésticos de alto consumo.', 'Ud', 50.50),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', 'SUMINISTRO Y COLOCACIÓN FOCOS', '05-E-14', 'Mano de obra por la instalación de focos empotrados en cielo raso.', 'Instalación de focos empotrados tipo spot, incluyendo corte y conexiones. Focos no incluidos.', 'Ud', 37.90),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TIMBRE DE PUERTA ENTRADA', '05-E-15', 'Instalación de pulsador y timbre.', 'Montaje de sistema de timbre, incluyendo pulsador exterior, timbre interior y cableado.', 'Ud', 56.85),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CERTIFICACIÓN Y LEGALIZACIÓN', '05-E-16', 'Emisión del certificado de instalación eléctrica y legalización.', 'Trámite completo de certificación eléctrica ante autoridades competentes.', 'Ud', 307.00);

-- CALEFACCIÓN (5090928c-9b72-4d83-8667-9d01ddbfca47)
INSERT INTO price_master_bolivia (category_id, subcategory, code, description, long_description, unit, final_price) VALUES
('5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN DE RADIADOR ELÉCTRICO', '06-CAL-01', 'Instalación y conexión a la línea eléctrica de radiador.', 'Montaje de radiador eléctrico en pared, incluyendo soporte y conexión eléctrica. Radiador no incluido.', 'Ud', 50.50),
('5090928c-9b72-4d83-8667-9d01ddbfca47', 'RECOLOCAR CALDERA/TERMA SIN DESPLAZAMIENTO', '06-CAL-02', 'Desmontaje y montaje de caldera o terma en el mismo sitio.', 'Trabajo de desmontaje temporal y reinstalación de caldera o terma durante reforma.', 'Ud', 50.50),
('5090928c-9b72-4d83-8667-9d01ddbfca47', 'COLOCACIÓN CALDERA/TERMA (Montaje MO)', '06-CAL-03', 'Mano de obra por la instalación completa de una nueva caldera o terma.', 'Instalación completa de caldera o terma, incluyendo conexiones de agua, gas y evacuación. Equipo no incluido.', 'Ud', 479.80),
('5090928c-9b72-4d83-8667-9d01ddbfca47', 'RED ALIMENTACIÓN POR RADIADOR', '06-CAL-04', 'Instalación de tubería desde el colector hasta el radiador.', 'Tendido de tubería de agua para calefacción, desde colector hasta punto de radiador.', 'Ud', 227.30),
('5090928c-9b72-4d83-8667-9d01ddbfca47', 'COLOCACIÓN Y MOVIMIENTO RADIADORES', '06-CAL-05', 'Instalación de nuevo radiador o movimiento de uno existente.', 'Montaje de radiador de agua en pared, incluyendo soportes y conexiones. Radiador no incluido.', 'Ud', 75.75),
('5090928c-9b72-4d83-8667-9d01ddbfca47', 'LEGALIZACIÓN INSTALACIÓN GAS', '06-CAL-06', 'Emisión de certificados y legalización de la instalación de gas.', 'Trámite completo de certificación de instalación de gas ante autoridades competentes.', 'Ud', 404.00),
('5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN PISO RADIANTE', '06-CAL-07', 'Instalación de red de tuberías de piso radiante sobre base aislante.', 'Sistema completo de calefacción por piso radiante, incluyendo tuberías, colector y aislamiento.', 'm²', 79.90),
('5090928c-9b72-4d83-8667-9d01ddbfca47', 'CAMBIO DE RACORES RADIADOR', '06-CAL-08', 'Sustitución de piezas de conexión del radiador.', 'Cambio de válvulas y racores de conexión de radiadores, incluyendo materiales y mano de obra.', 'Ud', 56.85),
('5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN TERMO ELÉCTRICO 80L', '06-CAL-09', 'Instalación y conexionado de termo eléctrico.', 'Montaje de termo eléctrico en pared, incluyendo conexiones de agua y electricidad. Termo no incluido.', 'Ud', 243.70);

-- LIMPIEZA (0f95a55f-12ba-4e0e-ba0d-d01229d05c4c)
INSERT INTO price_master_bolivia (category_id, subcategory, code, description, long_description, unit, final_price) VALUES
('0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZAS PERIÓDICAS DE OBRA', '07-L-01', 'Mano de obra por la limpieza diaria/semanal de la obra.', 'Servicio de limpieza regular durante el desarrollo de la obra, incluyendo barrido y retiro de residuos menores.', 'Ud', 88.40),
('0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA FINAL DE OBRA', '07-L-02', 'Limpieza exhaustiva de fin de obra y retirada de restos menores.', 'Limpieza profunda al finalizar la obra, incluyendo ventanas, pisos, baños y retiro de etiquetas y protecciones.', 'Ud', 176.80);

-- Consulta de verificación
SELECT 
  pc.name as categoria,
  COUNT(*) as total_precios,
  MIN(pmb.final_price) as precio_minimo,
  MAX(pmb.final_price) as precio_maximo,
  AVG(pmb.final_price)::DECIMAL(10,2) as precio_promedio
FROM price_master_bolivia pmb
JOIN price_categories pc ON pmb.category_id = pc.id
GROUP BY pc.name, pc.display_order
ORDER BY pc.display_order;
