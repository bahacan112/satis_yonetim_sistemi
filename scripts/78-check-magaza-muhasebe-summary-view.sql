-- Check the structure of magaza_muhasebe_summary_view
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'magaza_muhasebe_summary_view' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check some sample data
SELECT * FROM magaza_muhasebe_summary_view LIMIT 5;
