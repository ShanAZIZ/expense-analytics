import { createFileRoute } from '@tanstack/react-router'

import type {} from '@tanstack/react-start'

import { db } from '#/db'
import { transactions } from '#/db/schema'
import { parseTransactionsCsv } from '#/lib/import/parse-transactions-csv'

const BATCH_SIZE = 500

export const Route = createFileRoute('/api/import')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const formData = await request.formData()
        const file = formData.get('file')

        if (!(file instanceof File)) {
          return Response.json(
            { message: 'Fichier "file" manquant dans le formulaire' },
            { status: 400 },
          )
        }

        const csvText = await file.text()
        const { rows, errors } = parseTransactionsCsv(csvText)

        if (errors.length > 0) {
          return Response.json(
            { imported: 0, skipped: errors.length, errors },
            { status: 400 },
          )
        }

        let imported = 0
        db.transaction((tx) => {
          for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const batch = rows.slice(i, i + BATCH_SIZE)
            tx.insert(transactions).values(batch).run()
            imported += batch.length
          }
        })

        return Response.json({ imported, skipped: 0, errors: [] })
      },
    },
  },
})
