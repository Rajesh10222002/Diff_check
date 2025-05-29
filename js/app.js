document.addEventListener('DOMContentLoaded', function () {
    // DOM elements
    const zip1Input = document.getElementById('zip1');
    const zip2Input = document.getElementById('zip2');
    const file1Name = document.getElementById('file1-name');
    const file2Name = document.getElementById('file2-name');
    const compareBtn = document.getElementById('compare-btn');
    const resultsSection = document.getElementById('results-section');
    const exportJsonBtn = document.getElementById('export-json');

    // Store comparison results for export
    let comparisonResults = null;

    // File handling
    zip1Input.addEventListener('change', function () {
        if (this.files.length > 0) {
            file1Name.textContent = this.files[0].name;
            file1Name.classList.add('file-selected');
            checkFilesReady();
        }
    });

    zip2Input.addEventListener('change', function () {
        if (this.files.length > 0) {
            file2Name.textContent = this.files[0].name;
            file2Name.classList.add('file-selected');
            checkFilesReady();
        }
    });

    function checkFilesReady() {
        if (zip1Input.files.length > 0 && zip2Input.files.length > 0) {
            compareBtn.disabled = false;
            compareBtn.classList.add('ready');
        } else {
            compareBtn.disabled = true;
            compareBtn.classList.remove('ready');
        }
    }

    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            const tabName = this.getAttribute('data-tab');

            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Update active tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });

    // Export functionality
    exportJsonBtn.addEventListener('click', function() {
        if (!comparisonResults) {
            alert('No comparison results to export');
            return;
        }
        
        const dataStr = JSON.stringify(comparisonResults, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        saveAs(blob, 'schema-comparison.json');
    });



    // Comparison logic
    compareBtn.addEventListener('click', async function () {
        try {
            compareBtn.disabled = true;
            compareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Comparing...';

            const [schema1, schema2] = await Promise.all([
                SchemaParser.parseSchemaFromZip(zip1Input.files[0]),
                SchemaParser.parseSchemaFromZip(zip2Input.files[0])
            ]);

            comparisonResults = SchemaParser.compareSchemas(schema1, schema2);
            displayResults(comparisonResults, schema1, schema2);

            resultsSection.style.display = 'block';
            window.scrollTo({
                top: resultsSection.offsetTop - 20,
                behavior: 'smooth'
            });
        } catch (error) {
            showErrorModal(`Error comparing schemas: ${error.message}`);
            console.error(error);
        } finally {
            compareBtn.disabled = false;
            compareBtn.innerHTML = '<i class="fas fa-random"></i> Compare Schemas';
        }
    });

    function showErrorModal(message) {
        // Create modal element
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Error</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="modal-ok-btn">OK</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.modal-ok-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    // Display results (updated with more visual elements)
    function displayResults(differences, schema1, schema2) {
        // Update summary
        const summary = document.getElementById('summary');
        summary.innerHTML = `
            <div class="summary-item summary-added">
                <i class="fas fa-plus-circle"></i>
                ${differences.tablesAdded.length} tables added
            </div>
            <div class="summary-item summary-removed">
                <i class="fas fa-minus-circle"></i>
                ${differences.tablesRemoved.length} tables removed
            </div>
            <div class="summary-item summary-changed">
                <i class="fas fa-exchange-alt"></i>
                ${Object.keys(differences.tablesChanged).length} tables changed
            </div>
            <div class="summary-item summary-added">
                <i class="fas fa-plus-circle"></i>
                ${differences.joinsAdded.length} joins added
            </div>
            <div class="summary-item summary-removed">
                <i class="fas fa-minus-circle"></i>
                ${differences.joinsRemoved.length} joins removed
            </div>
            <div class="summary-item summary-changed">
                <i class="fas fa-exchange-alt"></i>
                ${Object.keys(differences.joinsChanged).length} joins changed
            </div>
        `;

        // Schema changes
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

        // Tables overview
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

        // Tables details
        const tablesDetailsSection = document.getElementById('tables-details');
        tablesDetailsSection.innerHTML = '<h3 class="section-title">Tables Details</h3>';

        if (differences.tablesAdded.length === 0 &&
            differences.tablesRemoved.length === 0 &&
            Object.keys(differences.tablesChanged).length === 0) {
            tablesDetailsSection.innerHTML += '<p>No table changes found.</p>';
        } else {
            // Added tables section
            if (differences.tablesAdded.length > 0) {
                const addedDiv = document.createElement('div');
                addedDiv.className = 'diff-item diff-added';
                addedDiv.innerHTML = `
                    <div class="diff-item-title">
                        <i class="fas fa-plus-circle"></i> Added Tables (${differences.tablesAdded.length})
                    </div>
                    <div class="diff-details">
                        ${differences.tablesAdded.map(t => `
                            <div class="diff-table">
                                <div class="diff-table-header">${t}</div>
                                <div class="diff-table-content">
                                    <div class="diff-row">
                                        <div class="diff-label">Columns Count</div>
                                        <div class="diff-value">${Object.keys(schema2.tables[t].columns).length}</div>
                                    </div>
                                    ${Object.entries(schema2.tables[t].attributes).map(([attr, val]) => `
                                        <div class="diff-row">
                                            <div class="diff-label">${attr}</div>
                                            <div class="diff-value">${val}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                tablesDetailsSection.appendChild(addedDiv);
            }

            // Removed tables section
            if (differences.tablesRemoved.length > 0) {
                const removedDiv = document.createElement('div');
                removedDiv.className = 'diff-item diff-removed';
                removedDiv.innerHTML = `
                    <div class="diff-item-title">
                        <i class="fas fa-minus-circle"></i> Removed Tables (${differences.tablesRemoved.length})
                    </div>
                    <div class="diff-details">
                        ${differences.tablesRemoved.map(t => `
                            <div class="diff-table">
                                <div class="diff-table-header">${t}</div>
                                <div class="diff-table-content">
                                    <div class="diff-row">
                                        <div class="diff-label">Columns Count</div>
                                        <div class="diff-value">${Object.keys(schema1.tables[t].columns).length}</div>
                                    </div>
                                    ${Object.entries(schema1.tables[t].attributes).map(([attr, val]) => `
                                        <div class="diff-row">
                                            <div class="diff-label">${attr}</div>
                                            <div class="diff-value">${val}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                tablesDetailsSection.appendChild(removedDiv);
            }

            // Changed tables section
            // Changed tables section
if (Object.keys(differences.tablesChanged).length > 0) {
    const changedDiv = document.createElement('div');
    changedDiv.className = 'diff-item diff-changed';
    changedDiv.innerHTML = `
        <div class="diff-item-title">
            <i class="fas fa-exchange-alt"></i> Changed Tables (${Object.keys(differences.tablesChanged).length})
        </div>
    `;

    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'diff-details';

    for (const [table, changes] of Object.entries(differences.tablesChanged)) {
        const tableDiv = document.createElement('div');
        tableDiv.className = 'diff-table';
        tableDiv.innerHTML = `<div class="diff-table-header">${table}</div>`;

        const tableContent = document.createElement('div');
        tableContent.className = 'diff-table-content';

        // Table attributes changes
        if (Object.keys(changes.attributes).length > 0) {
            tableContent.innerHTML += '<div class="diff-section-title">Table Attributes Changes:</div>';
            for (const [attr, change] of Object.entries(changes.attributes)) {
                tableContent.innerHTML += `
                    <div class="diff-row">
                        <div class="diff-label">${attr}</div>
                        <div class="diff-value">
                            <span class="diff-value-removed">${change.old || 'null'}</span> →
                            <span class="diff-value-added">${change.new || 'null'}</span>
                        </div>
                    </div>
                `;
            }
        }

        // Columns added - simplified to just show column names
        if (differences.columnsAdded[table]) {
            tableContent.innerHTML += `
                <div class="diff-section-title">
                    Columns Added (${Object.keys(differences.columnsAdded[table]).length}):
                </div>
                <div class="diff-row">
                    ${Object.keys(differences.columnsAdded[table]).join(', ')}
                </div>
            `;
        }

        // Columns removed - simplified to just show column names
        if (differences.columnsRemoved[table]) {
            tableContent.innerHTML += `
                <div class="diff-section-title">
                    Columns Removed (${Object.keys(differences.columnsRemoved[table]).length}):
                </div>
                <div class="diff-row">
                    ${Object.keys(differences.columnsRemoved[table]).join(', ')}
                </div>
            `;
        }

        // Columns changed - simplified to just show column names
        if (differences.columnsChanged[table]) {
            tableContent.innerHTML += `
                <div class="diff-section-title">
                    Columns Changed (${Object.keys(differences.columnsChanged[table]).length}):
                </div>
                <div class="diff-row">
                    ${Object.keys(differences.columnsChanged[table]).join(', ')}
                </div>
            `;
        }

        tableDiv.appendChild(tableContent);
        detailsDiv.appendChild(tableDiv);
    }

    changedDiv.appendChild(detailsDiv);
    tablesDetailsSection.appendChild(changedDiv);
}
        }
        

       // In the displayResults function, replace the columns details section with this:
const columnsDetailsSection = document.getElementById('columns-details');
columnsDetailsSection.innerHTML = '<h3 class="section-title">Columns Details</h3>';

if (Object.keys(differences.columnsAdded).length === 0 &&
    Object.keys(differences.columnsRemoved).length === 0 &&
    Object.keys(differences.columnsChanged).length === 0) {
    columnsDetailsSection.innerHTML += '<p>No column changes found.</p>';
} else {
    // Added columns
    if (Object.keys(differences.columnsAdded).length > 0) {
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
        columnsDetailsSection.appendChild(addedDiv);
    }

    // Removed columns
    if (Object.keys(differences.columnsRemoved).length > 0) {
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
        columnsDetailsSection.appendChild(removedDiv);
    }

    // Changed columns - Simplified to just show column names
    // In the columnsChanged section of displayResults function
if (Object.keys(differences.columnsChanged).length > 0) {
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
    columnsDetailsSection.appendChild(changedDiv);
}
}
        // Joins details
        const joinsDetailsSection = document.getElementById('joins-details');
        joinsDetailsSection.innerHTML = '<h3 class="section-title">Joins Details</h3>';

        if (differences.joinsAdded.length === 0 &&
            differences.joinsRemoved.length === 0 &&
            Object.keys(differences.joinsChanged).length === 0) {
            joinsDetailsSection.innerHTML += '<p>No join changes found.</p>';
        } else {
            // Added joins
            if (differences.joinsAdded.length > 0) {
                const addedDiv = document.createElement('div');
                addedDiv.className = 'diff-item diff-added';
                addedDiv.innerHTML = `
                    <div class="diff-item-title">
                        <i class="fas fa-plus-circle"></i> Added Joins (${differences.joinsAdded.length})
                    </div>
                    <div class="diff-details">
                        ${differences.joinsAdded.map(joinStr => {
                            const parts = joinStr.split(' ');
                            const parentParts = parts[0].split('.');
                            const childParts = parts[2].split('.');
                            return `
                                <div class="diff-join">
                                    <div class="diff-join-header">${joinStr}</div>
                                    <div class="diff-join-content">
                                        <div class="diff-row">
                                            <div class="diff-label">Parent Table</div>
                                            <div class="diff-value">${parentParts[0]}.${parentParts[1]}</div>
                                        </div>
                                        <div class="diff-row">
                                            <div class="diff-label">Parent Column</div>
                                            <div class="diff-value">${parentParts[2]}</div>
                                        </div>
                                        <div class="diff-row">
                                            <div class="diff-label">Operator</div>
                                            <div class="diff-value">${parts[1]}</div>
                                        </div>
                                        <div class="diff-row">
                                            <div class="diff-label">Child Table</div>
                                            <div class="diff-value">${childParts[0]}.${childParts[1]}</div>
                                        </div>
                                        <div class="diff-row">
                                            <div class="diff-label">Child Column</div>
                                            <div class="diff-value">${childParts[2]}</div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
                joinsDetailsSection.appendChild(addedDiv);
            }

            // Removed joins
            if (differences.joinsRemoved.length > 0) {
                const removedDiv = document.createElement('div');
                removedDiv.className = 'diff-item diff-removed';
                removedDiv.innerHTML = `
                    <div class="diff-item-title">
                        <i class="fas fa-minus-circle"></i> Removed Joins (${differences.joinsRemoved.length})
                    </div>
                    <div class="diff-details">
                        ${differences.joinsRemoved.map(joinStr => {
                            const parts = joinStr.split(' ');
                            const parentParts = parts[0].split('.');
                            const childParts = parts[2].split('.');
                            return `
                                <div class="diff-join">
                                    <div class="diff-join-header">${joinStr}</div>
                                    <div class="diff-join-content">
                                        <div class="diff-row">
                                            <div class="diff-label">Parent Table</div>
                                            <div class="diff-value">${parentParts[0]}.${parentParts[1]}</div>
                                        </div>
                                        <div class="diff-row">
                                            <div class="diff-label">Parent Column</div>
                                            <div class="diff-value">${parentParts[2]}</div>
                                        </div>
                                        <div class="diff-row">
                                            <div class="diff-label">Operator</div>
                                            <div class="diff-value">${parts[1]}</div>
                                        </div>
                                        <div class="diff-row">
                                            <div class="diff-label">Child Table</div>
                                            <div class="diff-value">${childParts[0]}.${childParts[1]}</div>
                                        </div>
                                        <div class="diff-row">
                                            <div class="diff-label">Child Column</div>
                                            <div class="diff-value">${childParts[2]}</div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
                joinsDetailsSection.appendChild(removedDiv);
            }

            // Changed joins
            if (Object.keys(differences.joinsChanged).length > 0) {
                const changedDiv = document.createElement('div');
                changedDiv.className = 'diff-item diff-changed';
                changedDiv.innerHTML = `
                    <div class="diff-item-title">
                        <i class="fas fa-exchange-alt"></i> Changed Joins (${Object.keys(differences.joinsChanged).length})
                    </div>
                `;

                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'diff-details';

                for (const [joinStr, change] of Object.entries(differences.joinsChanged)) {
                    const oldParts = change.old.parent.split('.');
                    const newParts = change.new.parent.split('.');

                    detailsDiv.innerHTML += `
                        <div class="diff-join">
                            <div class="diff-join-header">${joinStr}</div>
                            <div class="diff-join-content">
                                <div class="diff-row">
                                    <div class="diff-label">Parent Table</div>
                                    <div class="diff-value">
                                        <span class="diff-value-removed">${oldParts[0]}.${oldParts[1]}</span> →
                                        <span class="diff-value-added">${newParts[0]}.${newParts[1]}</span>
                                    </div>
                                </div>
                                <div class="diff-row">
                                    <div class="diff-label">Parent Column</div>
                                    <div class="diff-value">
                                        <span class="diff-value-removed">${oldParts[2]}</span> →
                                        <span class="diff-value-added">${newParts[2]}</span>
                                    </div>
                                </div>
                                <div class="diff-row">
                                    <div class="diff-label">Operator</div>
                                    <div class="diff-value">
                                        <span class="diff-value-removed">${change.old.op}</span> →
                                        <span class="diff-value-added">${change.new.op}</span>
                                    </div>
                                </div>
                                <div class="diff-row">
                                    <div class="diff-label">Child Table</div>
                                    <div class="diff-value">
                                        <span class="diff-value-removed">${change.old.child.split('.')[0]}.${change.old.child.split('.')[1]}</span> →
                                        <span class="diff-value-added">${change.new.child.split('.')[0]}.${change.new.child.split('.')[1]}</span>
                                    </div>
                                </div>
                                <div class="diff-row">
                                    <div class="diff-label">Child Column</div>
                                    <div class="diff-value">
                                        <span class="diff-value-removed">${change.old.child.split('.')[2]}</span> →
                                        <span class="diff-value-added">${change.new.child.split('.')[2]}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                changedDiv.appendChild(detailsDiv);
                joinsDetailsSection.appendChild(changedDiv);
            }
        }
    }
});