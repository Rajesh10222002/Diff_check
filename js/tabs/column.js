const ColumnsTab = {
    display: function(differences, schema1, schema2) {
        const columnsDetailsSection = document.getElementById('columns-details');
        columnsDetailsSection.innerHTML = '<h3 class="section-title">Columns Details</h3>';

        if (Object.keys(differences.columnsAdded).length === 0 &&
            Object.keys(differences.columnsRemoved).length === 0 &&
            Object.keys(differences.columnsChanged).length === 0) {
            columnsDetailsSection.innerHTML += '<p>No column changes found.</p>';
            return;
        }

        this.displayAddedColumns(differences, columnsDetailsSection);
        this.displayRemovedColumns(differences, columnsDetailsSection);
        this.displayChangedColumns(differences, columnsDetailsSection);
    },

    displayAddedColumns: function(differences, container) {
        if (Object.keys(differences.columnsAdded).length === 0) return;

        const addedDiv = document.createElement('div');
        addedDiv.className = 'diff-item diff-added';
        addedDiv.innerHTML = '<div class="diff-item-title"><i class="fas fa-plus-circle"></i> Added Columns</div>';

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'diff-details';

        for (const [table, columns] of Object.entries(differences.columnsAdded)) {
            detailsDiv.innerHTML += `
                <div class="diff-table">
                    <div class="diff-table-header">Table: ${table}</div>
                    <div class="diff-table-content">
                        <div class="diff-row">
                            <div class="diff-label">Columns Added</div>
                            <div class="diff-value">${Object.keys(columns).length}</div>
                        </div>
                        <div class="diff-row">
                            <div class="diff-label">Column Names</div>
                            <div class="diff-value">${Object.keys(columns).join(', ')}</div>
                        </div>
                    </div>
                </div>
            `;
        }

        addedDiv.appendChild(detailsDiv);
        container.appendChild(addedDiv);
    },

    displayRemovedColumns: function(differences, container) {
        if (Object.keys(differences.columnsRemoved).length === 0) return;

        const removedDiv = document.createElement('div');
        removedDiv.className = 'diff-item diff-removed';
        removedDiv.innerHTML = '<div class="diff-item-title"><i class="fas fa-minus-circle"></i> Removed Columns</div>';

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'diff-details';

        for (const [table, columns] of Object.entries(differences.columnsRemoved)) {
            detailsDiv.innerHTML += `
                <div class="diff-table">
                    <div class="diff-table-header">Table: ${table}</div>
                    <div class="diff-table-content">
                        <div class="diff-row">
                            <div class="diff-label">Columns Removed</div>
                            <div class="diff-value">${Object.keys(columns).length}</div>
                        </div>
                        <div class="diff-row">
                            <div class="diff-label">Column Names</div>
                            <div class="diff-value">${Object.keys(columns).join(', ')}</div>
                        </div>
                    </div>
                </div>
            `;
        }

        removedDiv.appendChild(detailsDiv);
        container.appendChild(removedDiv);
    },

    displayChangedColumns: function(differences, container) {
        if (Object.keys(differences.columnsChanged).length === 0) return;

        const changedDiv = document.createElement('div');
        changedDiv.className = 'diff-item diff-changed';
        changedDiv.innerHTML = '<div class="diff-item-title"><i class="fas fa-exchange-alt"></i> Changed Columns</div>';

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'diff-details';

        for (const [table, columns] of Object.entries(differences.columnsChanged)) {
            detailsDiv.innerHTML += `
                <div class="diff-table">
                    <div class="diff-table-header">Table: ${table}</div>
                    <div class="diff-table-content">
                        <div class="diff-row">
                            <div class="diff-label">Changed Columns</div>
                            <div class="diff-value">${Object.keys(columns).length}</div>
                        </div>
            `;

            for (const [col, attrs] of Object.entries(columns)) {
                detailsDiv.innerHTML += `
                    <div class="diff-column">
                        <div class="diff-column-header">${col}</div>
                        <div class="diff-column-content">
                            <div class="diff-row">
                                <div class="diff-label">Changed Attributes</div>
                                <div class="diff-value">${Object.keys(attrs).join(', ')}</div>
                            </div>
                        </div>
                    </div>
                `;
            }

            detailsDiv.innerHTML += `</div></div>`;
        }

        changedDiv.appendChild(detailsDiv);
        container.appendChild(changedDiv);
    }
};