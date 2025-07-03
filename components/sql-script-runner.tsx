"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client" // Bu yolun doğru olduğundan emin olun

interface SqlScriptRunnerProps {
  scriptName: string
  scriptContent: string
}

// SqlScriptRunner bir varsayılan dışa aktarımdır.
export default function SqlScriptRunner({ scriptName, scriptContent }: SqlScriptRunnerProps) {
  const [output, setOutput] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleRunScript = async () => {
    setIsLoading(true)
    setOutput("")
    try {
      const supabase = createClient()
      // Supabase veritabanınızda 'execute_sql_query' adında bir RPC fonksiyonunuz olduğunu varsayıyoruz.
      const { data, error } = await supabase.rpc("execute_sql_query", { query: scriptContent })

      if (error) {
        throw error
      }

      setOutput(JSON.stringify(data, null, 2))
      toast({
        title: "SQL Script Ran Successfully",
        description: `Script "${scriptName}" executed.`,
      })
    } catch (error: any) {
      setOutput(`Error: ${error.message || "An unknown error occurred"}`)
      toast({
        title: "SQL Script Error",
        description: `Failed to execute SQL script "${scriptName}".`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{scriptName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">SQL Script Content:</h3>
          <Textarea
            value={scriptContent}
            readOnly
            rows={10}
            className="font-mono text-sm bg-gray-50 dark:bg-gray-900"
          />
        </div>
        <Button onClick={handleRunScript} disabled={isLoading}>
          {isLoading ? "Running SQL..." : "Run SQL Script"}
        </Button>
        {output && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Output:</h3>
            <Textarea value={output} readOnly rows={10} className="font-mono text-sm bg-gray-50 dark:bg-gray-900" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
