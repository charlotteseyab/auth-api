import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(12, (err, salt) => {
      if (err) {
        reject(err);
      }
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) {
          reject(err);
        }
        resolve(hash);
      });
    });
  });
};

const comparePassword = (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

// // Set up Nodemailer transporter
// const transporter = nodemailer.createTransport({
//   service: "gmail", // e.g., 'gmail', 'yahoo', etc.
//   auth: {
//     user: process.env.EMAIL_USERNAME,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });

// Nodemailer transporter v2
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Send verification email
const sendVerificationEmail = async (name, toEmail, verificationCode) => {
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: toEmail,
    subject: "Your Verification Code",
    // text: `Your verification code is ${verificationCode}`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #dddddd; border-radius: 10px;">
      <h2 style="color: #333333; text-align: center;">Gorilla Systems Email Verification!</h2>
      <p style="color: #555555; font-size: 16px;">
        Hi <strong>${name}</strong>,
      </p>
      <p style="color: #555555; font-size: 16px;">
        Thank you for signing up to Gorilla Systems. To complete your registration, please use the following verification code:
      </p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; color: #4CAF50; font-weight: bold; background: #f2f2f2; padding: 10px 20px; border-radius: 5px;">
          ${verificationCode}
        </span>
      </div>
      <p style="color: #555555; font-size: 16px;">
        If you didn't request this, please ignore this email.
      </p>
      <p style="color: #555555; font-size: 16px;">
        Best regards,<br>
        The Gorilla Team
      </p>
    </div>
  `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification code sent to ${toEmail}`);
  } catch (error) {
    console.log("Error sending email --->", error);
    throw new Error("Failed to send verification email");
  }
};

// Send password reset code
const sendPasswordResetCodetoEmail = async (
  name,
  toEmail,
  passwordResetCode
) => {
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: toEmail,
    subject: "Your Password Reset Code",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #dddddd; border-radius: 10px;">
      <h2 style="color: #333333; text-align: center;">Gorilla Systems Password Reset!</h2>
      <p style="color: #555555; font-size: 16px;">
        Hi <strong>${name}</strong>,
      </p>
      <p style="color: #555555; font-size: 16px;">
        Please use the code below to reset your password
      </p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; color: #4CAF50; font-weight: bold; background: #f2f2f2; padding: 10px 20px; border-radius: 5px;">
          ${passwordResetCode}
        </span>
      </div>
      <p style="color: #555555; font-size: 16px;">
        If you didn't request this, please ignore this email.
      </p>
      <p style="color: #555555; font-size: 16px;">
        Best regards,<br>
        The Gorilla Team
      </p>
    </div>
  `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset code sent to ${toEmail}`);
  } catch (error) {
    console.log("Error sending password reset code --->", error);
    throw new Error("Failed to send password reset code");
  }
};

// Export the functions using CommonJS syntax
export {
  hashPassword,
  comparePassword,
  sendVerificationEmail,
  sendPasswordResetCodetoEmail,
};
