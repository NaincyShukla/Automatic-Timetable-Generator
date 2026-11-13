import "../styles/login.css";
import { useState } from "react";
import API from "../api/axios";

function Signup({ setIsOpen, openLogin }) {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignup = async () => {

    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {

      const res = await API.post("/auth/register", {
        name,
        email,
        password,
      });

      alert(res.data.message);

      setIsOpen(false);

      openLogin();

    } catch (error) {

      alert(
        error.response?.data?.message || "Registration Failed"
      );

    }

  };

  return (
    <div
      className="overlay"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="auth-card"
        onClick={(e) => e.stopPropagation()}
      >

        <button
          className="close-btn"
          onClick={() => setIsOpen(false)}
        >
          ×
        </button>

        <h1>Create your account</h1>

        <p className="auth-subtitle">
          Start generating conflict-free timetables.
        </p>

        <button className="google-btn">
          Continue with Google
        </button>

        <div className="divider">
          <span>OR</span>
        </div>

        <label>Full Name</label>

        <input
          type="text"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label>Email</label>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>

        <input
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label>Confirm Password</label>

        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          className="login-btn"
          onClick={handleSignup}
        >
          Create Account
        </button>

        <p className="bottom-text">

          Already have an account?

          <span
            className="switch-link"
            onClick={openLogin}
          >
            {" "}Log In
          </span>

        </p>

      </div>
    </div>
  );
}

export default Signup;