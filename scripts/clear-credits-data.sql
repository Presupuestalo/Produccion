-- Script para borrar todos los datos de créditos y transacciones
-- ADVERTENCIA: Esta acción es irreversible.

-- Borrar transacciones primero debido a la clave foránea si la hubiera (aunque según el esquema anterior no es estrictamente necesario antes de company_credits si no hay FK directa cruzada, pero es buena práctica)
DELETE FROM credit_transactions;

-- Borrar saldos de créditos
DELETE FROM company_credits;

-- Opcional: Reiniciar otras tablas relacionadas si fuera necesario
-- DELETE FROM lead_interactions WHERE credits_spent IS NOT NULL; 
-- (No lo borramos a menos que el usuario lo pida explícitamente, ya que son interacciones de negocio)

RAISE NOTICE 'Datos de créditos y transacciones borrados exitosamente';
