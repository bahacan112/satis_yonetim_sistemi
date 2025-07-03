-- Log silme fonksiyonları ve geliştirilmiş istatistikler

-- Belirli tarihten önceki logları sil
CREATE OR REPLACE FUNCTION delete_logs_before_date(cutoff_date TIMESTAMP WITH TIME ZONE)
RETURNS JSON AS $$
DECLARE
    deleted_count INTEGER;
    current_user_role TEXT;
    result JSON;
BEGIN
    -- Kullanıcı rolünü kontrol et
    SELECT get_user_role() INTO current_user_role;
    
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Bu işlem için admin yetkisi gereklidir';
    END IF;
    
    -- Logları sil
    DELETE FROM system_logs 
    WHERE timestamp < cutoff_date;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Silme işlemini logla
    INSERT INTO system_logs (
        timestamp,
        user_id,
        operation,
        method,
        success,
        duration_ms,
        metadata
    ) VALUES (
        NOW(),
        auth.uid(),
        'delete_logs_before_date',
        'DELETE',
        true,
        0,
        json_build_object(
            'cutoff_date', cutoff_date,
            'deleted_count', deleted_count
        )
    );
    
    result := json_build_object(
        'success', true,
        'deleted_count', deleted_count,
        'cutoff_date', cutoff_date
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tüm logları sil (kendi işlemi hariç)
CREATE OR REPLACE FUNCTION delete_all_logs()
RETURNS JSON AS $$
DECLARE
    deleted_count INTEGER;
    current_user_role TEXT;
    result JSON;
BEGIN
    -- Kullanıcı rolünü kontrol et
    SELECT get_user_role() INTO current_user_role;
    
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Bu işlem için admin yetkisi gereklidir';
    END IF;
    
    -- Tüm logları sil
    DELETE FROM system_logs;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Silme işlemini logla
    INSERT INTO system_logs (
        timestamp,
        user_id,
        operation,
        method,
        success,
        duration_ms,
        metadata
    ) VALUES (
        NOW(),
        auth.uid(),
        'delete_all_logs',
        'DELETE',
        true,
        0,
        json_build_object(
            'deleted_count', deleted_count,
            'operation_type', 'delete_all'
        )
    );
    
    result := json_build_object(
        'success', true,
        'deleted_count', deleted_count,
        'operation', 'delete_all'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Geliştirilmiş log istatistikleri
CREATE OR REPLACE FUNCTION get_log_statistics()
RETURNS JSON AS $$
DECLARE
    total_requests INTEGER;
    successful_requests INTEGER;
    failed_requests INTEGER;
    avg_response_time NUMERIC;
    unique_users INTEGER;
    most_active_table TEXT;
    most_active_user TEXT;
    error_rate NUMERIC;
    oldest_log TIMESTAMP WITH TIME ZONE;
    newest_log TIMESTAMP WITH TIME ZONE;
    total_size_mb NUMERIC;
    result JSON;
BEGIN
    -- Temel istatistikler
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE success = true),
        COUNT(*) FILTER (WHERE success = false),
        ROUND(AVG(duration_ms), 2),
        COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)
    INTO 
        total_requests,
        successful_requests, 
        failed_requests,
        avg_response_time,
        unique_users
    FROM system_logs;
    
    -- En aktif tablo
    SELECT table_name INTO most_active_table
    FROM system_logs 
    WHERE table_name IS NOT NULL
    GROUP BY table_name 
    ORDER BY COUNT(*) DESC 
    LIMIT 1;
    
    -- En aktif kullanıcı (profiles tablosundan isim al)
    SELECT COALESCE(p.full_name, 'Bilinmiyor') INTO most_active_user
    FROM system_logs sl
    LEFT JOIN profiles p ON sl.user_id = p.id
    WHERE sl.user_id IS NOT NULL
    GROUP BY sl.user_id, p.full_name
    ORDER BY COUNT(*) DESC
    LIMIT 1;
    
    -- Hata oranı
    IF total_requests > 0 THEN
        error_rate := ROUND(failed_requests::NUMERIC / total_requests::NUMERIC, 4);
    ELSE
        error_rate := 0;
    END IF;
    
    -- En eski ve en yeni log
    SELECT MIN(timestamp), MAX(timestamp) 
    INTO oldest_log, newest_log
    FROM system_logs;
    
    -- Toplam boyut (yaklaşık)
    SELECT ROUND(
        (pg_total_relation_size('system_logs')::NUMERIC / 1024 / 1024), 2
    ) INTO total_size_mb;
    
    result := json_build_object(
        'total_requests', COALESCE(total_requests, 0),
        'successful_requests', COALESCE(successful_requests, 0),
        'failed_requests', COALESCE(failed_requests, 0),
        'avg_response_time', COALESCE(avg_response_time, 0),
        'unique_users', COALESCE(unique_users, 0),
        'most_active_table', COALESCE(most_active_table, 'Bilinmiyor'),
        'most_active_user', COALESCE(most_active_user, 'Bilinmiyor'),
        'error_rate', COALESCE(error_rate, 0),
        'oldest_log', oldest_log,
        'newest_log', newest_log,
        'total_size_mb', COALESCE(total_size_mb, 0)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonksiyonlara RLS politikaları
ALTER FUNCTION delete_logs_before_date(TIMESTAMP WITH TIME ZONE) OWNER TO postgres;
ALTER FUNCTION delete_all_logs() OWNER TO postgres;
ALTER FUNCTION get_log_statistics() OWNER TO postgres;

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_logs_before_date(TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_all_logs() TO authenticated;
GRANT EXECUTE ON FUNCTION get_log_statistics() TO authenticated;
