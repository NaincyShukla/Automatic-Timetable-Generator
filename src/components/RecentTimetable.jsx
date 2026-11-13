import "../styles/recent.css";
import { generateTimetable } from "../api/timetableApi";

function RecentTimetable() {

    const handleGenerate = async () => {

        try {

            const user = JSON.parse(localStorage.getItem("user"));

            const result = await generateTimetable(7);

            console.log(result);

            alert("Timetable Generated Successfully!");

        } catch (err) {

            console.log(err);

            alert("Could not generate timetable.");

        }

    };

    return (

        <div className="recent-card">

            <div className="recent-header">

                <h2>Recent Timetables</h2>

                <button className="create-btn">
                    + Create Timetable
                </button>

            </div>

            <div className="empty-state">

                <div className="calendar-icon">

                    <svg xmlns="http://www.w3.org/2000/svg" width="45" height="46" fill="currentColor" className="bi bi-calendar-day" viewBox="0 0 16 16">
                        <path d="M4.684 11.523v-2.3h2.261v-.61H4.684V6.801h2.464v-.61H4v5.332zm3.296 0h.676V8.98c0-.554.227-1.007.953-1.007.125 0 .258.004.329.015v-.613a2 2 0 0 0-.254-.02c-.582 0-.891.32-1.012.567h-.02v-.504H7.98zm2.805-5.093c0 .238.192.425.43.425a.428.428 0 1 0 0-.855.426.426 0 0 0-.43.43m.094 5.093h.672V7.418h-.672z"/>
                        <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
                    </svg>

                </div>

                <h3>No Timetables Yet</h3>

                <p>
                    Start by adding teachers, subjects, locations and divisions,
                    then generate your first timetable.
                </p>

                <button
                    className="generate-btn"
                    onClick={handleGenerate}
                >
                    Generate Timetable
                </button>

            </div>

        </div>

    );

}

export default RecentTimetable;