#!/usr/bin/env node

/**
 * CLI Script - Import Users from Excel
 * Usage: node scripts/importUsers.js <filePath>
 * Example: node scripts/importUsers.js user.xlsx
 */

const path = require('path');
const mongoose = require('mongoose');
const userImportService = require('../utils/userImportService');

const args = process.argv.slice(2);

// Main function
async function main() {
    try {
        // Get file path from command arguments
        if (args.length === 0) {
            console.error('Error: Please provide file path');
            console.log('Usage: node scripts/importUsers.js <filePath>');
            console.log('Example: node scripts/importUsers.js user.xlsx');
            process.exit(1);
        }

        const filePath = args[0];
        const absolutePath = path.join(process.cwd(), filePath);

        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/NNPTUD-C4');
        console.log('Connected to MongoDB');

        // Run import
        console.log(`🔄 Importing users from ${filePath}...`);
        const result = await userImportService.importUsersFromExcel(absolutePath);

        // Display results
        console.log('\nImport Results:');
        console.log(`Success: ${result.success}`);
        console.log(`Failed: ${result.failed}`);

        if (result.createdUsers.length > 0) {
            console.log('\n📝 Created Users:');
            result.createdUsers.forEach((user, index) => {
                console.log(`${index + 1}. ${user.username} (${user.email})`);
            });
        }

        if (result.errors.length > 0) {
            console.log('\nErrors:');
            result.errors.forEach((error) => {
                console.log(`Row ${error.row}: ${error.message}`);
            });
        }

        console.log('\nImport completed!');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);

    } finally {
        // Disconnect from MongoDB
        await mongoose.disconnect();
    }
}

// Run main function
main();
