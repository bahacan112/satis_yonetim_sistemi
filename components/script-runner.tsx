"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

interface ScriptRunnerProps {
  scriptName: string
  scriptContent: string
  onRun: (scriptContent: string) => Promise<any>
}

// ScriptRunner bir varsayılan dışa aktarımdır.
export default function ScriptRunner({ scriptName, scriptContent, onRun }: ScriptRunnerProps) {
  const [output, setOutput] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleRunScript = async () => {
    setIsLoading(true)
    setOutput("")
    try {
      const result = await onRun(scriptContent)
      setOutput(JSON.stringify(result, null, 2))
      toast({
        title: "Script Ran Successfully",
        description: `Script "${scriptName}" executed.`,
      })
    } catch (error: any) {
      setOutput(`Error: ${error.message || "An unknown error occurred"}`)
      toast({
        title: "Script Error",
        description: `Failed to execute script "${scriptName}".`,
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
          <h3 className="text-lg font-semibold mb-2">Script Content:</h3>
          <Textarea
            value={scriptContent}
            readOnly
            rows={10}
            className="font-mono text-sm bg-gray-50 dark:bg-gray-900"
          />
        </div>
        <Button onClick={handleRunScript} disabled={isLoading}>
          {isLoading ? "Running..." : "Run Script"}
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
