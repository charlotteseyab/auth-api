import UnverifiedUser from "../models/unverifiedUser.js";
import User from "../models/user.js";
import unverifiedUserValidationSchema, {
  emailValidationSchema,
  passwordResetValidationSchema,
} from "../schemas/unverifiedUserValidationSchema.js";
import {
  hashPassword,
  sendPasswordResetCodetoEmail,
  sendVerificationEmail,
} from "../utils/auth.js";

// Send email verification code -------------------------------------------------------
export const sendVerificationCode = async (req, res) => {
  try {
    // Validate user input
    const { error, value } = unverifiedUserValidationSchema.validate(req.body);
    if (error) {
      console.log("Error validating signup info -->", error);
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if email is already in use
    const existingUser = await User.findOne({ email: value.email });
    if (existingUser) {
      console.log("User already exists");
      return res
        .status(409)
        .json({ error: `${value.email} is already in use!` });
    }

    // Encrypt password
    const hashedPassword = await hashPassword(value.password);

    // Generate a 4-digit verification code
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Check if the unverified email already exists
    let existingUnverifiedUser = await UnverifiedUser.findOne({
      email: value.email,
    });
    if (existingUnverifiedUser) {
      console.log("Existing unverified user found");
      // Update existing unverified user
      existingUnverifiedUser.name = value.name;
      existingUnverifiedUser.password = hashedPassword;
      existingUnverifiedUser.verificationCode = verificationCode;
      existingUnverifiedUser.verificationCodeExpiresAt =
        Date.now() + 15 * 60 * 1000;

      await existingUnverifiedUser.save();
      console.log(
        "Updated existing unverified user -->",
        existingUnverifiedUser
      );

      // Send verification email
      await sendVerificationEmail(value.name, value.email, verificationCode);

      return res.status(200).json({
        message: `Verification code sent to already existing ${existingUnverifiedUser.email}`,
        email: existingUnverifiedUser.email,
      });
    }

    // Create a new unverified user
    const newUnverifiedUser = new UnverifiedUser({
      email: value.email,
      name: value.name,
      password: hashedPassword,
      verificationCode,
    });
    await newUnverifiedUser.save();

    console.log("New unverified user created -->", newUnverifiedUser);

    // Send verification email
    await sendVerificationEmail(value.name, value.email, verificationCode);

    return res.status(200).json({
      message: `Verification code sent to ${newUnverifiedUser.email}`,
      email: newUnverifiedUser.email,
    });
  } catch (error) {
    console.error("Server error -->", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// Get the current user------------------------------------------------------
export const currentUser = async (req, res) => {
  try {
    console.log("user in session----->", req.user);
    const user = await User.findById(req.user._id)
      .select("-password -passwordResetCode -passwordResetCodeExpiresAt")
      .exec();
    console.log("DB user--->", user);
    return res.status(200).json(user);
  } catch (error) {
    console.log("Current user error--->", error);
    return res.status(400).json({ error: "Error fetching the current user" });
  }
};

// Logout User--------------------------------------------------------------
export const logout = async (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to destroy session" });
      }
      res.clearCookie("connect.sid"); // Clear the session cookie
      res.status(200).json({ message: "Logout successful" });
    });
  });
};

// Send password reset code-----------------------------------------------
export const sendPasswordResetCode = async (req, res) => {
  try {
    // 1. validate email from request body
    const { error, value } = emailValidationSchema.validate(req.body);
    if (error) {
      console.log("Error validating email -->", error);
      return res.status(400).json({ error: error.details[0].message });
    }

    // 2. check if the email is registered in the db
    const emailExists = await User.findOne({ email: value.email });
    if (!emailExists) {
      console.log(`${value.email} does not exist in the DB`);
      return res
        .status(409)
        .json({ error: `${value.email} has not been registered!` });
    }

    // 3. Generate a 4-digit password reset code
    const passwordResetCode = Math.floor(
      1000 + Math.random() * 9000
    ).toString();

    // 4. Update user's password reset code and code expiration time
    emailExists.passwordResetCode = passwordResetCode;
    emailExists.passwordResetCodeExpiresAt = Date.now() + 15 * 60 * 1000;
    await emailExists.save();

    // 5. Send password reset code to the email
    await sendPasswordResetCodetoEmail(
      emailExists.name,
      value.email,
      passwordResetCode
    );

    return res.status(200).json({
      message: `Password reset code sent to ${emailExists.email}`,
      email: emailExists.email,
    });
  } catch (error) {
    console.log("Error sending password reset code--->", error);
    return res
      .status(400)
      .json({ error: "Error sending password reset code!" });
  }
};

// Reset Password------------------------------------------------
export const resetPassword = async (req, res) => {
  // 1. validate email, code and new password
  const { error, value } = passwordResetValidationSchema.validate(req.body);
  if (error) {
    console.log("Error validating password reset input --->", error);
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    // 2. Find user with the email
    const existingUser = await User.findOne({ email: value.email }).exec();
    if (!existingUser) {
      console.log(`The email ${value.email} does not exist in the db`);
      return res
        .status(409)
        .json({ error: `'${value.email}' has not been registered!` });
    }
    // 4. compare the verification codes.
    if (existingUser.passwordResetCode !== value.passwordResetCode) {
      console.log("Invalid password reset code");
      return res.status(400).json({
        error: "Invalid password reset code",
      });
    }
    //5. Check for verification code expiry.
    if (Date.now() > existingUser.passwordResetCodeExpiresAt) {
      console.log("Expired password reset code");
      return res.status(400).json({
        error: "Expired password reset code",
      });
    }
    // 6. hashpassword
    const hashedPassword = await hashPassword(value.newPassword);
    // 7. update the user's password
    existingUser.password = await hashedPassword;
    await existingUser.save();

    console.log(`Password for ${value.email} successfully changed`);
    return res.status(200).json({
      message: `Password for ${value.email} successfully changed`,
    });
  } catch (error) {
    console.log("Error reseting password--->", error);
    return res.status(400).json({ error: "Error reseting password!" });
  }
};
