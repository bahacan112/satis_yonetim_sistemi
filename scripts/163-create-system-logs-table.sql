-- System logs tablosu oluştur
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    operation TEXT NOT NULL,
    table_name TEXT,
    method TEXT NOT NULL,
    success BOOLEAN NOT NULL DEFAULT true,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_table_name ON system_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_system_logs_success ON system_logs(success);
CREATE INDEX IF NOT EXISTS idx_system_logs_operation ON system_logs(operation);

-- RLS politikaları
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Sadece admin kullanıcılar log kayıtlarını görebilir
CREATE POLICY "Admin can view all logs" ON system_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Sistem log kayıtları için insert politikası (herkes kendi logunu yazabilir)
CREATE POLICY "Users can insert their own logs" ON system_logs
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR user_id IS NULL
    );

-- Log istatistikleri için fonksiyon
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

-- Eski log kayıtlarını temizleme fonksiyonu (30 günden eski kayıtları sil)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM system_logs 
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otomatik temizleme için cron job (eğer pg_cron extension'ı varsa)
-- SELECT cron.schedule('cleanup-logs', '0 2 * * *', 'SELECT cleanup_old_logs();');
