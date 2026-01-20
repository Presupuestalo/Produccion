-- Agregar columna is_custom a user_prices y sus variantes por país
-- Esto permite distinguir entre precios creados desde cero (personalizados) 
-- y precios importados desde PDF o archivos

ALTER TABLE public.user_prices 
ADD COLUMN is_custom BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.user_prices_peru 
ADD COLUMN is_custom BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.user_prices_bolivia 
ADD COLUMN is_custom BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.user_prices_mexico 
ADD COLUMN is_custom BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.user_prices_colombia 
ADD COLUMN is_custom BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.user_prices_argentina 
ADD COLUMN is_custom BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.user_prices_chile 
ADD COLUMN is_custom BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.user_prices_ecuador 
ADD COLUMN is_custom BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.user_prices_venezuela 
ADD COLUMN is_custom BOOLEAN NOT NULL DEFAULT false;

-- Crear índice para mejorar búsquedas por is_custom
CREATE INDEX idx_user_prices_custom ON public.user_prices(is_custom);
CREATE INDEX idx_user_prices_peru_custom ON public.user_prices_peru(is_custom);
CREATE INDEX idx_user_prices_bolivia_custom ON public.user_prices_bolivia(is_custom);
CREATE INDEX idx_user_prices_mexico_custom ON public.user_prices_mexico(is_custom);
CREATE INDEX idx_user_prices_colombia_custom ON public.user_prices_colombia(is_custom);
CREATE INDEX idx_user_prices_argentina_custom ON public.user_prices_argentina(is_custom);
CREATE INDEX idx_user_prices_chile_custom ON public.user_prices_chile(is_custom);
CREATE INDEX idx_user_prices_ecuador_custom ON public.user_prices_ecuador(is_custom);
CREATE INDEX idx_user_prices_venezuela_custom ON public.user_prices_venezuela(is_custom);
