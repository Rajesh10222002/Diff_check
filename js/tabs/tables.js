const TablesTab = {
    currentDifferences: null,
    currentSchema1: null,
    currentSchema2: null,

    display: function(differences, schema1, schema2) {
        this.currentDifferences = differences;
        this.currentSchema1 = schema1;
        this.currentSchema2 = schema2;

        const tablesDetailsSection = document.getElementById('tables-details');
        tablesDetailsSection.innerHTML = `
            <h3 class="section-title">Tables Comparison</h3>
            <div class="view-options">
                <button class="view-option active" data-view="differences">
                    <i class="fas fa-exchange-alt"></i> Show Differences
                </button>
                <button class="view-option" data-view="similarities">
                    <i class="fas fa-equals"></i> Show Similarities
                </button>
                <button class="view-option" data-view="all">
                    <i class="fas fa-list"></i> Show All Tables
                </button>
            </div>
            <div id="tables-view-container"></div>
        `;

        document.querySelectorAll('.view-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.view-option').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const view = e.target.dataset.view;
                if (view === 'differences') {
                    this.displayDifferences(this.currentDifferences, this.currentSchema1, this.currentSchema2);
                } else if (view === 'similarities') {
                    this.displaySimilarities(this.currentSchema1, this.currentSchema2);
                } else {
                    this.displayAllTables(this.currentSchema1, this.currentSchema2);
                }
            });
        });

        this.displayDifferences(differences, schema1, schema2);
    },

    displayDifferences: function(differences, schema1, schema2) {
        const container = document.getElementById('tables-view-container');
        container.innerHTML = '';

        if (differences.tablesAdded.length === 0 &&
            differences.tablesRemoved.length === 0 &&
            Object.keys(differences.tablesChanged).length === 0) {
            container.innerHTML = '<p class="no-changes">No table differences found.</p>';
            return;
        }

        container.innerHTML = `
            <div class="table-filters">
                <div class="filter-group">
                    <label for="table-filter"><i class="fas fa-filter"></i> Filter:</label>
                    <input type="text" id="table-filter" placeholder="Filter tables...">
                </div>
                <div class="filter-group">
                    <label for="table-sort"><i class="fas fa-sort"></i> Sort by:</label>
                    <select id="table-sort">
                        <option value="name">Name</option>
                        <option value="added">Added First</option>
                        <option value="removed">Removed First</option>
                        <option value="changed">Changed First</option>
                    </select>
                </div>
                <div class="filter-group">
                    <button id="expand-all" class="filter-btn">
                        <i class="fas fa-expand"></i> Expand All
                    </button>
                    <button id="collapse-all" class="filter-btn">
                        <i class="fas fa-compress"></i> Collapse All
                    </button>
                </div>
            </div>
            <div class="table-grid" id="tables-grid"></div>
        `;

        const grid = document.getElementById('tables-grid');

        // Added tables
        if (differences.tablesAdded.length > 0) {
            const section = document.createElement('div');
            section.className = 'grid-section';
            section.innerHTML = `
                <div class="grid-section-header">
                    <i class="fas fa-plus-circle success-icon"></i>
                    <h4>Added Tables (${differences.tablesAdded.length})</h4>
                    <button class="section-toggle" onclick="TablesTab.toggleSection(this)">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
                <div class="grid-items"></div>
            `;
            
            const itemsContainer = section.querySelector('.grid-items');
            differences.tablesAdded.forEach(table => {
                itemsContainer.appendChild(this.createTableCard(table, schema2.tables[table], 'added'));
            });
            grid.appendChild(section);
        }

        // Removed tables
        if (differences.tablesRemoved.length > 0) {
            const section = document.createElement('div');
            section.className = 'grid-section';
            section.innerHTML = `
                <div class="grid-section-header">
                    <i class="fas fa-minus-circle danger-icon"></i>
                    <h4>Removed Tables (${differences.tablesRemoved.length})</h4>
                    <button class="section-toggle" onclick="TablesTab.toggleSection(this)">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
                <div class="grid-items"></div>
            `;
            
            const itemsContainer = section.querySelector('.grid-items');
            differences.tablesRemoved.forEach(table => {
                itemsContainer.appendChild(this.createTableCard(table, schema1.tables[table], 'removed'));
            });
            grid.appendChild(section);
        }

        // Changed tables
        if (Object.keys(differences.tablesChanged).length > 0) {
            const section = document.createElement('div');
            section.className = 'grid-section';
            section.innerHTML = `
                <div class="grid-section-header">
                    <i class="fas fa-exchange-alt warning-icon"></i>
                    <h4>Changed Tables (${Object.keys(differences.tablesChanged).length})</h4>
                    <button class="section-toggle" onclick="TablesTab.toggleSection(this)">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
                <div class="grid-items"></div>
            `;
            
            const itemsContainer = section.querySelector('.grid-items');
            Object.keys(differences.tablesChanged).forEach(table => {
                itemsContainer.appendChild(this.createChangedTableCard(
                    table, 
                    schema1.tables[table], 
                    schema2.tables[table], 
                    differences
                ));
            });
            grid.appendChild(section);
        }

        this.setupTableFilters();
        this.setupExpandCollapse();
    },

    displaySimilarities: function(schema1, schema2) {
        const container = document.getElementById('tables-view-container');
        container.innerHTML = '';

        const tables1 = new Set(Object.keys(schema1.tables));
        const tables2 = new Set(Object.keys(schema2.tables));
        const commonTables = [...tables1].filter(t => tables2.has(t));
        
        const similarTables = commonTables.filter(table => {
            return !(this.isTableChanged(table, schema1, schema2));
        });

        if (similarTables.length === 0) {
            container.innerHTML = '<p class="no-changes">No identical tables found.</p>';
            return;
        }

        container.innerHTML = `
            <div class="table-filters">
                <div class="filter-group">
                    <label for="table-filter"><i class="fas fa-filter"></i> Filter:</label>
                    <input type="text" id="table-filter" placeholder="Filter tables...">
                </div>
                <div class="filter-group">
                    <label for="table-sort"><i class="fas fa-sort"></i> Sort by:</label>
                    <select id="table-sort">
                        <option value="name">Name</option>
                        <option value="columns">Column Count</option>
                    </select>
                </div>
                <div class="filter-group">
                    <button id="expand-all" class="filter-btn">
                        <i class="fas fa-expand"></i> Expand All
                    </button>
                    <button id="collapse-all" class="filter-btn">
                        <i class="fas fa-compress"></i> Collapse All
                    </button>
                </div>
            </div>
            <div class="similar-tables-count">
                <i class="fas fa-check-circle success-icon"></i>
                ${similarTables.length} identical tables found
            </div>
            <div class="table-grid" id="tables-grid"></div>
        `;

        const grid = document.getElementById('tables-grid');
        const section = document.createElement('div');
        section.className = 'grid-section';
        section.innerHTML = `
            <div class="grid-section-header">
                <i class="fas fa-check-circle success-icon"></i>
                <h4>Identical Tables</h4>
                <button class="section-toggle" onclick="TablesTab.toggleSection(this)">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            <div class="grid-items similar-tables"></div>
        `;
        
        const itemsContainer = section.querySelector('.grid-items');
        similarTables.forEach(table => {
            itemsContainer.appendChild(this.createTableCard(table, schema1.tables[table], 'similar'));
        });

        grid.appendChild(section);
        this.setupTableFilters();
        this.setupExpandCollapse();
    },
    
    displayAllTables: function(schema1, schema2) {
        const container = document.getElementById('tables-view-container');
        container.innerHTML = '';
        
        const allTables = new Set([
            ...Object.keys(schema1.tables),
            ...Object.keys(schema2.tables)
        ]);
        
        if (allTables.size === 0) {
            container.innerHTML = '<p class="no-changes">No tables found in either schema.</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="table-filters">
                <div class="filter-group">
                    <label for="table-filter"><i class="fas fa-filter"></i> Filter:</label>
                    <input type="text" id="table-filter" placeholder="Filter tables...">
                </div>
                <div class="filter-group">
                    <label for="table-sort"><i class="fas fa-sort"></i> Sort by:</label>
                    <select id="table-sort">
                        <option value="name">Name</option>
                        <option value="status">Status</option>
                        <option value="columns">Column Count</option>
                    </select>
                </div>
                <div class="filter-group">
                    <button id="expand-all" class="filter-btn">
                        <i class="fas fa-expand"></i> Expand All
                    </button>
                    <button id="collapse-all" class="filter-btn">
                        <i class="fas fa-compress"></i> Collapse All
                    </button>
                </div>
            </div>
            <div class="table-grid" id="tables-grid"></div>
        `;
        
        const grid = document.getElementById('tables-grid');
        const section = document.createElement('div');
        section.className = 'grid-section';
        section.innerHTML = `
            <div class="grid-section-header">
                <i class="fas fa-table"></i>
                <h4>All Tables (${allTables.size})</h4>
                <button class="section-toggle" onclick="TablesTab.toggleSection(this)">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            <div class="grid-items all-tables"></div>
        `;
        
        const itemsContainer = section.querySelector('.grid-items');
        const sortedTables = [...allTables].sort((a, b) => a.localeCompare(b));
        
        sortedTables.forEach(table => {
            const inSchema1 = schema1.tables[table] !== undefined;
            const inSchema2 = schema2.tables[table] !== undefined;
            
            if (inSchema1 && inSchema2) {
                if (this.isTableChanged(table, schema1, schema2)) {
                    itemsContainer.appendChild(this.createChangedTableCard(
                        table, 
                        schema1.tables[table], 
                        schema2.tables[table], 
                        {}
                    ));
                } else {
                    itemsContainer.appendChild(this.createTableCard(table, schema1.tables[table], 'similar'));
                }
            } else if (inSchema1) {
                itemsContainer.appendChild(this.createTableCard(table, schema1.tables[table], 'removed'));
            } else {
                itemsContainer.appendChild(this.createTableCard(table, schema2.tables[table], 'added'));
            }
        });
        
        grid.appendChild(section);
        this.setupTableFilters();
        this.setupExpandCollapse();
    },

    isTableChanged: function(table, schema1, schema2) {
        const table1 = schema1.tables[table];
        const table2 = schema2.tables[table];

        const allAttrs = new Set([
            ...Object.keys(table1.attributes),
            ...Object.keys(table2.attributes)
        ]);

        for (const attr of allAttrs) {
            const val1 = table1.attributes[attr] || null;
            const val2 = table2.attributes[attr] || null;
            if (val1 !== val2) return true;
        }

        const columns1 = new Set(Object.keys(table1.columns));
        const columns2 = new Set(Object.keys(table2.columns));

        if ([...columns2].filter(c => !columns1.has(c)).length > 0) return true;
        if ([...columns1].filter(c => !columns2.has(c)).length > 0) return true;

        const commonColumns = [...columns1].filter(c => columns2.has(c));
        for (const col of commonColumns) {
            const col1 = table1.columns[col];
            const col2 = table2.columns[col];

            const allColAttrs = new Set([
                ...Object.keys(col1),
                ...Object.keys(col2)
            ]);

            for (const attr of allColAttrs) {
                const val1 = col1[attr] || null;
                const val2 = col2[attr] || null;
                if (val1 !== val2) return true;
            }
        }

        return false;
    },

    createTableCard: function(tableName, tableData, type) {
        const card = document.createElement('div');
        card.className = `table-card ${type}`;
        
        let columnsList = '';
        Object.entries(tableData.columns).forEach(([colName, colData]) => {
            columnsList += `
                <div class="table-column">
                    <div class="column-name">${colName}</div>
                    <div class="column-type">${colData.type || 'string'}</div>
                    ${colData.formula ? `<div class="column-formula-toggle" onclick="TablesTab.toggleFormula(this)">
                        <i class="fas fa-eye"></i> View Formula
                    </div>` : ''}
                    ${colData.formula ? `
                    <div class="column-formula" style="display: none;">
                        <pre>${this.formatFormula(colData.formula)}</pre>
                    </div>` : ''}
                </div>
            `;
        });

        let statusIcon, statusText;
        switch(type) {
            case 'added':
                statusIcon = 'fa-plus-circle success-icon';
                statusText = 'Added';
                break;
            case 'removed':
                statusIcon = 'fa-minus-circle danger-icon';
                statusText = 'Removed';
                break;
            case 'similar':
                statusIcon = 'fa-check-circle success-icon';
                statusText = 'Unchanged';
                break;
            default:
                statusIcon = 'fa-table';
                statusText = 'Table';
        }

        card.innerHTML = `
            <div class="table-card-header">
                <div class="table-name-container">
                    <div class="table-name">${tableName}</div>
                    <button class="table-toggle" onclick="TablesTab.toggleTableCard(this)">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
                <div class="table-status">
                    <i class="fas ${statusIcon}"></i> ${statusText}
                </div>
                <div class="table-type">${tableData.attributes.type || 'table'}</div>
                <div class="table-meta">
                    <span class="meta-item" title="Columns">
                        <i class="fas fa-columns"></i> ${Object.keys(tableData.columns).length}
                    </span>
                    ${tableData.attributes.cached ? `
                    <span class="meta-item" title="Cached">
                        <i class="fas fa-bolt"></i> Cached
                    </span>` : ''}
                </div>
            </div>
            <div class="table-card-body">
                <div class="table-attributes">
                    ${Object.entries(tableData.attributes).map(([attr, val]) => `
                        <div class="table-attr">
                            <span class="attr-name">${attr}:</span>
                            <span class="attr-value">${val}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="table-columns">
                    <div class="columns-header">
                        <i class="fas fa-columns"></i> Columns
                    </div>
                    <div class="columns-list">
                        ${columnsList}
                    </div>
                </div>
            </div>
        `;

        return card;
    },

    createChangedTableCard: function(tableName, table1, table2, differences) {
        const card = document.createElement('div');
        card.className = 'table-card changed';
        
        const allColumns = new Set([
            ...Object.keys(table1.columns),
            ...Object.keys(table2.columns)
        ]);
        
        let columnsList = '';
        [...allColumns].forEach(colName => {
            const col1 = table1.columns[colName];
            const col2 = table2.columns[colName];
            
            if (!col1) {
                columnsList += this.createColumnDiffHtml(colName, null, col2, 'added');
            } else if (!col2) {
                columnsList += this.createColumnDiffHtml(colName, col1, null, 'removed');
            } else if (JSON.stringify(col1) !== JSON.stringify(col2)) {
                columnsList += this.createColumnDiffHtml(colName, col1, col2, 'changed');
            } else {
                columnsList += this.createColumnDiffHtml(colName, col1, col2, 'unchanged');
            }
        });

        let attributesHtml = '';
        const allAttrs = new Set([
            ...Object.keys(table1.attributes),
            ...Object.keys(table2.attributes)
        ]);
        
        [...allAttrs].forEach(attr => {
            const val1 = table1.attributes[attr] || null;
            const val2 = table2.attributes[attr] || null;
            
            if (val1 !== val2) {
                attributesHtml += `
                    <div class="table-attr changed">
                        <span class="attr-name">${attr}:</span>
                        <span class="attr-value">
                            <span class="old-value">${val1 || 'null'}</span>
                            <i class="fas fa-arrow-right"></i>
                            <span class="new-value">${val2 || 'null'}</span>
                        </span>
                    </div>
                `;
            } else {
                attributesHtml += `
                    <div class="table-attr">
                        <span class="attr-name">${attr}:</span>
                        <span class="attr-value">${val1}</span>
                    </div>
                `;
            }
        });

        const addedCols = differences.columnsAdded && differences.columnsAdded[tableName] 
            ? Object.keys(differences.columnsAdded[tableName]).length : 0;
        const removedCols = differences.columnsRemoved && differences.columnsRemoved[tableName] 
            ? Object.keys(differences.columnsRemoved[tableName]).length : 0;
        const changedCols = differences.columnsChanged && differences.columnsChanged[tableName] 
            ? Object.keys(differences.columnsChanged[tableName]).length : 0;

        card.innerHTML = `
            <div class="table-card-header">
                <div class="table-name-container">
                    <div class="table-name">${tableName}</div>
                    <button class="table-toggle" onclick="TablesTab.toggleTableCard(this)">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
                <div class="table-status">
                    <i class="fas fa-exchange-alt warning-icon"></i> Changed
                </div>
                <div class="table-type">${table2.attributes.type || table1.attributes.type || 'table'}</div>
                <div class="table-meta">
                    <span class="meta-item" title="Columns">
                        <i class="fas fa-columns"></i> ${Object.keys(table2.columns).length}
                        <span class="meta-change">
                            (${addedCols}+ / ${removedCols}- / ${changedCols}Δ)
                        </span>
                    </span>
                    ${table2.attributes.cached ? `
                    <span class="meta-item" title="Cached">
                        <i class="fas fa-bolt"></i> Cached
                    </span>` : ''}
                </div>
            </div>
            <div class="table-card-body">
                <div class="table-attributes">
                    ${attributesHtml}
                </div>
                <div class="table-columns">
                    <div class="columns-header">
                        <i class="fas fa-columns"></i> Columns
                        <div class="column-filter-toggle">
                            <button class="filter-btn active" data-filter="all">All</button>
                            <button class="filter-btn" data-filter="added">Added</button>
                            <button class="filter-btn" data-filter="removed">Removed</button>
                            <button class="filter-btn" data-filter="changed">Changed</button>
                            <button class="filter-btn" data-filter="unchanged">Unchanged</button>
                        </div>
                    </div>
                    <div class="columns-list">
                        ${columnsList}
                    </div>
                </div>
            </div>
        `;

        card.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                card.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                const filter = this.dataset.filter;
                card.querySelectorAll('.table-column').forEach(col => {
                    if (filter === 'all') {
                        col.style.display = 'flex';
                    } else {
                        col.style.display = col.classList.contains(filter) ? 'flex' : 'none';
                    }
                });
            });
        });

        return card;
    },



    formatFormula: function(formula) {
        if (!formula) return '';
        
        let formatted = formula
            .replace(/,/g, ', ')
            .replace(/\(/g, ' (')
            .replace(/\)/g, ' )')
            .replace(/([+\-*/=<>!])/g, ' $1 ')
            .replace(/\s+/g, ' ')
            .trim();
            
        return formatted;
    },

    toggleFormula: function(element) {
        const formulaDiv = element.nextElementSibling;
        if (formulaDiv.style.display === 'none') {
            formulaDiv.style.display = 'block';
            element.innerHTML = '<i class="fas fa-eye-slash"></i> Hide Formula';
        } else {
            formulaDiv.style.display = 'none';
            element.innerHTML = '<i class="fas fa-eye"></i> View Formula';
        }
    },
    
    toggleSection: function(button) {
        const section = button.closest('.grid-section');
        const itemsContainer = section.querySelector('.grid-items');
        
        if (itemsContainer.style.display === 'none') {
            itemsContainer.style.display = 'grid';
            button.innerHTML = '<i class="fas fa-chevron-down"></i>';
        } else {
            itemsContainer.style.display = 'none';
            button.innerHTML = '<i class="fas fa-chevron-right"></i>';
        }
    },

    toggleTableCard: function(button) {
        const card = button.closest('.table-card');
        const body = card.querySelector('.table-card-body');
        
        if (body.style.display === 'none') {
            body.style.display = 'block';
            button.innerHTML = '<i class="fas fa-chevron-up"></i>';
        } else {
            body.style.display = 'none';
            button.innerHTML = '<i class="fas fa-chevron-down"></i>';
        }
    },

    setupTableFilters: function() {
        const filterInput = document.getElementById('table-filter');
        const sortSelect = document.getElementById('table-sort');
        
        if (filterInput) {
            filterInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                document.querySelectorAll('.table-card').forEach(card => {
                    const tableName = card.querySelector('.table-name').textContent.toLowerCase();
                    card.style.display = tableName.includes(searchTerm) ? 'block' : 'none';
                });
            });
        }
        
        if (sortSelect) {
            sortSelect.addEventListener('change', function() {
                const sortBy = this.value;
                const grid = document.getElementById('tables-grid');
                const sections = grid.querySelectorAll('.grid-section');
                
                sections.forEach(section => {
                    const itemsContainer = section.querySelector('.grid-items');
                    const items = [...itemsContainer.querySelectorAll('.table-card')];
                    
                    items.sort((a, b) => {
                        if (sortBy === 'name') {
                            return a.querySelector('.table-name').textContent.localeCompare(
                                b.querySelector('.table-name').textContent
                            );
                        } else if (sortBy === 'columns') {
                            const countA = parseInt(a.querySelector('.meta-item i.fa-columns').nextSibling.textContent.trim());
                            const countB = parseInt(b.querySelector('.meta-item i.fa-columns').nextSibling.textContent.trim());
                            return countB - countA;
                        } else if (sortBy === 'status') {
                            const statusA = a.querySelector('.table-status').textContent.toLowerCase();
                            const statusB = b.querySelector('.table-status').textContent.toLowerCase();
                            return statusA.localeCompare(statusB);
                        } else if (sortBy === 'added') {
                            return a.classList.contains('added') ? -1 : 1;
                        } else if (sortBy === 'removed') {
                            return a.classList.contains('removed') ? -1 : 1;
                        } else if (sortBy === 'changed') {
                            return a.classList.contains('changed') ? -1 : 1;
                        }
                        return 0;
                    });
                    
                    items.forEach(item => itemsContainer.appendChild(item));
                });
            });
        }
    },

    setupExpandCollapse: function() {
        document.getElementById('expand-all')?.addEventListener('click', () => {
            document.querySelectorAll('.table-card-body').forEach(el => {
                el.style.display = 'block';
            });
            document.querySelectorAll('.table-toggle').forEach(btn => {
                btn.innerHTML = '<i class="fas fa-chevron-up"></i>';
            });
        });
        
        document.getElementById('collapse-all')?.addEventListener('click', () => {
            document.querySelectorAll('.table-card-body').forEach(el => {
                el.style.display = 'none';
            });
            document.querySelectorAll('.table-toggle').forEach(btn => {
                btn.innerHTML = '<i class="fas fa-chevron-down"></i>';
            });
        });
    }
};

window.TablesTab = TablesTab;