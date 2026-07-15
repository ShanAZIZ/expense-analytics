import Papa from 'papaparse'
import { z } from 'zod'

import type { transactions } from '#/db/schema'

const { parse } = Papa

type TransactionInsert = typeof transactions.$inferInsert

interface RowError {
  row: number
  message: string
}

interface ParseResult {
  rows: Array<TransactionInsert>
  errors: Array<RowError>
}

// Le CSV source utilise la virgule comme séparateur décimal (ex: "-21,79")
// et parfois un espace comme séparateur de milliers (ex: "2 866,72").
function parseAmountToCents(raw: string): number | undefined {
  const cleaned = raw
    .trim()
    .replace(/[^\d,.-]/g, '')
    .replace(',', '.')
  const value = Number(cleaned)
  return Number.isFinite(value) ? Math.round(value * 100) : undefined
}

const csvRowSchema = z.object({
  dateOp: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'dateOp doit être au format YYYY-MM-DD'),
  label: z.string().trim().min(1, 'label est requis'),
  suggestedLabel: z.string().trim().optional(),
  category: z.string().trim().optional(),
  amount: z.string().transform((val, ctx) => {
    const cents = parseAmountToCents(val)
    if (cents === undefined) {
      ctx.addIssue({ code: 'custom', message: `amount invalide : "${val}"` })
      return z.NEVER
    }
    return cents
  }),
  accountbalance: z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (!val) return undefined
      const cents = parseAmountToCents(val)
      if (cents === undefined) {
        ctx.addIssue({
          code: 'custom',
          message: `accountbalance invalide : "${val}"`,
        })
        return z.NEVER
      }
      return cents
    }),
})

function toTransactionInsert(
  row: z.infer<typeof csvRowSchema>,
): TransactionInsert {
  return {
    date: new Date(`${row.dateOp}T00:00:00Z`),
    operationLabel: row.label,
    operationName: row.suggestedLabel || null,
    category: row.category || null,
    amount: row.amount,
    accountBalance: row.accountbalance ?? null,
  }
}

export function parseTransactionsCsv(csvText: string): ParseResult {
  // Strip défensif du BOM même si papaparse le gère déjà en général.
  const text = csvText.replace(/^\uFEFF/, '')

  const parsed = parse<Record<string, string>>(text, {
    header: true,
    delimiter: ';',
    skipEmptyLines: true,
  })

  const rows: Array<TransactionInsert> = []
  const errors: Array<RowError> = []

  parsed.data.forEach((raw, index) => {
    const picked = {
      dateOp: raw.dateOp,
      label: raw.label,
      suggestedLabel: raw.suggestedLabel,
      category: raw.category,
      amount: raw.amount,
      accountbalance: raw.accountbalance,
    }
    const result = csvRowSchema.safeParse(picked)
    if (!result.success) {
      // +2 : index 0-based sur les lignes de données, +1 pour la ligne d'en-tête.
      errors.push({
        row: index + 2,
        message: result.error.issues.map((issue) => issue.message).join('; '),
      })
      return
    }
    rows.push(toTransactionInsert(result.data))
  })

  return { rows, errors }
}
