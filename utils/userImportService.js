/**
 * UserImportService - Handle bulk user import from Excel
 * Responsibilities:
 * - Read Excel file
 * - Validate user data
 * - Encrypt passwords
 * - Save users to database
 * - Send email notifications
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const userModel = require('../schemas/users');
const roleModel = require('../schemas/roles');
const { generateStrongPassword } = require('./passwordGenerator');
const { sendMailWithPassword } = require('./mailHandler');

class UserImportService {
    /**
     * Import users from Excel file
     * @param {string} filePath - Path to Excel file
     * @param {Object} options - Import options
     * @returns {Object} Import result with success/failure counts
     */
    async importUsersFromExcel(filePath, options = {}) {
        const result = {
            success: 0,
            failed: 0,
            errors: [],
            createdUsers: []
        };

        // Delay between emails (in milliseconds) - default 1 second
        const emailDelay = options.emailDelay || 1000;

        try {
            // Validate file exists
            if (!this._fileExists(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            // Get user role
            const userRole = await this._getUserRole();
            if (!userRole) {
                throw new Error('User role not found in database');
            }

            // Read Excel file
            const users = await this._readExcelFile(filePath);

            // Process each user
            for (let i = 0; i < users.length; i++) {
                try {
                    const userData = users[i];
                    
                    // Validate required fields
                    this._validateUserData(userData);

                    // Generate password
                    const password = generateStrongPassword(16);
                    const hashedPassword = await bcrypt.hash(password, 10);

                    // Create user document
                    const newUser = new userModel({
                        username: userData.username.trim(),
                        email: userData.email.trim().toLowerCase(),
                        password: hashedPassword,
                        fullName: userData.fullName || '',
                        role: userRole._id,
                        status: false,
                        avatarUrl: 'https://i.sstatic.net/l60Hf.png'
                    });

                    // Save to database
                    await newUser.save();

                    // Send email with password (with delay)
                    await this._sendWelcomeEmail(
                        newUser.email,
                        newUser.username,
                        password
                    );

                    // Add delay before next email to avoid rate limiting
                    if (i < users.length - 1) {
                        await this._delay(emailDelay);
                    }

                    result.createdUsers.push({
                        username: newUser.username,
                        email: newUser.email,
                        _id: newUser._id
                    });
                    result.success++;

                } catch (error) {
                    result.failed++;
                    result.errors.push({
                        row: i + 2, // Excel rows are 1-indexed, plus header
                        message: error.message
                    });
                }
            }

            return result;

        } catch (error) {
            throw new Error(`Import failed: ${error.message}`);
        }
    }

    /**
     * Read and parse Excel file
     * @private
     */
    async _readExcelFile(filePath) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        
        const worksheet = workbook.getWorksheet(1);
        const users = [];

        // Skip header row (row 1)
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            
            const username = row.getCell(1).value;
            const email = row.getCell(2).value;
            const fullName = row.getCell(3).value;

            if (username || email) {
                users.push({
                    username,
                    email,
                    fullName
                });
            }
        });

        return users;
    }

    /**
     * Validate user data
     * @private
     */
    _validateUserData(userData) {
        const { username, email } = userData;

        if (!username || typeof username !== 'string') {
            throw new Error('Username is required and must be a string');
        }

        if (!email || !this._isValidEmail(email)) {
            throw new Error('Valid email is required');
        }

        // Allow alphanumeric and underscore
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            throw new Error('Username can only contain letters, numbers, and underscores');
        }
    }

    /**
     * Validate email format
     * @private
     */
    _isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    /**
     * Get user role from database
     * @private
     */
    async _getUserRole() {
        return await roleModel.findOne({ name: 'user', isDeleted: false });
    }

    /**
     * Check if file exists
     * @private
     */
    _fileExists(filePath) {
        return fs.existsSync(filePath);
    }

    /**
     * Send welcome email with temporary password
     * @private
     */
    async _sendWelcomeEmail(email, username, password) {
        try {
            await sendMailWithPassword(email, username, password);
        } catch (error) {
            throw new Error(`Failed to send email to ${email}: ${error.message}`);
        }
    }

    /**
     * Helper method to delay execution
     * @private
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new UserImportService();
