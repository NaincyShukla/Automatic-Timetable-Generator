import "../styles/login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import API from "../api/axios";

function Login({ setIsOpen, openSignup }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await API.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Close the popup
      setIsOpen(false);

      // Navigate to dashboard
      navigate("/dashboard", { replace: true });
    } catch (error) {
      alert(error.response?.data?.message || "Login Failed");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await API.post("/auth/google", {
        credential: credentialResponse.credential,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setIsOpen(false);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      alert(error.response?.data?.message || "Google Login Failed");
    }
  };

  return (
    <div className="overlay" onClick={() => setIsOpen(false)}>
      <div className="auth-card" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={() => setIsOpen(false)}>
          ×
        </button>

        <h1>Welcome Back</h1>

        <p className="auth-subtitle">Log in to continue to EduScheduler</p>

        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => alert("Google Login Failed")}
        />

        <div className="divider">
          <span>OR</span>
        </div>

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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="forgot-password">Forgot password?</div>

        <button className="login-btn" onClick={handleLogin}>
          Log In
        </button>

        <p className="bottom-text">
          Don't have an account?
          <span className="switch-link" onClick={openSignup}>
            {" "}
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;