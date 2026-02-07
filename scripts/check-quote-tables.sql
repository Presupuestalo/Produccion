
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_name IN ('quote_requests', 'quote_offers')
ORDER BY 
    table_name, ordinal_position;
