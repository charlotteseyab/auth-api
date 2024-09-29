import { Schema, model } from "mongoose";
import { toJSON } from "@reis/mongoose-to-json";

const unverifiedUserSchema = new Schema(
  {
    email: {
      type: String,
      trim: true,
      unique: true, // Ensures unique emails
      required: true, // Email is required
      lowercase: true, // Converts email to lowercase
      index: true, // Indexing for faster lookups
    },
    password: {
      type: String,
      minlength: 6, // Minimum password length
      maxlength: 64, // Maximum password length
      // required: true, // Password is required
    },
    name: {
      type: String,
      trim: true,
      required: true, // Name is required
    },

    verificationCode: {
      type: String,
      default: "",
    },
    verificationCodeExpiresAt: {
      type: Date,
      default: function () {
        return Date.now() + 15 * 60 * 1000; // 15 minutes from the current time
      },
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt timestamps
  }
);
unverifiedUserSchema.plugin(toJSON);
export default model("UnverifiedUser", unverifiedUserSchema);
