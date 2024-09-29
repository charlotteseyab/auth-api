import { Schema, model } from "mongoose";
import { toJSON } from "@reis/mongoose-to-json";

const userSchema = new Schema(
  {
    // User identification
    googleId: {
      type: String,
      index: true, // Indexing for faster lookups
    },
    email: {
      type: String,
      trim: true,
      unique: true, // Ensures unique emails
      required: true, // Email is required
      lowercase: true, // Converts email to lowercase
      index: true, // Indexing for faster lookups
    },
    email_verified: {
      type: Boolean,
      default: false,
    },

    // User authentication
    password: {
      type: String,
      minlength: 6, // Minimum password length
      maxlength: 64, // Maximum password length
      // required: true, // Password is required
    },

    // User profile information
    name: {
      type: String,
      trim: true,
      required: true, // Name is required
    },
    address: String,
    picture: {
      type: String,
      default: "/avatar.png", // Default profile picture URL
    },

    phoneNumber: {
      type: String,
      // required: true, // Phone number is required
      trim: true,
      validate: {
        validator: function (value) {
          return /^[0-9]{7,15}$/.test(value); // Valid phone number with 7-15 digits
        },
        message: "Invalid phone number",
      },
    },
    countryCode: {
      type: String,
      // required: true, // Country code is required
      trim: true,
      validate: {
        validator: function (value) {
          return /^[0-9]{1,5}$/.test(value); // Valid country code with 1-5 digits
        },
        message: "Invalid country code",
      },
    },

    // User roles (if needed)
    roles: {
      type: [String],
      default: ["client"], // Default role for new users
      enum: ["client", "admin"], // Restrict roles to 'client' and 'admin'
    },
    passwordResetCode: {
      type: String,
      default: "",
    },
    passwordResetCodeExpiresAt: {
      type: Date,
      default: function () {
        return Date.now() + 5 * 60 * 1000; // 5 minutes from the current time
      },
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt timestamps
  }
);
userSchema.plugin(toJSON);
export default model("User", userSchema);
