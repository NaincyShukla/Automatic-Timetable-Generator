import "../styles/timetable.css";

function DemoTimetable() {
  return (
    <section className="timetable-section">

      <div className="browser">

        <div className="browser-top">
          <div className="dots">
            <span className="red"></span>
            <span className="yellow"></span>
            <span className="green"></span>
          </div>

          <div className="url">
            app.EduSchedular.io/timetable/generate
          </div>
        </div>

        <div className="table">

          <div className="header">Mon</div>
          <div className="header">Tue</div>
          <div className="header">Wed</div>
          <div className="header">Thu</div>
          <div className="header">Fri</div>

          <div className="subject math">Maths</div>
          <div className="subject chemistry">Chemistry</div>
          <div className="subject english">English</div>
          <div className="subject history">History</div>
          <div className="subject physics">Physics</div>


           <div className="subject english">English</div>
          <div className="subject history">History</div>
          <div className="subject physics">Physics</div>
          <div className="subject math">Maths</div>
          <div className="subject chemistry">Chemistry</div>
          
        </div>

      </div>

    </section>
  );
}

export default DemoTimetable;