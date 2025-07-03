-- System logs için kullanıcı bilgileri ile birleştirilmiş view oluştur
CREATE OR REPLACE VIEW system_logs_with_user_info AS
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
LEFT JOIN profiles p ON sl.user_id = p.id
ORDER BY sl.timestamp DESC;

-- Log istatistikleri fonksiyonunu güncelle
CREATE OR REPLACE FUNCTION get_log_statistics()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_requests', COUNT(*),
        'successful_requests', COUNT(*) FILTER (WHERE success = true),
        'failed_requests', COUNT(*) FILTER (WHERE success = false),
        'avg_response_time', COALESCE(AVG(duration_ms), 0),
        'unique_users', COUNT(DISTINCT user_id),
        'most_active_table', (
            SELECT table_name 
            FROM system_logs 
            WHERE table_name IS NOT NULL 
            GROUP BY table_name 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ),
        'most_active_user', (
            SELECT COALESCE(p.full_name, 'Bilinmeyen')
            FROM system_logs sl
            LEFT JOIN profiles p ON sl.user_id = p.id
            WHERE sl.user_id IS NOT NULL
            GROUP BY sl.user_id, p.full_name
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ),
        'error_rate', CASE 
            WHEN COUNT(*) > 0 THEN 
                COUNT(*) FILTER (WHERE success = false)::FLOAT / COUNT(*)::FLOAT
            ELSE 0 
        END
    ) INTO result
    FROM system_logs
    WHERE timestamp >= NOW() - INTERVAL '24 hours';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
