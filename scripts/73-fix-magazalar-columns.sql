-- Check and fix magazalar table structure
DO $$
BEGIN
    -- Add il column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'magazalar' AND column_name = 'il') THEN
        ALTER TABLE magazalar ADD COLUMN il VARCHAR(100);
    END IF;
    
    -- Add ilce column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'magazalar' AND column_name = 'ilce') THEN
        ALTER TABLE magazalar ADD COLUMN ilce VARCHAR(100);
    END IF;
    
    -- Add sektor column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'magazalar' AND column_name = 'sektor') THEN
        ALTER TABLE magazalar ADD COLUMN sektor VARCHAR(100);
    END IF;
    
    -- Add kayit_tarihi column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'magazalar' AND column_name = 'kayit_tarihi') THEN
        ALTER TABLE magazalar ADD COLUMN kayit_tarihi DATE DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'magazalar' 
ORDER BY ordinal_position;
