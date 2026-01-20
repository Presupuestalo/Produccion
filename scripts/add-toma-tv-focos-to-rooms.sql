-- Script para añadir tomaTV y focosEmpotrados a los electricalElements de todas las habitaciones
-- Este script actualiza la columna data (JSONB) de la tabla calculator_data

DO $$
DECLARE
  record_row RECORD;
  updated_data JSONB;
  room_item JSONB;
  updated_rooms JSONB;
  electrical_elements JSONB;
  has_toma_tv BOOLEAN;
  has_focos BOOLEAN;
BEGIN
  -- Iterar sobre todos los registros de calculator_data
  FOR record_row IN SELECT id, data FROM calculator_data WHERE data IS NOT NULL
  LOOP
    updated_data := record_row.data;
    
    -- Verificar si existe el array reformRooms
    IF updated_data ? 'reformRooms' AND jsonb_typeof(updated_data->'reformRooms') = 'array' THEN
      updated_rooms := '[]'::jsonb;
      
      -- Iterar sobre cada habitación en reformRooms
      FOR room_item IN SELECT * FROM jsonb_array_elements(updated_data->'reformRooms')
      LOOP
        -- Verificar si la habitación tiene electricalElements
        IF room_item ? 'electricalElements' AND jsonb_typeof(room_item->'electricalElements') = 'array' THEN
          electrical_elements := room_item->'electricalElements';
          
          -- Verificar si ya tiene tomaTV
          has_toma_tv := EXISTS (
            SELECT 1 FROM jsonb_array_elements(electrical_elements) elem 
            WHERE elem->>'id' = 'tomaTV'
          );
          
          -- Verificar si ya tiene focosEmpotrados
          has_focos := EXISTS (
            SELECT 1 FROM jsonb_array_elements(electrical_elements) elem 
            WHERE elem->>'id' = 'focosEmpotrados'
          );
          
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
          
          -- Actualizar la habitación con los nuevos elementos
          room_item := jsonb_set(room_item, '{electricalElements}', electrical_elements);
        END IF;
        
        -- Añadir la habitación actualizada al array
        updated_rooms := updated_rooms || jsonb_build_array(room_item);
      END LOOP;
      
      -- Actualizar reformRooms en el data
      updated_data := jsonb_set(updated_data, '{reformRooms}', updated_rooms);
      
      -- Actualizar el registro en la base de datos
      UPDATE calculator_data 
      SET data = updated_data,
          updated_at = NOW()
      WHERE id = record_row.id;
      
      RAISE NOTICE 'Actualizado registro ID: %', record_row.id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Proceso completado. Se han actualizado todas las habitaciones.';
END $$;
