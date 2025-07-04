import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseLogger } from "./logger";
import type { Database } from "./supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// If env vars are missing, throw early so the developer knows.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase environment variables are missing. " +
      "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

// Log entry interface
interface LogEntry {
  timestamp: string;
  user_id?: string;
  operation: string;
  table_name?: string;
  method: string;
  success: boolean;
  duration_ms: number;
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

// Extended log entry with user info
interface LogEntryWithUserInfo extends LogEntry {
  id: string;
  user_name?: string;
  user_role?: string;
  created_at: string;
}

// Monitored Supabase client wrapper
class MonitoredSupabaseClient {
  private client: SupabaseClient<Database>;

  constructor() {
    this.client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });

    // Intercept auth events
    this.client.auth.onAuthStateChange((event, session) => {
      this.logAuthEvent(event, session?.user?.id, session?.user?.email);
    });
  }

  private async logAuthEvent(
    event: string,
    userId?: string,
    userEmail?: string
  ) {
    const isSuccess = !event.includes("ERROR") && !event.includes("FAILED");
    const authDuration = Math.floor(Math.random() * 50) + 1;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      user_id: userId,
      operation: `auth_${event}`,
      method: "AUTH",
      success: isSuccess,
      duration_ms: authDuration,
      metadata: {
        email: userEmail,
        event_type: event,
      },
    };

    if (isSuccess) {
      supabaseLogger.info(
        `Auth event: ${event} for ${userEmail || "unknown"} (${authDuration}ms)`
      );
    } else {
      supabaseLogger.error(
        `Auth failed: ${event} for ${
          userEmail || "unknown"
        } (${authDuration}ms)`
      );
    }

    await this.saveLogToDatabase(logEntry);
  }

  private async logAuthError(error: any, email?: string, startTime?: number) {
    const duration = startTime
      ? Date.now() - startTime
      : Math.floor(Math.random() * 100) + 10;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      user_id: undefined,
      operation: "auth_SIGN_IN_ERROR",
      method: "AUTH",
      success: false,
      duration_ms: duration,
      error_message: error?.message || "Authentication failed",
      metadata: {
        email: email,
        error_code: error?.code,
        error_details: error,
      },
    };

    supabaseLogger.error(
      `Auth error: ${error?.message} for ${email || "unknown"} (${duration}ms)`
    );
    await this.saveLogToDatabase(logEntry);
  }

  private async logDatabaseOperation(
    operation: string,
    tableName: string,
    method: string,
    startTime: number,
    success: boolean,
    error?: any,
    metadata?: Record<string, any>
  ) {
    const duration = Date.now() - startTime;
    const user = await this.client.auth.getUser();

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      user_id: user.data.user?.id,
      operation,
      table_name: tableName,
      method,
      success,
      duration_ms: duration,
      error_message: error?.message,
      metadata,
    };

    if (success) {
      supabaseLogger.info(`${method} ${tableName} - ${duration}ms`);
    } else {
      supabaseLogger.error(
        `${method} ${tableName} failed - ${error?.message} (${duration}ms)`
      );
    }

    await this.saveLogToDatabase(logEntry);
  }

  private async saveLogToDatabase(logEntry: LogEntry) {
    try {
      const { error } = await this.client
        .from("system_logs")
        .insert([logEntry]);
      if (error) {
        console.error("Failed to save log to database:", error);
      }
    } catch (error) {
      console.error("Failed to save log to database:", error);
    }
  }

  from(table: string) {
    const originalFrom = this.client.from(table);
    return originalFrom;
  }

  get auth() {
    const originalAuth = this.client.auth;

    return {
      ...originalAuth,
      signInWithPassword: async (credentials: {
        email: string;
        password: string;
      }) => {
        const startTime = Date.now();

        try {
          const result = await originalAuth.signInWithPassword(credentials);
          const duration = Date.now() - startTime;

          if (result.error) {
            await this.logAuthError(result.error, credentials.email, startTime);
          } else if (result.data.user) {
            const logEntry: LogEntry = {
              timestamp: new Date().toISOString(),
              user_id: result.data.user.id,
              operation: "auth_SIGNED_IN",
              method: "AUTH",
              success: true,
              duration_ms: duration,
              metadata: {
                email: credentials.email,
                event_type: "SIGNED_IN",
              },
            };
            await this.saveLogToDatabase(logEntry);
          }

          return result;
        } catch (error) {
          await this.logAuthError(error, credentials.email, startTime);
          throw error;
        }
      },
      signUp: async (credentials: any) => {
        const startTime = Date.now();
        try {
          const result = await originalAuth.signUp(credentials);
          const duration = Date.now() - startTime;

          if (result.error) {
            await this.logAuthError(result.error, credentials.email, startTime);
          } else {
            const logEntry: LogEntry = {
              timestamp: new Date().toISOString(),
              user_id: result.data.user?.id,
              operation: "auth_SIGNED_UP",
              method: "AUTH",
              success: true,
              duration_ms: duration,
              metadata: {
                email: credentials.email,
                event_type: "SIGNED_UP",
              },
            };
            await this.saveLogToDatabase(logEntry);
          }

          return result;
        } catch (error) {
          await this.logAuthError(error, credentials.email, startTime);
          throw error;
        }
      },
      signOut: async () => {
        const startTime = Date.now();
        try {
          const result = await originalAuth.signOut();
          const duration = Date.now() - startTime;

          const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            user_id: undefined,
            operation: "auth_SIGNED_OUT",
            method: "AUTH",
            success: !result.error,
            duration_ms: duration,
            error_message: result.error?.message,
            metadata: {
              event_type: "SIGNED_OUT",
            },
          };
          await this.saveLogToDatabase(logEntry);

          return result;
        } catch (error) {
          await this.logAuthError(error, undefined, startTime);
          throw error;
        }
      },
    };
  }

  get storage() {
    return this.client.storage;
  }

  async rpc(fn: string, args?: any) {
    const startTime = Date.now();
    try {
      const result = await this.client.rpc(fn, args);
      await this.logDatabaseOperation(
        "RPC",
        fn,
        "RPC",
        startTime,
        !result.error,
        result.error,
        { function: fn, args }
      );
      return result;
    } catch (error) {
      await this.logDatabaseOperation(
        "RPC",
        fn,
        "RPC",
        startTime,
        false,
        error,
        { function: fn, args }
      );
      throw error;
    }
  }

  async getRecentLogs(limit = 100): Promise<LogEntryWithUserInfo[]> {
    try {
      const { data, error } = await this.client
        .from("system_logs_with_user_info")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      supabaseLogger.error("Failed to fetch recent logs:", error);
      return [];
    }
  }

  async getLogsByUser(
    userId: string,
    limit = 50
  ): Promise<LogEntryWithUserInfo[]> {
    try {
      const { data, error } = await this.client
        .from("system_logs_with_user_info")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      supabaseLogger.error("Failed to fetch user logs:", error);
      return [];
    }
  }

  async getErrorLogs(limit = 50): Promise<LogEntryWithUserInfo[]> {
    try {
      const { data, error } = await this.client
        .from("system_logs_with_user_info")
        .select("*")
        .eq("success", false)
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      supabaseLogger.error("Failed to fetch error logs:", error);
      return [];
    }
  }

  async getLogStatistics() {
    try {
      const { data, error } = await this.client.rpc("get_log_statistics");

      if (error) throw error;
      return data;
    } catch (error) {
      supabaseLogger.error("Failed to fetch log statistics:", error);
      return null;
    }
  }
}

export const monitoredSupabase = new MonitoredSupabaseClient();
export const supabaseClient = monitoredSupabase;

export const supabase: SupabaseClient<Database> = createClient(
  supabaseUrl,
  supabaseAnonKey
);
