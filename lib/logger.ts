import pino from "pino"

// Browser ve server için farklı konfigürasyonlar
const isServer = typeof window === "undefined"

// Logger konfigürasyonu
const logger = pino({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  browser: {
    asObject: true,
  },
  ...(isServer
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
})

// Supabase işlemleri için özel logger
export const supabaseLogger = logger.child({ component: "supabase" })

// Security işlemleri için özel logger
export const securityLogger = logger.child({ component: "security" })

// API işlemleri için özel logger
export const apiLogger = logger.child({ component: "api" })

// Veritabanına log kaydetme fonksiyonu
export const logToDatabase = async (logData: {
  level: string
  message: string
  component: string
  operation?: string
  table_name?: string
  method?: string
  duration_ms?: number
  status?: string
  error_message?: string
  user_id?: string
  metadata?: any
}) => {
  // Bu fonksiyon monitored supabase client tarafından kullanılacak
  // Sonsuz döngüye girmemek için burada direkt supabase çağrısı yapmıyoruz
}

export default logger
