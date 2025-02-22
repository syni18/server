import cors from "cors";
import morgan from "morgan";
import helmet from 'helmet';
import express from "express";
import * as dotenv from 'dotenv';
import session from "express-session";
import router from "./router/route.js";
import cookieParser from "cookie-parser";
import connect from "./database/connection.js";
dotenv.config();

import './components/google-strategy.js';
import './utils/passport-jwt-strategy.js';


const app = express();

// ** middleware **

app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com",
      ],
    },
  })
);
app.use(express.json({ limit: "50mb" })); // Increase the JSON payload limit
app.use(cookieParser());    // Use cookie-parser middleware
app.use(morgan("tiny"));
app.use(cors({
    origin: process.env.FRONTEND_BASE_URL,
    credentials: true }));

// app.disable('x-powered-by');   //prevent exposing backend details
app.use(session({
    secret: process.env.SESSION_KEY, // Replace with a secure key
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Only secure in production
      httpOnly: true, // Prevent access to cookies via JavaScript
      sameSite: "strict", // Prevent CSRF attacks
    },
  })
);

//  ** HTTP get Request **
app.get("/", (req, res) => {
  res.status(201).json("backend server is up!!");
});

//API Default routes base
app.use("/v1/api", router);

//  ** start server only when the valid db connection **
connect().then(() => {
  try {
    //  ** start server **
    app.listen(process.env.PORT, () => {
      console.log(`Server connected to http://localhost:${process.env.PORT}`);
    });
  } catch (error) {
    console.log(`Couldn't connect to the server`);
  }
}).catch(error => {
    console.log(`Invalid database Connection...`);
})
