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
const router = express.Router();

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
router.post("/verification-code", sendVerificationCode);

// --------------Sign up-----------------
router.post("/signup", (req, res, next) => {
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
      return res.status(200).json(user);
    });
  })(req, res, next);
});

// -----------------log In -----------------
router.post("/login", (req, res, next) => {
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

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Handle the Google OAuth2 callback after successful authentication
router.get("/auth/google/callback", (req, res, next) => {
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
      return res.status(200).json(user);
    });
  })(req, res, next);
});

// Logout User
router.post("/logout", logout);

router.post("/current-user", checkAuthentication, currentUser);

router.post("/password-forgot", sendPasswordResetCode);
router.post("/password-reset", resetPassword);

export default router;
