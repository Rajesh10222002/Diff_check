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
    let schema1 = null;
    let schema2 = null;

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

            [schema1, schema2] = await Promise.all([
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

        // Delegate to tab-specific display functions
        OverviewTab.display(differences, schema1, schema2);
        TablesTab.display(differences, schema1, schema2);
        ColumnsTab.display(differences, schema1, schema2);
        JoinsTab.display(differences, schema1, schema2);
    }
});