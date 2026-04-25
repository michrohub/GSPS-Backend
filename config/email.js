// const nodemailer = require('nodemailer');
// require('dotenv').config();

// // const transporter = nodemailer.createTransport({
// //     service: 'gmail',
// //     auth: {
// //         user: process.env.EMAIL_USER,
// //         pass: process.env.EMAIL_PASS,
// //     },
// // });


// const transporter = nodemailer.createTransport({
//     host: 'smtp.gmail.com',
//     port: 465, // অথবা ৫৮৭ ব্যবহার করে দেখুন
//     secure: true, // ৪৬৫ পোর্টের জন্য true, ৫৮৭ পোর্টের জন্য false
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//     },
//     tls: {
//         // এটি ইমেইল সার্ভারের সাথে হ্যান্ডশেক করতে সাহায্য করবে
//         rejectUnauthorized: false
//     }
// });


// const sendEmail = async ({ to, subject, html }) => {
//     try {
//         const info = await transporter.sendMail({
//             from: `"GSPS Support" <${process.env.EMAIL_USER}>`,
//             to,
//             subject,
//             html,
//         });
//         console.log('Email sent: %s', info.messageId);
//         return info;
//     } catch (error) {
//         console.error('Error sending email:', error);
//         throw new Error('Failed to send email. Please check your credentials or network.');
//     }
// };

// module.exports = { sendEmail };




const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
    try {
        const response = await resend.emails.send({
            from: "GSPS Verify <verify@gsps.online>",
            to,
            subject,
            html: `
  <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:40px 0;">
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.05);">

      <!-- Header -->
      <div style="background:#2563eb; padding:20px; text-align:center;">
        <img src="https://gsps.online/logo.png" alt="GSPS Logo" style="height:50px; margin-bottom:10px;" />
        <h1 style="color:#fff; margin:0;">GSPS</h1>
      </div>

      <!-- Body -->
      <div style="padding:30px; color:#333;">
        <h2>Verify Your Email</h2>
        <p>Hello,</p>
        <p>Your verification code is:</p>

        <div style="font-size:32px; font-weight:bold; text-align:center; margin:30px 0; letter-spacing:6px;">
          ${otp}
        </div>

        <p>This OTP expires in <b>5 minutes</b>.</p>
        <p style="font-size:13px; color:#777;">If you didn't request this, ignore this email.</p>
      </div>

      <!-- Footer -->
      <div style="background:#f9fafb; padding:20px; text-align:center; font-size:12px; color:#999;">
        © 2026 GSPS. All rights reserved.
      </div>

    </div>
  </div>
`
        });

        console.log("✅ Email sent:", response.id);
        return response;
    } catch (error) {
        console.error("❌ Email sending failed:", error);
        throw new Error("Failed to send email");
    }
};

module.exports = { sendEmail };
