import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'

export const transactions = sqliteTable('transactions', {
  id: integer({ mode: 'number' }).primaryKey({
    autoIncrement: true,
  }),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  operationLabel: text('operation_label').notNull(),
  operationName: text('operation_name'),
  category: text('category'),
  amount: integer('amount').notNull(),
  accountBalance: integer('account_balance'),
})
