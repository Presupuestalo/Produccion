-- Script para limpiar todas las propuestas y ofertas
-- Esto eliminará todos los datos de quote_offers, quote_requests, professional_proposals y lead_requests
-- ADVERTENCIA: Esta acción no se puede deshacer

-- Eliminar todas las ofertas de profesionales
DELETE FROM quote_offers;

-- Eliminar todas las solicitudes de presupuestos del marketplace
DELETE FROM quote_requests;

-- Eliminar todas las propuestas profesionales
DELETE FROM professional_proposals;

-- Eliminar todas las solicitudes de leads
DELETE FROM lead_requests;

-- Verificar que las tablas están vacías
SELECT 'quote_offers' as tabla, COUNT(*) as registros FROM quote_offers
UNION ALL
SELECT 'quote_requests' as tabla, COUNT(*) as registros FROM quote_requests
UNION ALL
SELECT 'professional_proposals' as tabla, COUNT(*) as registros FROM professional_proposals
UNION ALL
SELECT 'lead_requests' as tabla, COUNT(*) as registros FROM lead_requests;
