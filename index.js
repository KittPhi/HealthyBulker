require("dotenv").config();
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var session = require("express-session");
const flash = require("connect-flash");
const bcrypt = require("bcryptjs");
const connectDB = require("./server/config/db");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./server/models/User");
var routes = require("./server/routes/index");

connectDB();
var app = express();

app.set("views", path.join(__dirname, "server/views/pages"));
app.set("view engine", "ejs");
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "SECRET_KEY",
    resave: true,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);

// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());
// Configure Passport local strategy for authentication
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          return done(null, false, { message: "Incorrect email" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: "Incorrect password" });
        }
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

// Connect flash for displaying messages
app.use(flash());

// Global variables for flash messages
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

// Routes
app.use("/", routes);

const port = process.env.PORT || 5050;
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
