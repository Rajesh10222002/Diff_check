const OverviewTab = {
    display: function(differences, schema1, schema2) {
        this.displaySchemaChanges(differences);
        this.displayTablesOverview(differences);
        this.displayJoinsOverview(differences);
    },

    displaySchemaChanges: function(differences) {
        const schemaChangesSection = document.getElementById('schema-changes');
        schemaChangesSection.innerHTML = `
            <h3 class="section-title">
                <i class="fas fa-project-diagram"></i> Schema Changes
            </h3>
        `;

        if (Object.keys(differences.schemaChanges).length === 0) {
            schemaChangesSection.innerHTML += `
                <div class="diff-item">
                    <div class="diff-item-title">
                        <i class="fas fa-check-circle" style="color: var(--success-color)"></i> No schema-level changes found
                    </div>
                </div>
            `;
        } else {
            const schemaChangesDiv = document.createElement('div');
            schemaChangesDiv.className = 'diff-item diff-changed';
            schemaChangesDiv.innerHTML = `
                <div class="diff-item-title">
                    <i class="fas fa-exclamation-circle"></i> Schema Attributes Changed
                </div>
            `;

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'diff-details';

            for (const [attr, change] of Object.entries(differences.schemaChanges)) {
                detailsDiv.innerHTML += `
                    <div class="diff-row">
                        <div class="diff-label">${attr}</div>
                        <div class="diff-value">
                            <span class="diff-value-removed">${change.old || 'null'}</span> 
                            <i class="fas fa-arrow-right" style="margin: 0 10px; color: #94a3b8"></i>
                            <span class="diff-value-added">${change.new || 'null'}</span>
                        </div>
                    </div>
                `;
            }

            schemaChangesDiv.appendChild(detailsDiv);
            schemaChangesSection.appendChild(schemaChangesDiv);
        }
    },

    displayTablesOverview: function(differences) {
        const tablesOverviewSection = document.getElementById('tables-overview');
        tablesOverviewSection.innerHTML = '<h3 class="section-title">Tables Overview</h3>';

        if (differences.tablesAdded.length === 0 &&
            differences.tablesRemoved.length === 0 &&
            Object.keys(differences.tablesChanged).length === 0) {
            tablesOverviewSection.innerHTML += '<p>No table changes found.</p>';
        } else {
            if (differences.tablesAdded.length > 0) {
                const addedDiv = document.createElement('div');
                addedDiv.className = 'diff-item diff-added';
                addedDiv.innerHTML = `
                    <div class="diff-item-title">
                        <i class="fas fa-plus-circle"></i> Added Tables (${differences.tablesAdded.length})
                    </div>
                    <div class="diff-details">
                        ${differences.tablesAdded.map(t => `<div class="diff-row">${t}</div>`).join('')}
                    </div>
                `;
                tablesOverviewSection.appendChild(addedDiv);
            }

            if (differences.tablesRemoved.length > 0) {
                const removedDiv = document.createElement('div');
                removedDiv.className = 'diff-item diff-removed';
                removedDiv.innerHTML = `
                    <div class="diff-item-title">
                        <i class="fas fa-minus-circle"></i> Removed Tables (${differences.tablesRemoved.length})
                    </div>
                    <div class="diff-details">
                        ${differences.tablesRemoved.map(t => `<div class="diff-row">${t}</div>`).join('')}
                    </div>
                `;
                tablesOverviewSection.appendChild(removedDiv);
            }

            if (Object.keys(differences.tablesChanged).length > 0) {
                const changedDiv = document.createElement('div');
                changedDiv.className = 'diff-item diff-changed';
                changedDiv.innerHTML = `
                    <div class="diff-item-title">
                        <i class="fas fa-exchange-alt"></i> Changed Tables (${Object.keys(differences.tablesChanged).length})
                    </div>
                    <div class="diff-details">
                        ${Object.keys(differences.tablesChanged).map(t => `<div class="diff-row">${t}</div>`).join('')}
                    </div>
                `;
                tablesOverviewSection.appendChild(changedDiv);
            }
        }
    },

    displayJoinsOverview: function(differences) {
        const joinsOverviewSection = document.getElementById('joins-overview');
        joinsOverviewSection.innerHTML = '<h3 class="section-title">Joins Overview</h3>';

        if (differences.joinsAdded.length === 0 &&
            differences.joinsRemoved.length === 0 &&
            Object.keys(differences.joinsChanged).length === 0) {
            joinsOverviewSection.innerHTML += '<p>No join changes found.</p>';
        } else {
            if (differences.joinsAdded.length > 0) {
                joinsOverviewSection.innerHTML += `
                    <div class="diff-item diff-added">
                        <div class="diff-item-title">
                            <i class="fas fa-plus-circle"></i> Added Joins (${differences.joinsAdded.length})
                        </div>
                    </div>
                `;
            }

            if (differences.joinsRemoved.length > 0) {
                joinsOverviewSection.innerHTML += `
                    <div class="diff-item diff-removed">
                        <div class="diff-item-title">
                            <i class="fas fa-minus-circle"></i> Removed Joins (${differences.joinsRemoved.length})
                        </div>
                    </div>
                `;
            }

            if (Object.keys(differences.joinsChanged).length > 0) {
                joinsOverviewSection.innerHTML += `
                    <div class="diff-item diff-changed">
                        <div class="diff-item-title">
                            <i class="fas fa-exchange-alt"></i> Changed Joins (${Object.keys(differences.joinsChanged).length})
                        </div>
                    </div>
                `;
            }
        }
    }
};