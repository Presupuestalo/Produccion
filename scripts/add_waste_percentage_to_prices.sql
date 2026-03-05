-- migration: add_waste_percentage_to_prices.sql
-- Añade la columna waste_percentage a todas las tablas de precios maestras y de usuario

-- Función para añadir la columna si no existe
CREATE OR REPLACE FUNCTION add_waste_percentage_if_not_exists(p_table_name text)
RETURNS void AS $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = p_table_name
  ) THEN
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = p_table_name AND column_name = 'waste_percentage'
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN waste_percentage NUMERIC DEFAULT 0', p_table_name);
      RAISE NOTICE 'Added waste_percentage to %', p_table_name;
    ELSE
      RAISE NOTICE 'waste_percentage already exists in %', p_table_name;
    END IF;
  ELSE
    RAISE NOTICE 'Table % does not exist', p_table_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Tablas maestras
SELECT add_waste_percentage_if_not_exists('price_master');
SELECT add_waste_percentage_if_not_exists('price_master_argentina');
SELECT add_waste_percentage_if_not_exists('price_master_bolivia');
SELECT add_waste_percentage_if_not_exists('price_master_chile');
SELECT add_waste_percentage_if_not_exists('price_master_colombia');
SELECT add_waste_percentage_if_not_exists('price_master_costarica');
SELECT add_waste_percentage_if_not_exists('price_master_cuba');
SELECT add_waste_percentage_if_not_exists('price_master_dominicana');
SELECT add_waste_percentage_if_not_exists('price_master_ecuador');
SELECT add_waste_percentage_if_not_exists('price_master_guatemala');
SELECT add_waste_percentage_if_not_exists('price_master_guinea');
SELECT add_waste_percentage_if_not_exists('price_master_honduras');
SELECT add_waste_percentage_if_not_exists('price_master_mexico');
SELECT add_waste_percentage_if_not_exists('price_master_nicaragua');
SELECT add_waste_percentage_if_not_exists('price_master_panama');
SELECT add_waste_percentage_if_not_exists('price_master_paraguay');
SELECT add_waste_percentage_if_not_exists('price_master_peru');
SELECT add_waste_percentage_if_not_exists('price_master_salvador');
SELECT add_waste_percentage_if_not_exists('price_master_uruguay');
SELECT add_waste_percentage_if_not_exists('price_master_usa');
SELECT add_waste_percentage_if_not_exists('price_master_venezuela');

-- Tablas de usuario
SELECT add_waste_percentage_if_not_exists('user_prices');
SELECT add_waste_percentage_if_not_exists('user_prices_argentina');
SELECT add_waste_percentage_if_not_exists('user_prices_bolivia');
SELECT add_waste_percentage_if_not_exists('user_prices_chile');
SELECT add_waste_percentage_if_not_exists('user_prices_colombia');
SELECT add_waste_percentage_if_not_exists('user_prices_costarica');
SELECT add_waste_percentage_if_not_exists('user_prices_cuba');
SELECT add_waste_percentage_if_not_exists('user_prices_dominicana');
SELECT add_waste_percentage_if_not_exists('user_prices_ecuador');
SELECT add_waste_percentage_if_not_exists('user_prices_guatemala');
SELECT add_waste_percentage_if_not_exists('user_prices_guinea');
SELECT add_waste_percentage_if_not_exists('user_prices_honduras');
SELECT add_waste_percentage_if_not_exists('user_prices_mexico');
SELECT add_waste_percentage_if_not_exists('user_prices_nicaragua');
SELECT add_waste_percentage_if_not_exists('user_prices_panama');
SELECT add_waste_percentage_if_not_exists('user_prices_paraguay');
SELECT add_waste_percentage_if_not_exists('user_prices_peru');
SELECT add_waste_percentage_if_not_exists('user_prices_salvador');
SELECT add_waste_percentage_if_not_exists('user_prices_uruguay');
SELECT add_waste_percentage_if_not_exists('user_prices_usa');
SELECT add_waste_percentage_if_not_exists('user_prices_venezuela');

-- Limpieza
DROP FUNCTION add_waste_percentage_if_not_exists(text);
