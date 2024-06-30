var express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const User = require("../models/User.js");
const UserStats = require("../models/UserStats.js");
var router = express.Router();

// Middleware for checking authentication
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error_msg", "Please log in to view this resource");
  console.log("!isAuthenticated, Please log in to view this resource");
  res.redirect("/login");
};

// Home route (accessible to everyone)
router.get("/", (req, res) => {
  res.render("index", { title: "Healthy Bulker", user: req.user });
});

async function formatDate(date) {
  const year = await date.getFullYear();
  const month = await date.toLocaleString("default", { month: "long" });
  const day = await date.getDate();
  const dayOfWeek = await date.toLocaleString("default", { weekday: "long" }); // Get the day of the week
  let formattedDate = `${year} ${month} ${day}, ${dayOfWeek}`; // Including the day at the end
  return { formattedDate, date };
}

async function addFourWeeks(date) {
  const currentDate = new Date();
  const futureDate = new Date(
    currentDate.getTime() + 4 * 7 * 24 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000
  ); // Subtracting one day's worth of milliseconds
  futureDate.setDate(futureDate.getDate() - 1); // Subtracting one day

  const newDate = new Date(date.getTime());
  newDate.setDate(newDate.getDate() + 4 * 7 - 1); // Adjusting to be one day less

  const year = newDate.getFullYear();
  const month = newDate.toLocaleString("default", { month: "long" });
  const day = newDate.getDate();
  const dayOfWeek = newDate.toLocaleString("default", { weekday: "long" }); // Get the day of the week
  const formattedDate = `${year} ${month} ${day}, ${dayOfWeek}`; // Including the day at the end

  return { formattedDate, futureDate };
}

// Register from Login Page
router.get("/register", function (req, res, next) {
  res.render("register", { title: "Add Users" });
});

// Handle Registration
router.post("/register", async function (req, res, next) {
  try {
    const { name, email, phone, password } = req.body;

    let createdDate = await formatDate(new Date());
    let expiredDate = await addFourWeeks(new Date());

    const userObj = {
      name,
      email,
      phone,
      password,
      created: createdDate.formattedDate,
      createdDate: createdDate.date,
      expires: expiredDate.formattedDate,
      expiresDate: expiredDate.futureDate,
    };

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash("error_msg", "Email already registered");
      return res.redirect("/register");
    } else {
      const newUser = await User.create(userObj);
      console.log("New User created:", newUser);
      req.flash("success_msg", "Registration successful");
      res.redirect("/login");
    }
  } catch (err) {
    req.flash("error_msg", "Error creating user!");
    return res.redirect("/register");
  }
});

// Login routes
router.get("/login", (req, res) => {
  res.render("login", { title: "Login Page" });
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

// Logout route
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success_msg", "Logged out successfully");
  res.redirect("/login");
});

// Dashboard after successful Login
router.get("/dashboard", isAuthenticated, async (req, res) => {
  try {
    console.log("/dashboard req", req);
    const userStats = await UserStats.find({ user: req.user.id });
    res.render("dashboard", { user: req.user, userStats });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to load dashboard");
    res.redirect("/login");
  }
});

router.get("/features", function (req, res, next) {
  res.render("features", { title: "Feature Name", user: req.user });
});

router.get("/pricing", function (req, res, next) {
  res.render("pricing", { title: "Pricing" });
});

router.get("/users", function (req, res, next) {
  res.render("users", { title: "Users" });
});

// Handle stats submission
router.post("/stats", isAuthenticated, async (req, res) => {
  try {
    const { weight, age, height, bodyFat, muscleFat } = req.body;
    const userId = req.user.id; // Passport: Assuming user is logged in
    const created = Date.now();
    // Check if stats for the same day exist, update if yes, create new if no
    let existingStats = await UserStats.findOne({
      user: userId,
      created,
    });

    if (existingStats) {
      existingStats.weight = weight;
      existingStats.age = age;
      existingStats.height = height;
      existingStats.bodyFat = bodyFat;
      existingStats.muscleFat = muscleFat;
      await existingStats.save();
    } else {
      const newStats = new UserStats({
        user: userId,
        weight,
        age,
        height,
        bodyFat,
        muscleFat,
        created,
      });
      await newStats.save();
    }

    req.flash("success_msg", "Stats updated successfully");
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to update stats");
    res.redirect("/dashboard");
  }
});

router.get("/add_affiliate", function (req, res, next) {
  res.render("add_affiliate", { title: "Add Affiliate" });
});

router.get("/add_affiliate_users", function (req, res, next) {
  res.render("add_affiliate_users", { title: "Add Affiliate's Users" });
});

// Error handling middleware
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

module.exports = router;
