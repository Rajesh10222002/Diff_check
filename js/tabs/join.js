const JoinsTab = {
    display: function(differences, schema1, schema2) {
        const joinsDetailsSection = document.getElementById('joins-details');
        joinsDetailsSection.innerHTML = '<h3 class="section-title">Joins Details</h3>';

        if (differences.joinsAdded.length === 0 &&
            differences.joinsRemoved.length === 0 &&
            Object.keys(differences.joinsChanged).length === 0) {
            joinsDetailsSection.innerHTML += '<p>No join changes found.</p>';
            return;
        }

        this.displayAddedJoins(differences, joinsDetailsSection);
        this.displayRemovedJoins(differences, joinsDetailsSection);
        this.displayChangedJoins(differences, joinsDetailsSection);
    },

    displayAddedJoins: function(differences, container) {
        if (differences.joinsAdded.length === 0) return;

        const addedDiv = document.createElement('div');
        addedDiv.className = 'diff-item diff-added';
        addedDiv.innerHTML = `
            <div class="diff-item-title">
                <i class="fas fa-plus-circle"></i> Added Joins (${differences.joinsAdded.length})
            </div>
            <div class="diff-details">
                ${differences.joinsAdded.map(joinStr => this.createJoinDetails(joinStr)).join('')}
            </div>
        `;
        container.appendChild(addedDiv);
    },

    displayRemovedJoins: function(differences, container) {
        if (differences.joinsRemoved.length === 0) return;

        const removedDiv = document.createElement('div');
        removedDiv.className = 'diff-item diff-removed';
        removedDiv.innerHTML = `
            <div class="diff-item-title">
                <i class="fas fa-minus-circle"></i> Removed Joins (${differences.joinsRemoved.length})
            </div>
            <div class="diff-details">
                ${differences.joinsRemoved.map(joinStr => this.createJoinDetails(joinStr)).join('')}
            </div>
        `;
        container.appendChild(removedDiv);
    },

    displayChangedJoins: function(differences, container) {
        if (Object.keys(differences.joinsChanged).length === 0) return;

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
        container.appendChild(changedDiv);
    },

    createJoinDetails: function(joinStr) {
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
    }
};