import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.js";
import { hashPassword, comparePassword } from "../utils/auth.js";
import dotenv from "dotenv";
import userSignupValidationSchema from "../schemas/userSignupValidationSchema.js";
import { signupValidationSchema } from "../schemas/unverifiedUserValidationSchema.js";
import UnverifiedUser from "../models/unverifiedUser.js";

// dotenv.config();
passport.use(
  "local-signup",
  new LocalStrategy(
    {
      usernameField: "email", // Field name for email in request body
      passwordField: "verificationCode",
      // passwordField: "password", // Field name for password in request body
      passReqToCallback: true, // Allows us to pass req to the callback
    },
    async (req, email, password, done) => {
      // 1. Validate email and verification code
      const { error, value } = signupValidationSchema.validate(req.body);
      if (error) {
        console.log("Error in verification --->", error);
        return done(null, false, { message: error.details[0].message });
      }

      try {
        // 2. Check if there is already a verified user with the email.
        const existingUser = await User.findOne({ email: value.email });
        if (existingUser) {
          console.log("The email has already been taken");
          return done(null, false, { message: "Email is already in use." });
        }
        // 3. Search for unverified user in the db by their email
        const unverifiedUser = await UnverifiedUser.findOne({
          email: value.email,
        });
        if (!unverifiedUser) {
          console.log(
            `Cannot find unverified user by the email: ${value.email}`
          );
          return done(null, false, {
            message:
              "Please provide the email you started the signup process with",
          });
        }
        console.log("UvU---->", unverifiedUser);
        // 4. compare the verification codes.
        if (unverifiedUser.verificationCode !== value.verificationCode) {
          console.log("Invalid verification code");
          return done(null, false, {
            message: "Invalid verification code",
          });
        }
        //5. Check for verification code expiry.
        if (Date.now() > unverifiedUser.verificationCodeExpiresAt) {
          console.log("Expired verification code");
          return done(null, false, {
            message: "Expired verification code",
          });
        }
        // 6.  Create a new user
        const newUser = new User({
          email: unverifiedUser.email,
          name: unverifiedUser.name,
          password: unverifiedUser.password,
          email_verified: true,
        });
        await newUser.save();

        // 7. Delete unverified user from db
        await UnverifiedUser.deleteOne({ email: unverifiedUser.email });

        console.log("User successfully signed up--->", newUser);
        return done(null, newUser);
      } catch (error) {
        console.log("Error saving user:", error);
        return done(error);
      }
    }
  )
);

// Configure the LocalStrategy for login
passport.use(
  "local-login",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, email, password, done) => {
      try {
        const user = await User.findOne({ email });
        if (!user) return done(null, false, { message: "No user found." });

        if (user.googleId && !user.password)
          return done(null, false, {
            message: "This email has been used for Google Signin.",
          });

        // Check password
        const match = await comparePassword(password, user.password);
        if (!match) return done(null, false, { message: "Invalid password." });

        console.log("logged in user--->", user);
        return done(null, user);
      } catch (error) {
        console.log("error here--->", error);
        return done(error);
      }
    }
  )
);

// Strategy for Google login
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:8000/api/v1/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("user profile---->", profile);
        const user = await User.findOne({ googleId: profile.id });
        const userEmail = await User.findOne({ email: profile._json.email });

        if (user) {
          console.log("user found---->", user);
          return done(null, user);
        }

        if (userEmail) {
          console.log("email user found--->", userEmail);
          userEmail.googleId = profile.id;
          userEmail.picture = profile._json.picture;
          userEmail.email_verified = profile._json.email_verified;
          const updatedUser = await User.findOneAndUpdate(
            { email: userEmail.email },
            { ...userEmail },
            { new: true } // Ensure the updated user is returned
          );
          return done(null, updatedUser);
        }

        if (!user && !userEmail) {
          // Create a new user with the Google profile data
          const newUser = new User({
            googleId: profile.id,
            email: profile._json.email,
            name: profile.displayName,
            picture: profile._json.picture,
            email_verified: profile._json.email_verified,
          });

          await newUser.save();
          console.log("New user--->", newUser);
          return done(null, newUser);
        }
      } catch (error) {
        console.log("error her--->", error);
        return done(error);
      }
    }
  )
);

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  console.log("serialized user===>", user);
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    console.log("deserialized user ===>", user);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
