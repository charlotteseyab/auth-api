import Joi from "joi";

const email = Joi.string().email().lowercase().required().messages({
  "string.email": "Please provide a valid email address.",
  "any.required": "Email is required.",
});

const password = Joi.string().min(6).max(64).required().messages({
  "string.min": "Password should be at least 6 characters long.",
  "any.required": "Password is required.",
});
const name = Joi.string().trim().required().messages({
  "any.required": "Please provide your full name.",
});

const code = Joi.string()
  .pattern(/^\d{4}$/)
  .required()
  .messages({
    "string.pattern.base": "Verification code must be a 4-digit number.",
    "any.required": "Verification code is required.",
  });

// Define the Joi schema based on your user model requirements
const unverifiedUserValidationSchema = Joi.object({
  email,
  password,
  name,
});

export default unverifiedUserValidationSchema;

export const signupValidationSchema = Joi.object({
  email,
  verificationCode: code,
});

export const emailValidationSchema = Joi.object({
  email,
});

export const passwordResetValidationSchema = Joi.object({
  email,
  passwordResetCode: code,
  newPassword: password,
});
