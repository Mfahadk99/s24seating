// require environment variables
require("dotenv").config();
import * as path from "path";
import express from "express";
const compression = require("compression");
const app = express();
import * as passport from "passport";
const flash = require("connect-flash");
import * as favicon from "serve-favicon";
import session from "express-session";
import createError from "http-errors";
import { logError } from "./modules/logger";
import cookieParser from "cookie-parser";
import methodOverride from "method-override";
const expressSanitizer = require("express-sanitizer");
import { Strategy as LocalStrategy } from "passport-local";
// require models
import User, { UserModel } from "./models/user.model";
import cors from "cors";
import Restaurant from "./models/restaurant.model";
import TableElement from "./models/table.model";
import Reservation from "./models/reservation.schema";

// require middlewares
import isLoggedIn from "./middlewares/auth/is-logged-in";
import checkMenu from "./middlewares/general/check-menu";
import checkTakeover from "./middlewares/clients/check-takeover";
import rememberMe from "./middlewares/auth/remember-me";

// require Routers
import profileRouter from "./routes/profile";
import authRouter from "./routes/auth";
import indexRouter from "./routes/index";
import clientsRouter from "./routes/clients";
import errorRouter from "./routes/error";
import testRouter from "./routes/test";
import accountSettingsRouter from "./routes/account-settings";
import availabilityRouter from "./routes/availability";
import landingRouter from "./routes/landing";
import restaurantRoutes from './routes/restaurantRoutes';
import tableRoutes from './routes/tableRoutes';
import floorPlanRoutes from './routes/floorPlanRoutes';
// import slotRoutes from './routes/slotRoutes';
import reservationRoutes from './routes/reservationRoutes';
import shiftsRouter from './routes/shifts';
import waitlistRoutes from './routes/waitlistRoutes';
import serverRoutes from './routes/server';
import settingsRoutes from './routes/settings';



// connect to database
import mongoDBConnection from "./config/mongodb";
import { handleError, handleResponse } from "./utils/responseHandler";
// import { getAllRestaurants } from "controllers/restaurantController";
// TODO: remove (this exists only on local for dev purposes) import { fixDB } from './tmp/work';
mongoDBConnection();

// compress all responses
app.use(compression());
app.use(cors());

app.use(favicon(path.join(__dirname, "public", "favicon.ico")));

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// declare static files
app.use("/public", express.static(path.join(__dirname, "public")));
// Serve static MP3s from /audio
app.use("/audio", express.static(path.join(__dirname, "public", "audio")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
// Make sure static files are accessible from all routes
app.use("*/public", express.static(path.join(__dirname, "public")));

// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));

app.use(express.json({ limit: "50mb" }));

app.use(
  express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }),
);

// var bodyParser = require('body-parser');
// app.use(bodyParser.json({ limit: '50mb' }));
// app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
app.use(expressSanitizer());
app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(flash());


/*--------------- Configure passport ------------------*/

// set parameters for express-session
app.use(
  session({
    secret: "rerefdsf12334%232FasdRT",
    resave: true,
    rolling: true,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 }, // stay logged in for 4 hours
  }),
);

//initialize passport and use session
app.use(passport.initialize());
app.use(passport.session());

// decalre the authentication method
passport.use(
  new LocalStrategy({ usernameField: "email" }, (<any>User).authenticate()),
);

// serialize and deserialize the user to use session
passport.serializeUser((<any>User).serializeUser());
passport.deserializeUser(async (email, done) => {
  try {
    const user = await User.findOne({ email });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});


/*------------ Remember me----------*/
app.use(rememberMe);

/*---- pass common variables to all routes and middlewares (& views) ----*/
// order is important for checkTakeover and checkMenu. checkTakeover should come first!
app.use(checkTakeover);
app.use(checkMenu);



app.use((req: any, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use('/restaurants', restaurantRoutes);
app.use('/reservation', reservationRoutes);
app.use('/floorplans', floorPlanRoutes);
//public api routes
app.use('/reservation', reservationRoutes as any);
// app.use('/time-slots', timeSlotRoutes as any);
app.use('/waitlist', waitlistRoutes as any);
app.use('/server', serverRoutes as any);
app.use('/settings', settingsRoutes as any);
// app.use('/slots', slotRoutes);
app.use('/tables', tableRoutes);

app.use("/", landingRouter);
app.use("/", authRouter);
app.use("/error", errorRouter);
app.use("/test", testRouter);
app.use("/shifts", shiftsRouter);

// Public API routes














/* -------- All routes below 'isLoggedIn' will require login! -------------*/
app.use(isLoggedIn);


app.use("/", indexRouter);
app.use("/profile", profileRouter);
app.use("/clients", clientsRouter);
app.use("/account-settings", accountSettingsRouter);
app.use("/availability", availabilityRouter);


// catch 404 and forward to error handlers
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
// app.use((err, req, res, next) => {
//   if (!res.headersSent) {
//     res.status(500).json({ error: err.message });
//   } else {
//     next(err);
//   }
// });

app.use(async (err, req, res, next) => {
  const errorToServer = (err && err.server) || err;
  const errorToClient = (err && err.client) || "Something went wrong!";
  const statusCode = (err && err.statusCode) || 500;
  let redirectTo = err && err.redirectTo;
  // const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

  console.error("\x1b[41m\x1b[1m\n\n\nError!\x1b[0m");
  console.error("\x1b[38m\x1b[1m\nPath: \x1b[0m", req.originalUrl);
  console.error("\x1b[38m\x1b[1mStatus Code: \x1b[0m", statusCode);
  console.error("\x1b[38m\x1b[1mErro Stack: \x1b[0m", errorToServer);
  redirectTo = statusCode == 404 ? "/error/404" : "/error";

  // log error
  await logError(
    req,
    Object.keys(errorToServer).length
      ? JSON.stringify(errorToServer)
      : err.message,
    statusCode,
  );
  if (redirectTo) {
    return res.status(statusCode).redirect(redirectTo);
  }
  res.status(statusCode).json({ error: errorToClient });
});

export default app;
