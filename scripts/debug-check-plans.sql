-- Simply list the last 10 floor plans and their user_id to verify data is present and correct.
SELECT id, name, user_id, project_id, updated_at 
FROM project_floor_plans 
ORDER BY updated_at DESC 
LIMIT 10;
