
// // Generate JWT Token
// const generateToken = (id) => {
//     return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
// };

// const PendingUser = require('../models/PendingUser');

// // @desc    Register User (Step 1: Save to PendingUser and Send OTP)
// // @route   POST /api/auth/signup
// exports.signup = async (req, res) => {
//     try {
//         const { fullName, email, phone, password, referredBy } = req.body;

//         // 1. Check if user already exists in main table
//         const userExists = await User.findOne({ email });
//         if (userExists) {
//             return res.status(400).json({ message: 'User already exists' });
//         }

//         // 2. Clear any existing pending registration for this email
//         await PendingUser.deleteMany({ email });

//         // 3. Hash Password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // 4. Generate 6-digit OTP
//         const otp = Math.floor(100000 + Math.random() * 900000).toString();
//         const hashedOtp = await bcrypt.hash(otp, 10);
//         const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

//         // 5. Handle Referral (lookup referrer ID)
//         let referrerId = null;
//         if (referredBy) {
//             const referrer = await User.findOne({ referralCode: referredBy });
//             if (referrer) {
//                 referrerId = referrer._id;
//             }
//         }

//         // 6. Send OTP via Email FIRST
//         try {
//             await sendEmail({
//                 to: email,
//                 subject: 'Verify Your Email - GSPS',
//                 html: `
//                     <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
//                         <h2 style="color: #2563eb; text-align: center;">Welcome to GSPS!</h2>
//                         <p>Thank you for signing up. Please use the following OTP to verify your email address:</p>
//                         <div style="font-size: 32px; font-weight: bold; padding: 15px; background: #f3f4f6; text-align: center; border-radius: 8px; margin: 25px 0; color: #1f2937; letter-spacing: 5px;">
//                             ${otp}
//                         </div>
//                         <p style="color: #6b7280; font-size: 14px;">This OTP will expire in <strong>5 minutes</strong>.</p>
//                         <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
//                         <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
//                         <p style="text-align: center; color: #9ca3af; font-size: 12px;">&copy; 2026 GSPS. All rights reserved.</p>
//                     </div>
//                 `
//             });
//         } catch (emailError) {
//             console.error('Email sending failed:', emailError);
//             return res.status(500).json({ message: 'Failed to send verification email. Please try again later.' });
//         }

//         // 7. Store in PendingUser only if email was sent
//         await PendingUser.create({
//             fullName,
//             email,
//             phone,
//             password: hashedPassword,
//             otp: hashedOtp,
//             otpExpires,
//             referredBy: referrerId
//         });

//         res.status(201).json({
//             message: 'OTP sent to your email. Please verify.',
//             email
//         });
//     } catch (error) {
//         console.error('Signup Error:', error);
//         res.status(500).json({ message: error.message });
//     }
// };

// // @desc    Verify OTP (Step 2: Move from PendingUser to User)
// // @route   POST /api/auth/verify-otp
// exports.verifyOTP = async (req, res) => {
//     try {
//         const { email, otp } = req.body;

//         // 1. Find the pending registration
//         const pendingUser = await PendingUser.findOne({ email });
//         if (!pendingUser) {
//             return res.status(404).json({ message: 'Registration session expired or not found. Please signup again.' });
//         }

//         // 2. Check max attempts (5)
//         if (pendingUser.attempts >= 5) {
//             await PendingUser.deleteOne({ email });
//             return res.status(400).json({ message: 'Too many failed attempts. Please signup again.' });
//         }

//         // 3. Check expiry
//         if (new Date() > pendingUser.otpExpires) {
//             await PendingUser.deleteOne({ email });
//             return res.status(400).json({ message: 'OTP has expired. Please signup again.' });
//         }

//         // 4. Check OTP match
//         const isMatch = await bcrypt.compare(otp, pendingUser.otp);
//         if (!isMatch) {
//             pendingUser.attempts += 1;
//             await pendingUser.save();
//             return res.status(400).json({ message: `Invalid OTP. ${5 - pendingUser.attempts} attempts remaining.` });
//         }

//         // 5. Success: Create the actual user
//         const newUser = await User.create({
//             fullName: pendingUser.fullName,
//             email: pendingUser.email,
//             phone: pendingUser.phone,
//             password: pendingUser.password,
//             referredBy: pendingUser.referredBy,
//             isVerified: true
//         });

//         // 6. Delete pending record
//         await PendingUser.deleteOne({ email });

//         res.status(201).json({
//             message: 'Email verified successfully. Account created.',
//             token: generateToken(newUser._id),
//             user: {
//                 id: newUser._id,
//                 fullName: newUser.fullName,
//                 email: newUser.email,
//                 role: newUser.role,
//                 kycStatus: newUser.kycStatus
//             }
//         });
//     } catch (error) {
//         console.error('Verification Error:', error);
//         res.status(500).json({ message: error.message });
//     }
// };

// // @desc    Resend OTP
// // @route   POST /api/auth/resend-otp
// exports.resendOTP = async (req, res) => {
//     try {
//         const { email } = req.body;

//         const pendingUser = await PendingUser.findOne({ email });
//         if (!pendingUser) {
//             return res.status(404).json({ message: 'Registration session not found. Please signup again.' });
//         }

//         // Cooldown check (60 seconds) is handled by route middleware, but adding a basic check here too
//         const cooldown = 60 * 1000;
//         const timeSinceCreated = new Date() - pendingUser.createdAt;
//         // Since we don't have lastOtpResendTime in PendingUser yet, we use createdAt or just let it pass

//         // Generate new OTP
//         const otp = Math.floor(100000 + Math.random() * 900000).toString();
//         const hashedOtp = await bcrypt.hash(otp, 10);

//         pendingUser.otp = hashedOtp;
//         pendingUser.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
//         await pendingUser.save();

//         // Send Email
//         await sendEmail({
//             to: email,
//             subject: 'New OTP - GSPS',
//             html: `
//                 <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
//                     <h2 style="color: #2563eb; text-align: center;">Your New OTP</h2>
//                     <p>Use the following OTP to verify your email address:</p>
//                     <div style="font-size: 32px; font-weight: bold; padding: 15px; background: #f3f4f6; text-align: center; border-radius: 8px; margin: 25px 0; color: #1f2937; letter-spacing: 5px;">
//                         ${otp}
//                     </div>
//                     <p style="color: #6b7280; font-size: 14px;">This OTP will expire in <strong>5 minutes</strong>.</p>
//                 </div>
//             `
//         });

//         res.json({ message: 'New OTP sent to your email' });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// // 

// // @desc    Login User
// // @route   POST /api/auth/login
// exports.login = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         const user = await User.findOne({ email });

//         if (user && (await bcrypt.compare(password, user.password))) {
//             if (!user.isVerified) {
//                 return res.status(401).json({ message: 'Please verify your email first', unverified: true });
//             }

//             res.json({
//                 token: generateToken(user._id),
//                 user: {
//                     id: user._id,
//                     fullName: user.fullName,
//                     email: user.email,
//                     role: user.role,
//                     kycStatus: user.kycStatus
//                 }
//             });
//         } else {
//             res.status(401).json({ message: 'Invalid email or password' });
//         }
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// // @desc    Get Current User Profile
// // @route   GET /api/auth/me
// exports.getMe = async (req, res) => {
//     try {
//         const user = await User.findById(req.user.id).select('-password');
//         res.json(user);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };




const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../config/email');
const { checkAndAwardReferralBonus } = require('./adminController');

// 🔐 Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @desc    Signup (Send OTP)
exports.signup = async (req, res) => {
    try {
        let { fullName, email, phone, password, referredBy } = req.body;

        email = email.toLowerCase().trim();

        // ✅ Validation
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        // 1️⃣ Check existing user
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // 2️⃣ Clear old pending
        await PendingUser.deleteMany({ email });

        // 3️⃣ Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4️⃣ Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

        // 5️⃣ Referral
        let referrerId = null;
        if (referredBy) {
            let searchCode = referredBy.toUpperCase().trim();
            if (!searchCode.startsWith('GSPS')) searchCode = 'GSPS' + searchCode;
            
            const referrer = await User.findOne({ referralCode: searchCode });
            if (referrer) referrerId = referrer._id;
        }

        // 6️⃣ Send Email (Resend)
        await sendEmail({
            to: email,
            subject: "Verify Your Email - GSPS",
            html: `
        <h2>Welcome to GSPS</h2>
        <p>Your OTP is:</p>
        <h1 style="letter-spacing:5px">${otp}</h1>
        <p>This OTP expires in 5 minutes.</p>
      `
        });

        // 7️⃣ Save Pending User
        await PendingUser.create({
            fullName,
            email,
            phone,
            password: hashedPassword,
            otp: hashedOtp,
            otpExpires,
            referredBy: referrerId,
            attempts: 0
        });

        res.status(201).json({
            message: "OTP sent to your email",
            email
        });

    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Verify OTP
exports.verifyOTP = async (req, res) => {
    try {
        let { email, otp } = req.body;
        email = email.toLowerCase().trim();

        const pendingUser = await PendingUser.findOne({ email });

        if (!pendingUser) {
            return res.status(404).json({ message: "Session expired. Signup again." });
        }

        // ❌ Max attempts
        if (pendingUser.attempts >= 5) {
            await PendingUser.deleteOne({ email });
            return res.status(400).json({ message: "Too many attempts" });
        }

        // ❌ Expired
        if (new Date() > pendingUser.otpExpires) {
            await PendingUser.deleteOne({ email });
            return res.status(400).json({ message: "OTP expired" });
        }

        // ❌ Wrong OTP
        const isMatch = await bcrypt.compare(otp, pendingUser.otp);
        if (!isMatch) {
            pendingUser.attempts += 1;
            await pendingUser.save();
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // ✅ Prevent duplicate
        const existing = await User.findOne({ email });
        if (existing) {
            await PendingUser.deleteOne({ email });
            return res.status(400).json({ message: "User already exists" });
        }

        // 🔥 Generate referral code
        const referralCode = 'GSPS' + Math.random().toString(36).substring(2, 8).toUpperCase();

        // ✅ Create user
        const newUser = await User.create({
            fullName: pendingUser.fullName,
            email: pendingUser.email,
            phone: pendingUser.phone,
            password: pendingUser.password,
            referredBy: pendingUser.referredBy,
            isVerified: true,
            referralCode
        });

        await PendingUser.deleteOne({ email });

        res.status(201).json({
            message: "Account created successfully",
            token: generateToken(newUser._id),
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                role: newUser.role,
                kycStatus: newUser.kycStatus,
                profileImage: newUser.profileImage,
                termsAccepted: newUser.termsAccepted,
                referredBy: newUser.referredBy,
                walletBalance: newUser.walletBalance,
                referralCount: newUser.referralCount,
                referralCode: newUser.referralCode,
                tier: newUser.tier,
                isReferralCounted: newUser.isReferralCounted
            }
        });

    } catch (error) {
        console.error("Verify Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Resend OTP
exports.resendOTP = async (req, res) => {
    try {
        let { email } = req.body;
        email = email.toLowerCase().trim();

        const pendingUser = await PendingUser.findOne({ email });

        if (!pendingUser) {
            return res.status(404).json({ message: "Signup required" });
        }

        // ⏳ Cooldown
        if (pendingUser.lastOtpSentAt && Date.now() - pendingUser.lastOtpSentAt < 60000) {
            return res.status(429).json({ message: "Wait before requesting again" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        pendingUser.otp = await bcrypt.hash(otp, 10);
        pendingUser.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
        pendingUser.lastOtpSentAt = Date.now();
        pendingUser.attempts = 0;

        await pendingUser.save();

        // ✅ Send Email (with error handling)
        try {
            await sendEmail({
                to: email,
                subject: "Your GSPS Verification Code (Expires in 5 min)",
                html: `
                <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:40px 0;">
                  <div style="max-width:600px; margin:auto; background:#fff; border-radius:10px; overflow:hidden;">
                    
                    <div style="background:#2563eb; padding:20px; text-align:center;">
                      <img src="https://gsps.online/logo.png" style="height:50px;" />
                      <h1 style="color:#fff;">GSPS</h1>
                    </div>

                    <div style="padding:30px;">
                      <h2>Verify Your Email</h2>
                      <p>Your OTP is:</p>

                      <div style="font-size:32px; text-align:center; margin:20px 0; letter-spacing:6px;">
                        ${otp}
                      </div>

                      <p>Expires in 5 minutes.</p>
                    </div>

                    <div style="text-align:center; padding:10px; font-size:12px; color:#999;">
                      © 2026 GSPS
                    </div>

                  </div>
                </div>
                `
            });
        } catch (err) {
            console.error("Email Error:", err);
            return res.status(500).json({ message: "Failed to send OTP email" });
        }

        res.json({ message: "OTP resent successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Login
exports.login = async (req, res) => {
    try {
        let { email, password } = req.body;
        email = email.toLowerCase().trim();

        const user = await User.findOne({ email });

        if (user && await bcrypt.compare(password, user.password)) {

            if (!user.isVerified) {
                return res.status(401).json({ message: "Verify email first", unverified: true });
            }

            res.json({
                token: generateToken(user._id),
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    kycStatus: user.kycStatus,
                    profileImage: user.profileImage,
                    termsAccepted: user.termsAccepted,
                    referredBy: user.referredBy,
                    walletBalance: user.walletBalance,
                    referralCount: user.referralCount,
                    referralCode: user.referralCode,
                    tier: user.tier,
                    isReferralCounted: user.isReferralCounted
                }
            });

        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }

    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Get Me
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};
// @desc    Accept Terms & Conditions
exports.acceptTerms = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Full name is required to accept terms" });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.termsAccepted = true;
        user.termsAcceptedName = name;
        await user.save();

        // Trigger referral check
        await checkAndAwardReferralBonus(user._id);

        res.json({ 
            message: "Terms accepted successfully", 
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                kycStatus: user.kycStatus,
                profileImage: user.profileImage,
                termsAccepted: user.termsAccepted,
                referredBy: user.referredBy,
                walletBalance: user.walletBalance,
                referralCount: user.referralCount,
                referralCode: user.referralCode,
                tier: user.tier,
                isReferralCounted: user.isReferralCounted
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};
