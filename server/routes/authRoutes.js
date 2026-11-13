const express = require("express");

const router = express.Router();

const {
  register,
  login,
  googleLogin,
  changePassword,
  deleteAccount
} = require("../controllers/authController");

router.post("/register", register);

router.post("/login", login);

router.post("/google", googleLogin);

router.put("/change-password", changePassword);

router.delete("/delete/:userId", deleteAccount);

module.exports = router;