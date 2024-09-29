import { readdir } from "fs/promises";
import { dirname, join } from "path";
import express from "express";
import passport from "./config/passport.js";
import morgan from "morgan";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import expressOasGenerator from "@mickeymond/express-oas-generator";
import session from "express-session";
import MongoStore from "connect-mongo";
import cookieParser from "cookie-parser";
import compression from "compression";
import csrf from "csrf";
import helmet from "helmet";

dotenv.config();

//Connect to MongoDb database
mongoose
  .connect(process.env.DATABASE_URL, {
    // keepAlive: true,
  })
  .then(() => {
    console.log("Db Connection Successful");
  })
  .catch((error) =>
    console.log(`Connection Error! ${error.message}, Error Code: ${error.code}`)
  );

//App
const app = express();
const port = process.env.PORT || 8000;

expressOasGenerator.handleResponses(app, {
  alwaysServeDocs: true,
  tags: ["auth"],
  mongooseModels: mongoose.modelNames(),
});

//Middlewares
const allowedOrigins = ["http://localhost:5173", "http://example.com"];
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        // Allow non-origin requests (e.g., Postman)
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);
app.use(morgan("tiny"));
app.use(express.json({ limit: "2mb" })); //Used to parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: "2mb" })); //Parse URL-encoded bodies
app.use(cookieParser());
app.use(
  compression({
    // threshold: "1kb", // Only compress responses larger than 1kb
  })
);
app.use(
  helmet({
    //  contentSecurityPolicy: false, // Disable CSP if you handle it separately
    //    frameguard: { action: 'deny' } // Example: prevent framing of your site
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something is stored
    store: MongoStore.create({
      mongoUrl: process.env.DATABASE_URL,
    }),
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      httpOnly: true, // Ensures the cookis is sent only over HTTP(S), not client JS
      secure: process.env.NODE_ENV === "production", //requires cookie to be sent over https
    },
    rolling: true, // Reset maxAge on every response
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

//Routes Middleware
// Dynamically import and use routes
async function setupRoutes() {
  try {
    const routeFiles = await readdir("./routes");
    for (const file of routeFiles) {
      const routePath = `./routes/${file}`;
      const { default: routeModule } = await import(routePath);
      app.use("/api/v1", routeModule);
    }
  } catch (error) {
    console.error("Error loading routes:", error);
  }
}

setupRoutes();

// CSRF protection
// const csrfProtection = csrf({ cookie: true });
// app.use(csrfProtection);

// app.use("/api/v1", userRouter);

// expressOasGenerator.handleRequests();
// app.use((req, res) => res.redirect('/api-docs/'));

console.log("server setup");

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
