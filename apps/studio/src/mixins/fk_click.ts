import rawLog from 'electron-log'
import { Tabulator } from 'tabulator-tables';

const log = rawLog.scope('fk_click');

export const FkLinkMixin = {
  methods: {

    async fkClick(rawKeyData, cell: Tabulator.CellComponent) {
      log.debug('fk click', rawKeyData)
      const fromColumn = cell.getField().replace(/-link--bks$/g, "")

      if (!rawKeyData) {
        log.error("fk-click, couldn't find key data. Please open an issue. fromColumn:", fromColumn)
        this.$noty.error("Unable to open foreign key. See dev console")
      }



      let tableName = rawKeyData.toTable
      let schemaName = rawKeyData.toSchema
      let columnName = rawKeyData.toColumn


      let table = this.$store.state.tables.find(t => {
        return (!schemaName || schemaName === t.schema) && t.name === tableName
      })

      if (tableName && columnName && !schemaName && !table) {
        // might be schema/table instead of table/column, we should check.
        const sn = tableName
        const tn = columnName
        table = this.$store.state.tables.find(t => {
          return t.schema === sn && t.name === tn
        })

        if (table) {
          schemaName = sn
          tableName = tn
          columnName = undefined
        }
      }
      if (!table) {
        this.$noty.error(`Table link: unable to find destination table '${tableName}'`)
        log.error("fk-click: unable to find destination table", tableName)
        return
      }

      if (!columnName) {
        // just assume it's the primary key
        columnName = await this.connection.getPrimaryKey(tableName, schemaName)
      }

      const filters = [];

      // might be compound keys
      const FromColumnKeys = fromColumn.split(',');
      const ToColumnKeys = columnName.split(',');
      const values = [];

      ToColumnKeys.forEach((key: string, index: number) => {
        const valueCell = cell.getRow().getCell(FromColumnKeys[index]);
        const value = valueCell.getValue();
        values.push(value);
        filters.push({
          value,
          type: '=',
          field: key
        });
      });

      const payload = {
        table, filters, titleScope: values.join(',')
      }
      this.$root.$emit('loadTable', payload)
    },

  }
}
