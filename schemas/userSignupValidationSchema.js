import Joi from "joi";

// Define the Joi schema based on your user model requirements
const userSignupValidationSchema = Joi.object({
  email: Joi.string().email().lowercase().required().messages({
    "string.email": "Please provide a valid email address.",
    "any.required": "Email is required.",
  }),
  password: Joi.string().min(6).max(64).required().messages({
    "string.min": "Password should be at least 6 characters long.",
    "any.required": "Password is required.",
  }),
  name: Joi.string().trim().required().messages({
    "any.required": "Please provide your full name.",
  }),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{7,15}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid phone number.",
      "any.required": "Phone number is required.",
    }),
  countryCode: Joi.string()
    .pattern(/^[0-9]{1,5}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid country code.",
      "any.required": "Country code is required.",
    }),
});

export default userSignupValidationSchema;
