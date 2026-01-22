import dotenv from "dotenv";
import { OTP } from "../schemas/otp.schema.js";
import nodemailer from "nodemailer";
import UserSchema from "../schemas/User.schema.js";
import bcrypt from "bcryptjs";

dotenv.config();

/* ================================
   SEND OTP
================================ */
export const createOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await UserSchema.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // delete old OTPs
    await OTP.deleteMany({ email });

    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.create({
      email,
      otp: generatedOTP,
      createdAt: new Date(),
      is_expired: false
    });

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.mail_id,
        pass: process.env.mail_app_password
      }
    });

    await transporter.sendMail({
      from: `"SMF App" <${process.env.mail_id}>`,
      to: email,
      subject: "Your OTP Code",
      html: `<h2>Your OTP is: <b>${generatedOTP}</b></h2>
             <p>This OTP is valid for 5 minutes.</p>`
    });

    return res.status(200).json({ message: "OTP sent successfully" });

  } catch (error) {
    console.error("Create OTP Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ================================
   CHANGE PASSWORD USING OTP
================================ */
export const changePasswordWithOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const otpEntry = await OTP.findOne({ email, otp }).sort({ createdAt: -1 });

    if (!otpEntry || otpEntry.is_expired) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // OTP expiry check (5 minutes)
    const otpAge = Date.now() - new Date(otpEntry.createdAt).getTime();
    if (otpAge > 5 * 60 * 1000) {
      otpEntry.is_expired = true;
      await otpEntry.save();
      return res.status(400).json({ message: "OTP has expired" });
    }

    const user = await UserSchema.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // invalidate OTPs
    await OTP.deleteMany({ email });

    return res.status(200).json({ message: "Password changed successfully" });

  } catch (error) {
    console.error("Change Password OTP Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
