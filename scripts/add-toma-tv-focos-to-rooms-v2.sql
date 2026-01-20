-- Script para añadir tomaTV y focosEmpotrados a los electricalElements de todas las habitaciones de reforma
-- Este script actualiza la columna reform_rooms (JSONB) en la tabla calculator_data

DO $$
DECLARE
  record_row RECORD;
  updated_rooms JSONB;
  room_item JSONB;
  electrical_elements JSONB;
  has_toma_tv BOOLEAN;
  has_focos BOOLEAN;
BEGIN
  -- Iterar sobre todos los registros que tienen reform_rooms
  FOR record_row IN 
    SELECT id, reform_rooms 
    FROM calculator_data 
    WHERE reform_rooms IS NOT NULL AND reform_rooms != 'null'::jsonb
  LOOP
    updated_rooms := '[]'::jsonb;
    
    -- Iterar sobre cada habitación en el array reform_rooms
    FOR room_item IN SELECT * FROM jsonb_array_elements(record_row.reform_rooms)
    LOOP
      -- Obtener el array de electricalElements
      electrical_elements := room_item->'electricalElements';
      
      -- Verificar si ya tiene tomaTV
      has_toma_tv := FALSE;
      has_focos := FALSE;
      
      IF electrical_elements IS NOT NULL THEN
        -- Verificar si tomaTV ya existe
        SELECT EXISTS (
          SELECT 1 FROM jsonb_array_elements(electrical_elements) elem
          WHERE elem->>'id' = 'tomaTV'
        ) INTO has_toma_tv;
        
        -- Verificar si focosEmpotrados ya existe
        SELECT EXISTS (
          SELECT 1 FROM jsonb_array_elements(electrical_elements) elem
          WHERE elem->>'id' = 'focosEmpotrados'
        ) INTO has_focos;
        
        -- Añadir tomaTV si no existe
        IF NOT has_toma_tv THEN
          electrical_elements := electrical_elements || jsonb_build_array(
            jsonb_build_object(
              'id', 'tomaTV',
              'type', 'Toma TV',
              'quantity', 0
            )
          );
        END IF;
        
        -- Añadir focosEmpotrados si no existe
        IF NOT has_focos THEN
          electrical_elements := electrical_elements || jsonb_build_array(
            jsonb_build_object(
              'id', 'focosEmpotrados',
              'type', 'Foco empotrado',
              'quantity', 0
            )
          );
        END IF;
        
        -- Actualizar el room_item con los nuevos electricalElements
        room_item := jsonb_set(room_item, '{electricalElements}', electrical_elements);
      END IF;
      
      -- Añadir la habitación actualizada al array
      updated_rooms := updated_rooms || jsonb_build_array(room_item);
    END LOOP;
    
    -- Actualizar el registro con las habitaciones actualizadas
    UPDATE calculator_data 
    SET reform_rooms = updated_rooms,
        updated_at = NOW()
    WHERE id = record_row.id;
    
    RAISE NOTICE 'Actualizado registro ID: % con % habitaciones', record_row.id, jsonb_array_length(updated_rooms);
  END LOOP;
  
  RAISE NOTICE 'Proceso completado. Se han actualizado todas las habitaciones de reforma.';
END $$;
