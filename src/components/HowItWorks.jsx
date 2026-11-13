import { useState, useEffect } from "react";
import "../styles/howitworks.css";
import mario from "../assets/mario.png";

function HowItWorks() {
  const [step, setStep] = useState(0);
  const [jumping, setJumping] = useState(false);
  const [showCard, setShowCard] = useState(true);

 const positions = ["5%", "29%", "53%", "77%"];
  
  const steps = [
    {
      color: "#7c3aed",
      title: "Define Resources",
      text: "Upload teachers, rooms, subjects and classes."
    },
    {
      color: "#06b6d4",
      title: "Set Constraints",
      text: "Configure availability windows, room capacities and scheduling rules."
    },
    {
       color: "#ec4899",
  title: "Generate Timetable",
      text: "ChronAI automatically creates a conflict-free timetable."
    },
    {
      color: "#f59e0b",
      title: "Download & Export",
      text: "Export timetable as PDF, Excel or print directly."
    }
  ];

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === "Space") {

  e.preventDefault();

  if (jumping) return;

  setJumping(true);

  setStep(prev =>
    prev === steps.length - 1
      ? 0
      : prev + 1
  );

  setTimeout(() => {
    setJumping(false);
  }, 600);
}
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [jumping, steps.length]);

  return (
    <section className="guide">
      <div className="guide-container">
      <h2>
  Guide to EduScheduler
</h2>

<p className="current-step-title">
  {steps[step].title}
</p>

      <div className="guide-layout">

  <div className="game-track">
    <div className="step-item">
    <div className={`platform resource ${step === 0 ? "active" : ""}`}>
      Create Account
    </div></div>
     <div className="step-item">
    <div className={`platform constraints ${step === 1 ? "active" : ""}`}>
      Define Resources
    </div></div>
      <div className="step-item">
    <div className={`platform timetable ${step === 2 ? "active" : ""}`}>
      Generate Timetable
    </div></div>
<div className="step-item">
    <div className={`platform download ${step === 3 ? "active" : ""}`}>
      Download
    </div></div>

    <img
      src={mario}
      alt="mario"
      className={`player ${jumping ? "jump" : ""}`}
      style={{
        left: positions[step]
      }}
    />

  </div>

  <div className="step-info">

    <h4
      style={{
        color: steps[step].color
      }}
    >
      STEP {String(step + 1).padStart(2, "0")}
    </h4>

    <h3>{steps[step].title}</h3>

    <p>{steps[step].text}</p>

  </div>

</div>
      </div>
    </section>
  );
}

export default HowItWorks;