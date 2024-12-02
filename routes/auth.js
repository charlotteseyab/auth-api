import express from "express";
import passport from "../config/passport.js";
import { checkAuthentication } from "../middlewares/auth.js";
import {
  currentUser,
  logout,
  resetPassword,
  sendPasswordResetCode,
  sendVerificationCode,
} from "../controllers/auth.js";
const authRouter = express.Router();

// //Controllers
// const {
//   signUp,
//   login,
//   logout,
//   currentUser,
//   sendPasswordResetCode,
//   resetPassword,
// } = require("../controllers/auth");

//-------------Send Email Verification Code ---------
authRouter.post("/api/v1/verification-code", sendVerificationCode);

// --------------Sign up-----------------
authRouter.post("/api/v1/signup", (req, res, next) => {
  passport.authenticate("local-signup", (err, user, info) => {
    if (err) {
      // Handle any errors that occurred during authentication
      return res.status(500).json({ error: "Internal server error" });
    }

    if (!user) {
      // Handle the case where sign-up failed
      return res.status(400).json({ error: info.message });
    }

    // Handle the case where sign-up was successful
    req.login(user, function (err) {
      if (err) {
        return next(err);
      }
      const { password, PasswordResetCode, passwordResetCodeExpiresAt, ...rest } = user._doc
      return res.status(200).json({ ...rest });
    });
  })(req, res, next);
});

// -----------------log In -----------------
authRouter.post("/api/v1/login", (req, res, next) => {
  passport.authenticate("local-login", (err, user, info) => {
    if (err) {
      // Handle any errors that occurred during authentication
      return res.status(500).json({ error: "Internal server error" });
    }

    if (!user) {
      // Handle the case where login failed
      return res.status(400).json({ error: info.message });
    }

    // Handle the case where login was successful
    console.log("user authenticated----->", user);
    req.login(user, function (err) {
      if (err) {
        return next(err);
      }
      return res.status(200).json(user);
    });
  })(req, res, next);
});

authRouter.get(
  "/api/v1/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Handle the Google OAuth2 callback after successful authentication
authRouter.get("/api/v1/auth/google/callback", (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (err) {
      // Handle any errors that occurred during authentication
      return res.status(500).json({ error: "Internal server error" });
    }
    if (!user) {
      // Handle the case where login failed
      return res.status(400).json({ error: info.message });
    }
    // Handle the case where login was successful
    console.log("user authenticated----->", user);
    req.login(user, function (err) {
      if (err) {
        return next(err);
      }
      return res.status(200)
        // .json(user)
        .redirect(process.env.NODE_ENV === "production" ? "https://gorilla-auth.vercel.app/dashboard/client" : "http://localhost:5173/dashboard/client");
    });
  })(req, res, next);
});

// Logout User
authRouter.post("/api/v1/logout", logout);

authRouter.get("/api/v1/current-user", checkAuthentication, currentUser);

authRouter.post("/api/v1/password-forgot", sendPasswordResetCode);
authRouter.post("/api/v1/password-reset", resetPassword);

export default authRouter;
