import { useState } from "react";

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import DemoTimetable from "../components/DemoTimetable";
import HowItWorks from "../components/HowItWorks";
import Stats from "../components/Stats";
import Footer from "../components/Footer";

import Login from "./Login";
import Signup from "./Signup";

function Home() {

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  return (
    <>

      <Navbar
        openLogin={() => setIsLoginOpen(true)}
        openSignup={() => setIsSignupOpen(true)}
      />

      <Hero />
      <DemoTimetable />
      <HowItWorks />
      <Stats />
      <Footer />

      {isLoginOpen && (
        <Login
          setIsOpen={setIsLoginOpen}
          openSignup={() => {
            setIsLoginOpen(false);
            setIsSignupOpen(true);
          }}
        />
      )}

      {isSignupOpen && (
        <Signup
          setIsOpen={setIsSignupOpen}
          openLogin={() => {
            setIsSignupOpen(false);
            setIsLoginOpen(true);
          }}
        />
      )}

    </>
  );
}

export default Home;