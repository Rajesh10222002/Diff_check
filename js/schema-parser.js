class SchemaParser {
  static async parseSchemaFromZip(zipFile) {
    try {
      const zip = await JSZip.loadAsync(zipFile);
      const schemaFile = this.findSchemaFile(zip);
      if (!schemaFile) {
        throw new Error('No schema XML file found in the ZIP');
      }
      
      const xmlContent = await schemaFile.async('text');
      return this.parseSchemaXML(xmlContent);
    } catch (error) {
      console.error('Error parsing schema from ZIP:', error);
      throw error;
    }
  }

  static findSchemaFile(zip) {
    // Look for files in the 'schema' folder with '_schema.xml' suffix
    for (const filePath in zip.files) {
      const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();
      
      // Check if path contains 'schema/' and ends with '_schema.xml'
      if (normalizedPath.includes('schemas/') && normalizedPath.endsWith('_schema.xml')) {
        return zip.files[filePath];
      }
      
      // Also check for files directly in the root (for backward compatibility)
      if (!normalizedPath.includes('/') && normalizedPath.endsWith('_schema.xml')) {
        return zip.files[filePath];
      }
    }
    return null;
  }

  static parseSchemaXML(xmlContent) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    const schema = {
      name: xmlDoc.documentElement.getAttribute('name'),
      version: xmlDoc.documentElement.getAttribute('version'),
      loader: xmlDoc.documentElement.getAttribute('loader'),
      tables: {},
      joins: {},
      loadPlans: {}
    };

    // Parse tables
    const tables = xmlDoc.getElementsByTagName('table');
    for (const table of tables) {
      const tableName = table.getAttribute('name');
      const tableAttrs = {};
      
      // Collect attributes in a consistent way (alphabetically)
      const attrNames = [];
      for (const attr of table.attributes) {
        attrNames.push(attr.name);
      }
      attrNames.sort();
      
      for (const attrName of attrNames) {
        if (attrName !== 'name') {
          tableAttrs[attrName] = table.getAttribute(attrName);
        }
      }

      const columns = {};
      const columnElements = table.getElementsByTagName('column');
      for (const column of columnElements) {
        const colName = column.getAttribute('name');
        const colAttrs = {};
        
        // Collect column attributes in a consistent way (alphabetically)
        const colAttrNames = [];
        for (const attr of column.attributes) {
          colAttrNames.push(attr.name);
        }
        colAttrNames.sort();
        
        for (const attrName of colAttrNames) {
          if (attrName !== 'name') {
            colAttrs[attrName] = column.getAttribute(attrName);
          }
        }
        
        columns[colName] = colAttrs;
      }

      schema.tables[tableName] = {
        attributes: tableAttrs,
        columns: columns
      };
    }

    // Parse joins - now using the join condition as the key
    const joins = xmlDoc.getElementsByTagName('join');
    for (const join of joins) {
      const cond = join.getElementsByTagName('cond')[0];
      if (cond) {
        const parent = cond.getAttribute('parent');
        const child = cond.getAttribute('child');
        const op = cond.getAttribute('op');
        const joinKey = `${parent} ${op} ${child}`;
        
        schema.joins[joinKey] = {
          parent: parent,
          child: child,
          op: op
        };
      }
    }

    // Parse load plans
    const loadPlans = xmlDoc.getElementsByTagName('loadPlan');
    for (const plan of loadPlans) {
      const table = plan.getAttribute('table');
      const details = {};
      
      // Collect load plan attributes in a consistent way (alphabetically)
      const attrNames = [];
      for (const attr of plan.attributes) {
        attrNames.push(attr.name);
      }
      attrNames.sort();
      
      for (const attrName of attrNames) {
        if (attrName !== 'table') {
          details[attrName] = plan.getAttribute(attrName);
        }
      }
      
      schema.loadPlans[table] = details;
    }

    return schema;
  }

  static compareSchemas(schema1, schema2) {
    const differences = {
      schemaChanges: {},
      tablesAdded: [],
      tablesRemoved: [],
      tablesChanged: {},
      columnsAdded: {},
      columnsRemoved: {},
      columnsChanged: {},
      joinsAdded: [],
      joinsRemoved: [],
      joinsChanged: {},
      loadPlansAdded: [],
      loadPlansRemoved: [],
      loadPlansChanged: {}
    };

    // Compare schema-level attributes
    for (const attr of ['name', 'version', 'loader']) {
      if (schema1[attr] !== schema2[attr]) {
        differences.schemaChanges[attr] = {
          old: schema1[attr],
          new: schema2[attr]
        };
      }
    }

    // Compare tables
    const tables1 = new Set(Object.keys(schema1.tables));
    const tables2 = new Set(Object.keys(schema2.tables));

    differences.tablesAdded = [...tables2].filter(t => !tables1.has(t));
    differences.tablesRemoved = [...tables1].filter(t => !tables2.has(t));

    const commonTables = [...tables1].filter(t => tables2.has(t));
    for (const table of commonTables) {
      const table1 = schema1.tables[table];
      const table2 = schema2.tables[table];

      // Compare table attributes
      const tableAttrsDiff = {};
      const allAttrs = new Set([
        ...Object.keys(table1.attributes),
        ...Object.keys(table2.attributes)
      ]);

      for (const attr of allAttrs) {
        const val1 = table1.attributes[attr] || null;
        const val2 = table2.attributes[attr] || null;
        if (val1 !== val2) {
          tableAttrsDiff[attr] = {
            old: val1,
            new: val2
          };
        }
      }

      // Compare columns
      const columns1 = new Set(Object.keys(table1.columns));
      const columns2 = new Set(Object.keys(table2.columns));

      const addedCols = [...columns2].filter(c => !columns1.has(c));
      const removedCols = [...columns1].filter(c => !columns2.has(c));

      if (addedCols.length > 0) {
        if (!differences.columnsAdded[table]) differences.columnsAdded[table] = {};
        for (const col of addedCols) {
          differences.columnsAdded[table][col] = table2.columns[col];
        }
      }

      if (removedCols.length > 0) {
        if (!differences.columnsRemoved[table]) differences.columnsRemoved[table] = {};
        for (const col of removedCols) {
          differences.columnsRemoved[table][col] = table1.columns[col];
        }
      }

      const commonColumns = [...columns1].filter(c => columns2.has(c));
      const columnChanges = {};
      for (const col of commonColumns) {
        const col1 = table1.columns[col];
        const col2 = table2.columns[col];

        const colAttrsDiff = {};
        const allColAttrs = new Set([
          ...Object.keys(col1),
          ...Object.keys(col2)
        ]);

        for (const attr of allColAttrs) {
          const val1 = col1[attr] || null;
          const val2 = col2[attr] || null;
          if (val1 !== val2) {
            colAttrsDiff[attr] = {
              old: val1,
              new: val2
            };
          }
        }

        if (Object.keys(colAttrsDiff).length > 0) {
          columnChanges[col] = colAttrsDiff;
        }
      }

      if (Object.keys(columnChanges).length > 0) {
        differences.columnsChanged[table] = columnChanges;
      }

      if (Object.keys(tableAttrsDiff).length > 0 || addedCols.length > 0 || 
          removedCols.length > 0 || Object.keys(columnChanges).length > 0) {
        differences.tablesChanged[table] = {
          attributes: tableAttrsDiff,
          columnsAdded: addedCols.length > 0,
          columnsRemoved: removedCols.length > 0,
          columnsChanged: Object.keys(columnChanges).length > 0
        };
      }
    }

    // Compare joins - now comparing based on join conditions
    const joins1 = schema1.joins || {};
    const joins2 = schema2.joins || {};
    
    const joinStrings1 = Object.keys(joins1);
    const joinStrings2 = Object.keys(joins2);
    
    differences.joinsAdded = joinStrings2.filter(j => !joinStrings1.includes(j));
    differences.joinsRemoved = joinStrings1.filter(j => !joinStrings2.includes(j));

    const commonJoins = joinStrings1.filter(j => joinStrings2.includes(j));
    for (const joinStr of commonJoins) {
      const join1 = joins1[joinStr];
      const join2 = joins2[joinStr];
      
      if (JSON.stringify(join1) !== JSON.stringify(join2)) {
        differences.joinsChanged[joinStr] = {
          old: join1,
          new: join2
        };
      }
    }

    // Compare load plans
    const lp1 = schema1.loadPlans || {};
    const lp2 = schema2.loadPlans || {};
    const keys1 = new Set(Object.keys(lp1));
    const keys2 = new Set(Object.keys(lp2));

    differences.loadPlansAdded = [...keys2].filter(k => !keys1.has(k));
    differences.loadPlansRemoved = [...keys1].filter(k => !keys2.has(k));

    for (const table of [...keys1].filter(k => keys2.has(k))) {
      if (JSON.stringify(lp1[table]) !== JSON.stringify(lp2[table])) {
        differences.loadPlansChanged[table] = {
          old: lp1[table],
          new: lp2[table]
        };
      }
    }

    return differences;
  }
}