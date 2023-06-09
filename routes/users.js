const express = require("express");
const router = express.Router();
const UsersSchema = require("./../models/users_schema");
const bcrypt = require("bcryptjs");
const CheckAuth = require("./../functions/check_auth");

router.get("/:id", (req, res) => {
  UsersSchema.findOne({ _id: req.params.id })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => {
      res.status(400).json({ message: err.message });
    });
});

//Get all users
router.get("/", async (req, res) => {
  try {
    const check = await CheckAuth(req, res);

    if (check.auth === false) {
      return res.status(401).json({ message: "Unauthorized", auth: false });
    }

    if (check.data.role !== "super_admin") {
      return res
        .status(401)
        .json({ message: "You Are Not Super Admin", auth: false });
    }

    const users = await UsersSchema.find().lean();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", validateRegister, async (req, res) => {
  //Hash password
  const hashed_password = await bcrypt.hash(req.body.password, 10);

  //Check if user exists

  const check = await CheckAuth(req, res);

  //Save user to database
  const save_user = new UsersSchema({
    full_name: req.body.full_name,
    dp: "https://styles.redditmedia.com/t5_2c83sr/styles/profileIcon_4dwzf4syg0w51.png",
    title: "I am new here :)",
    about: "Edit your profile to add more information about yourself",
    phone: req.body.phone,
    email: req.body.email,
    username: req.body.username,
    password: hashed_password,
    language: "english",
    country: "india",
    created_by: check.data._id,
  });
  try {
    await save_user.save();
    res.status(200).json({
      message: "User created successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message, status: "error" });
  }
});

//Middleware for register validation
async function validateRegister(req, res, next) {
  const { full_name, phone, email, username, password } = req.body;

  //Check if all fields are filled
  if (
    full_name === "" ||
    phone === "" ||
    email === "" ||
    username === "" ||
    password === "" ||
    full_name === undefined ||
    phone === undefined ||
    email === undefined ||
    username === undefined ||
    password === undefined ||
    full_name === null ||
    phone === null ||
    email === null ||
    username === null ||
    password === null
  ) {
    return res
      .status(400)
      .json({ message: "All fields are required", status: "error" });
  }

  //Check password length
  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters long",
      status: "error",
    });
  }

  //Check if user exists
  const user = await UsersSchema.findOne({ email: req.body.email });
  if (user)
    return res.status(400).json({
      message: "Email already exists",
      status: "error",
    });

  //Check email is valid
  const email_regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!email_regex.test(email))
    return res.status(400).json({
      message: "Email is not valid",
      status: "error",
    });

  //Check Username is valid
  const username_regex = /^[a-zA-Z0-9]+$/;
  if (!username_regex.test(username))
    return res.status(400).json({
      message: "Username is not valid",
      status: "error",
    });

  //Check username is unique
  const user_exists = await UsersSchema.findOne({ username: username });
  if (user_exists)
    return res.status(400).json({
      message: "Username is already taken",
      status: "error",
    });

  //Check phone is valid
  const phone_regex = /^[0-9]{10}$/;
  if (!phone_regex.test(phone))
    return res.status(400).json({
      message: "Phone is not valid",
      status: "error",
    });

  //Check phone is unique
  const phone_exists = await UsersSchema.findOne({ phone: phone });
  if (phone_exists)
    return res.status(400).json({
      message: "Phone is already exists",
      status: "error",
    });

  next();
}

//Delete user
router.delete("/:id", async (req, res) => {
  try {
    const check = await CheckAuth(req, res);

    if (check.auth === false) {
      return res.status(401).json({ message: "Unauthorized", auth: false });
    }

    if (check.data.role !== "admin") {
      return res
        .status(401)
        .json({ message: "You Are Not Admin", auth: false });
    }

    const user = await UsersSchema.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Update user
router.patch("/:id", async (req, res) => {
  try {
    const check = await CheckAuth(req, res);

    if (check.auth === false) {
      return res.status(401).json({ message: "Unauthorized", auth: false });
    }

    if (check.data.role !== "super_admin") {
      return res
        .status(401)
        .json({ message: "You Are Not Admin", auth: false });
    }

    const updates = req.body;
    const options = { new: true };
    const updatedUser = await UsersSchema.findByIdAndUpdate(
      req.params.id,
      updates,
      options
    );
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
