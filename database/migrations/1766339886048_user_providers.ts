import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'user_providers'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('provider').notNullable()
      table.string('provider_id').notNullable()
      table.jsonb('provider_data').nullable()
      table.string('avatar_url').nullable()

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      table.unique(['provider', 'provider_id'])
      table.index(['user_id'])
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
