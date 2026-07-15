import { createFileRoute } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'

import type { FormEvent } from 'react'

export const Route = createFileRoute('/')({ component: Home })

interface RowError {
  row: number
  message: string
}

interface ImportResult {
  imported: number
  skipped: number
  errors: Array<RowError>
}

async function importCsv(file: File): Promise<ImportResult> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/import', {
    method: 'POST',
    body: formData,
  })
  const body: unknown = await response.json()
  if (typeof body !== 'object' || body === null || !('errors' in body)) {
    throw new Error(`Échec de l'import (${response.status})`)
  }
  return body as ImportResult
}

function Home() {
  const [file, setFile] = useState<File | null>(null)

  const mutation = useMutation({
    mutationFn: importCsv,
    onSuccess: (result) => {
      if (result.errors.length > 0) {
        toast.error(
          `Import annulé : ${result.errors.length} ligne(s) invalide(s)`,
        )
        return
      }
      toast.success(`${result.imported} transactions importées`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) return
    mutation.mutate(file)
  }

  return (
    <div className="mx-auto max-w-xl p-8">
      <Card>
        <CardHeader>
          <CardTitle>Importer des transactions</CardTitle>
          <CardDescription>
            Importez un export CSV bancaire pour le charger en base.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="csv-file">Fichier CSV</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </div>
            <Button type="submit" disabled={!file || mutation.isPending}>
              {mutation.isPending ? 'Import en cours…' : 'Importer'}
            </Button>
            {mutation.data && mutation.data.errors.length > 0 && (
              <ul className="text-sm text-muted-foreground">
                {mutation.data.errors.slice(0, 5).map((err) => (
                  <li key={err.row}>
                    Ligne {err.row} : {err.message}
                  </li>
                ))}
              </ul>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
