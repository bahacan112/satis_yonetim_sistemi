-- Debug ve system_logs_with_user_info view'ini düzelt

-- Önce mevcut view'i kontrol et
SELECT 
    schemaname, 
    viewname, 
    definition 
FROM pg_views 
WHERE viewname = 'system_logs_with_user_info';

-- View'i yeniden oluştur
DROP VIEW IF EXISTS system_logs_with_user_info;

CREATE VIEW system_logs_with_user_info AS
SELECT 
    sl.id,
    sl.timestamp,
    sl.user_id,
    COALESCE(p.full_name, 'Sistem') as user_name,
    p.role as user_role,
    sl.operation,
    sl.table_name,
    sl.method,
    sl.success,
    sl.duration_ms,
    sl.error_message,
    sl.ip_address,
    sl.user_agent,
    sl.metadata,
    sl.created_at
FROM system_logs sl
LEFT JOIN profiles p ON sl.user_id::uuid = p.id
ORDER BY sl.timestamp DESC;

-- View'in çalışıp çalışmadığını test et
SELECT COUNT(*) as total_logs FROM system_logs_with_user_info;

-- Son 5 log kaydını kontrol et
SELECT 
    timestamp,
    user_name,
    user_role,
    operation,
    method,
    success,
    duration_ms
FROM system_logs_with_user_info 
LIMIT 5;

-- Hata loglarını kontrol et
SELECT 
    timestamp,
    user_name,
    operation,
    error_message,
    duration_ms
FROM system_logs_with_user_info 
WHERE success = false
LIMIT 5;

-- Duration 0 olan kayıtları kontrol et
SELECT 
    COUNT(*) as zero_duration_count,
    operation,
    method
FROM system_logs_with_user_info 
WHERE duration_ms = 0
GROUP BY operation, method
ORDER BY zero_duration_count DESC;

-- Auth işlemlerini kontrol et
SELECT 
    operation,
    success,
    AVG(duration_ms) as avg_duration,
    COUNT(*) as count
FROM system_logs_with_user_info 
WHERE method = 'AUTH'
GROUP BY operation, success
ORDER BY count DESC;
