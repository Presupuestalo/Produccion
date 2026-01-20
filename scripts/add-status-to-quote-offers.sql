-- Añadir columna status a quote_offers si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'quote_offers' AND column_name = 'status') THEN
    ALTER TABLE quote_offers ADD COLUMN status TEXT DEFAULT 'sent' 
      CHECK (status IN ('accessed', 'sent', 'accepted', 'rejected'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'quote_offers' AND column_name = 'includes') THEN
    ALTER TABLE quote_offers ADD COLUMN includes TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'quote_offers' AND column_name = 'excludes') THEN
    ALTER TABLE quote_offers ADD COLUMN excludes TEXT;
  END IF;
END $$;

-- Actualizar ofertas existentes sin status
UPDATE quote_offers SET status = 'sent' WHERE status IS NULL;
