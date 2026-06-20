import crypto from "crypto";

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000;

export const generateOtp = () =>
  crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");

export const getOtpExpiry = () => new Date(Date.now() + OTP_TTL_MS);

export const isOtpExpired = (otpExpiry) =>
  !otpExpiry || new Date(otpExpiry).getTime() < Date.now();

export const buildOtpEmailHtml = (name, otp) => `
  <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333; max-width:480px;">
    <h2 style="color:#4F46E5;">Verify your DoseTra email</h2>
    <p>Hello ${name || "there"},</p>
    <p>Use this one-time code to verify your email address:</p>
    <p style="font-size:28px; font-weight:bold; letter-spacing:6px; color:#111827;">${otp}</p>
    <p>This code expires in 10 minutes. You only need to verify once.</p>
    <hr />
    <p style="font-size:0.85rem; color:#888;">If you did not create a DoseTra account, you can ignore this email.</p>
  </div>
`;
