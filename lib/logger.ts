import pino from "pino";

// Server mı?
const isServer = typeof window === "undefined";
// Development mı?
const isDev = process.env.NODE_ENV === "development";

// Logger konfigürasyonu
const logger = pino({
  level: isDev ? "debug" : "info",
  browser: {
    asObject: true,
  },
  ...(isServer && isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
});

// Supabase işlemleri için özel logger
export const supabaseLogger = logger.child({ component: "supabase" });

// Security işlemleri için özel logger
export const securityLogger = logger.child({ component: "security" });

// API işlemleri için özel logger
export const apiLogger = logger.child({ component: "api" });

// Veritabanına log kaydetme fonksiyonu
export const logToDatabase = async (logData: {
  level: string;
  message: string;
  component: string;
  operation?: string;
  table_name?: string;
  method?: string;
  duration_ms?: number;
  status?: string;
  error_message?: string;
  user_id?: string;
  metadata?: any;
}) => {
  // Bu fonksiyon monitored supabase client tarafından kullanılacak
};

export default logger;
