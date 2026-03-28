const nodemailer = require("nodemailer");
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    secure: false,
    auth: {
        user: process.env.MAILTRAP_USER || "",
        pass: process.env.MAILTRAP_PASS || "",
    },
});

module.exports = {
    sendMail: async (to, url) => {
        const info = await transporter.sendMail({
            from: 'admin@haha.com',
            to: to,
            subject: "RESET PASSWORD REQUEST",
            text: "click vào đây để đổi mật khẩu",
            html: "click vào <a href=" + url + ">đây</a> để đổi mật khẩu",
        });

        console.log("Message sent:", info.messageId);
    },

    /**
     * Send welcome email with temporary password
     * @param {string} email - Recipient email
     * @param {string} username - User's username
     * @param {string} password - Temporary password
     */
    sendMailWithPassword: async (email, username, password) => {
        const htmlContent = `
            <h2>Chào mừng ${username}!</h2>
            <p>Tài khoản của bạn đã được tạo thành công.</p>
            <p><strong>Thông tin đăng nhập:</strong></p>
            <ul>
                <li>Username: <strong>${username}</strong></li>
                <li>Email: <strong>${email}</strong></li>
                <li>Mật khẩu tạm thời: <strong>${password}</strong></li>
            </ul>
            <p>Vui lòng đăng nhập và thay đổi mật khẩu ngay khi có cơ hội.</p>
            <p><strong>Chú ý:</strong> Đây là mật khẩu tạm thời. Bạn nên thay đổi nó thành mật khẩu mạnh hơn sau khi đăng nhập.</p>
        `;

        const textContent = `
Chào mừng ${username}!

Tài khoản của bạn đã được tạo thành công.

Thông tin đăng nhập:
- Username: ${username}
- Email: ${email}
- Mật khẩu tạm thời: ${password}

Vui lòng đăng nhập và thay đổi mật khẩu ngay khi có cơ hội.

Chú ý: Đây là mật khẩu tạm thời. Bạn nên thay đổi nó thành mật khẩu mạnh hơn sau khi đăng nhập.
        `;

        const info = await transporter.sendMail({
            from: 'admin@haha.com',
            to: email,
            subject: "Thông tin tài khoản - Vui lòng xem",
            text: textContent,
            html: htmlContent,
        });

        return info;
    }
}