// Migration Script for Existing User Data
class TaskDefinitionsMigration {
    constructor() {
        this.migratedReports = 0;
        this.failedMigrations = 0;
    }

    async migrateExistingReports() {
        try {
            console.log('Starting task definitions migration...');
            
            if (!window.PG_API) {
                throw new Error('Database client not available');
            }

            // Get all reports that might have old task_definitions_evaluation data
            const { data: reports, error } = await window.PG_API
                .from('reports')
                .select('id, task_definitions_evaluation')
                .not('task_definitions_evaluation', 'is', null);

            if (error) {
                throw error;
            }

            console.log(`Found ${reports.length} reports to potentially migrate`);

            for (const report of reports) {
                await this.migrateReport(report);
            }

            console.log(`Migration completed. ${this.migratedReports} reports migrated, ${this.failedMigrations} failed`);
            
            return {
                success: true,
                migrated: this.migratedReports,
                failed: this.failedMigrations,
                total: reports.length
            };

        } catch (error) {
            console.error('Migration failed:', error);
            return {
                success: false,
                error: error.message,
                migrated: this.migratedReports,
                failed: this.failedMigrations
            };
        }
    }

    async migrateReport(report) {
        try {
            const currentData = report.task_definitions_evaluation;
            
            if (!currentData || typeof currentData !== 'object') {
                console.log(`Report ${report.id}: No task evaluation data to migrate`);
                return;
            }

            // Check if data is already in new format
            if (this.isNewFormat(currentData)) {
                console.log(`Report ${report.id}: Already in new format`);
                return;
            }

            // Convert old format to new format
            const migratedData = this.convertToNewFormat(currentData);

            // Update the report
            const { error } = await window.PG_API
                .from('reports')
                .eq('id', report.id)
                .update({
                    task_definitions_evaluation: migratedData,
                    updated_at: new Date().toISOString()
                });

            if (error) {
                console.error(`Failed to migrate report ${report.id}:`, error);
                this.failedMigrations++;
                return;
            }

            console.log(`Report ${report.id}: Successfully migrated`);
            this.migratedReports++;

        } catch (error) {
            console.error(`Error migrating report ${report.id}:`, error);
            this.failedMigrations++;
        }
    }

    isNewFormat(data) {
        // Check if data has the new structure
        // New format should have task_1, task_2, etc. with boolean/null values
        const keys = Object.keys(data);
        
        // Check if it looks like new format (task_X keys with boolean values)
        const hasNewFormatKeys = keys.some(key => key.startsWith('task_') && key.match(/^task_\d+$/));
        
        if (hasNewFormatKeys) {
            // Additional check: values should be boolean or null
            const hasValidValues = keys.every(key => {
                const value = data[key];
                return value === true || value === false || value === null;
            });
            
            return hasValidValues;
        }
        
        return false;
    }

    convertToNewFormat(oldData) {
        const newData = {};
        
        // Handle different possible old formats
        if (this.isLegacyFormat(oldData)) {
            // Convert from legacy format
            newData = this.convertFromLegacyFormat(oldData);
        } else {
            // Try to salvage what we can from unknown format
            newData = this.convertFromUnknownFormat(oldData);
        }

        // Ensure all 43 tasks are represented
        for (let i = 1; i <= 43; i++) {
            const taskKey = `task_${i}`;
            if (!(taskKey in newData)) {
                newData[taskKey] = null; // Default to null for unset tasks
            }
        }

        return newData;
    }

    isLegacyFormat(data) {
        // Check if data has legacy format patterns
        // This might include different key naming or structure
        const keys = Object.keys(data);
        
        // Example legacy format checks
        return keys.some(key => 
            key.match(/^task\d+$/) || // task1, task2, etc.
            key.match(/^gorev_\d+$/) || // gorev_1, gorev_2, etc.
            key.includes('_evaluation') ||
            key.includes('_result')
        );
    }

    convertFromLegacyFormat(oldData) {
        const newData = {};
        
        Object.keys(oldData).forEach(key => {
            let taskNumber = null;
            let value = oldData[key];
            
            // Extract task number from various legacy formats
            if (key.match(/^task(\d+)$/)) {
                taskNumber = parseInt(key.replace('task', ''));
            } else if (key.match(/^task_(\d+)$/)) {
                taskNumber = parseInt(key.split('_')[1]);
            } else if (key.match(/^gorev_(\d+)$/)) {
                taskNumber = parseInt(key.split('_')[1]);
            } else if (key.includes('task') && key.match(/\d+/)) {
                const match = key.match(/\d+/);
                if (match) {
                    taskNumber = parseInt(match[0]);
                }
            }
            
            if (taskNumber && taskNumber >= 1 && taskNumber <= 43) {
                // Convert value to boolean or null
                if (value === true || value === 'true' || value === 1 || value === '1' || value === 'yes' || value === 'uygun') {
                    newData[`task_${taskNumber}`] = true;
                } else if (value === false || value === 'false' || value === 0 || value === '0' || value === 'no' || value === 'uygun_degil') {
                    newData[`task_${taskNumber}`] = false;
                } else {
                    newData[`task_${taskNumber}`] = null;
                }
            }
        });
        
        return newData;
    }

    convertFromUnknownFormat(oldData) {
        const newData = {};
        
        // Try to extract any meaningful data
        Object.keys(oldData).forEach(key => {
            const value = oldData[key];
            
            // Look for patterns that might indicate task numbers
            const taskNumberMatch = key.match(/\d+/);
            if (taskNumberMatch) {
                const taskNumber = parseInt(taskNumberMatch[0]);
                if (taskNumber >= 1 && taskNumber <= 43) {
                    // Convert value to boolean or null
                    if (typeof value === 'boolean') {
                        newData[`task_${taskNumber}`] = value;
                    } else if (value === 'true' || value === 1 || value === '1') {
                        newData[`task_${taskNumber}`] = true;
                    } else if (value === 'false' || value === 0 || value === '0') {
                        newData[`task_${taskNumber}`] = false;
                    } else {
                        newData[`task_${taskNumber}`] = null;
                    }
                }
            }
        });
        
        return newData;
    }

    // Utility method to validate migrated data
    validateMigratedData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }

        // Check that all task keys are in correct format
        const keys = Object.keys(data);
        return keys.every(key => {
            // Should be task_X format
            if (!key.match(/^task_\d+$/)) {
                return false;
            }
            
            // Value should be boolean or null
            const value = data[key];
            return value === true || value === false || value === null;
        });
    }

    // Method to run a dry run of migration (without actually updating data)
    async dryRunMigration() {
        try {
            console.log('Starting dry run migration...');
            
            if (!window.PG_API) {
                throw new Error('Database client not available');
            }

            const { data: reports, error } = await window.PG_API
                .from('reports')
                .select('id, task_definitions_evaluation')
                .not('task_definitions_evaluation', 'is', null);

            if (error) {
                throw error;
            }

            const results = {
                total: reports.length,
                needsMigration: 0,
                alreadyMigrated: 0,
                invalid: 0,
                preview: []
            };

            for (const report of reports) {
                const currentData = report.task_definitions_evaluation;
                
                if (!currentData || typeof currentData !== 'object') {
                    results.invalid++;
                    continue;
                }

                if (this.isNewFormat(currentData)) {
                    results.alreadyMigrated++;
                } else {
                    results.needsMigration++;
                    
                    // Add preview of what would be migrated
                    if (results.preview.length < 3) {
                        const migratedData = this.convertToNewFormat(currentData);
                        results.preview.push({
                            reportId: report.id,
                            oldData: currentData,
                            newData: migratedData
                        });
                    }
                }
            }

            return results;
        } catch (error) {
            console.error('Dry run failed:', error);
            return { error: error.message };
        }
    }
}

// Export for use
window.TaskDefinitionsMigration = TaskDefinitionsMigration;

// Helper function to run migration from console
window.runTaskDefinitionsMigration = async function(dryRun = false) {
    const migration = new TaskDefinitionsMigration();
    
    if (dryRun) {
        const results = await migration.dryRunMigration();
        console.log('Dry run results:', results);
        return results;
    } else {
        const results = await migration.migrateExistingReports();
        console.log('Migration results:', results);
        return results;
    }
};