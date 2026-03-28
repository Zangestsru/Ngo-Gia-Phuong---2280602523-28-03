#!/usr/bin/env node

/**
 * CLI Script - Create Default Roles
 * Usage: node scripts/createRoles.js
 */

const mongoose = require('mongoose');
const roleModel = require('../schemas/roles');

async function main() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/NNPTUD-C4');
        console.log('✅ Connected to MongoDB');

        // Check if 'user' role exists
        const userRole = await roleModel.findOne({ name: 'user' });
        if (userRole) {
            console.log('✅ Role "user" already exists');
            process.exit(0);
        }

        // Create 'user' role
        console.log('🔄 Creating "user" role...');
        const newRole = new roleModel({
            name: 'user',
            description: 'Standard user role',
            isDeleted: false
        });
        
        await newRole.save();
        console.log('✅ Role "user" created successfully');
        console.log(`   ID: ${newRole._id}`);
        
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);

    } finally {
        await mongoose.disconnect();
    }
}

main();
