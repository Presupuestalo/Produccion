-- Solución para el error de RLS en price_history
-- El trigger log_price_master_changes intenta insertar en price_history pero las políticas RLS lo bloquean

-- OPCIÓN 1: Deshabilitar el trigger de historial (más simple)
-- Si no necesitas un historial de cambios de precios, esta es la mejor opción
DROP TRIGGER IF EXISTS log_price_master_changes ON public.price_master;

-- OPCIÓN 2: Si quieres mantener el historial, desactiva RLS en price_history
-- La tabla price_history es solo para auditoría y no debería ser accesible directamente
-- ALTER TABLE public.price_history DISABLE ROW LEVEL SECURITY;

-- OPCIÓN 3: Si quieres mantener RLS, añade una política que permita inserciones desde triggers
-- CREATE POLICY "Permitir inserciones desde triggers"
--   ON public.price_history FOR INSERT
--   TO authenticated
--   WITH CHECK (true);

-- Recomendación: Usar OPCIÓN 1 (ya ejecutada arriba) para simplificar
-- El historial de cambios puede añadirse más adelante si es necesario
