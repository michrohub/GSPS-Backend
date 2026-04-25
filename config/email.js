const nodemailer = require('nodemailer');
require('dotenv').config();

// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//     },
// });


const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // অথবা ৫৮৭ ব্যবহার করে দেখুন
    secure: true, // ৪৬৫ পোর্টের জন্য true, ৫৮৭ পোর্টের জন্য false
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        // এটি ইমেইল সার্ভারের সাথে হ্যান্ডশেক করতে সাহায্য করবে
        rejectUnauthorized: false
    }
});


const sendEmail = async ({ to, subject, html }) => {
    try {
        const info = await transporter.sendMail({
            from: `"GSPS Support" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log('Email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email. Please check your credentials or network.');
    }
};

module.exports = { sendEmail };
