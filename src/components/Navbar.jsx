import "../styles/navbar.css";

function Navbar({ openLogin, openSignup }) {
  return (
    <nav className="navbar">

      <div className="logo">
        <h2>EduScheduler</h2>
      </div>

      <div className="nav-links">
        
      </div>

      <div className="nav-buttons">

        <button
          className="nav-login-btn"
          onClick={openLogin}
        >
          Log In
        </button>

        <button
          className="nav-start-btn"
          onClick={openSignup}
        >
          Get Started
        </button>

      </div>

    </nav>
  );
}

export default Navbar;