import { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import RecentTimetable from "../components/RecentTimetable";

import { getTeachers } from "../api/teacherApi";
import { getSubjects } from "../api/subjectApi";
import { getLocations } from "../api/locationApi";
import { getDivisions } from "../api/divisionApi";

import teacherIcon from "../assets/teacher.png";
import subjectIcon from "../assets/books.png";
import locationIcon from "../assets/location.png";
import divisionIcon from "../assets/division.png";

import "../styles/dashboard.css";

function Dashboard() {

    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [locations, setLocations] = useState([]);
const [divisions, setDivisions] = useState([]);



    useEffect(() => {

        loadDashboard();

    }, []);

    const loadDashboard = async () => {

        try {

            const teacherData = await getTeachers();
            const subjectData = await getSubjects();
            const locationData = await getLocations();
            const divisionData = await getDivisions();
            setTeachers(teacherData);
            setSubjects(subjectData);
            setLocations(locationData);
            setDivisions(divisionData);

        } catch (err) {

            console.log(err);

        }

    };

    return (

        <div className="dashboard-layout">

            <Sidebar />

            <div className="dashboard-content">

                <Topbar />

                <div className="stats-grid">

                    <StatCard
                        icon={<img src={teacherIcon} alt="Teachers" />}
                        value={teachers.length}
                        title="Teachers"
                        subtitle="Faculty Members"
                    />

                    <StatCard
                        icon={<img src={subjectIcon} alt="Subjects" />}
                        value={subjects.length}
                        title="Subjects"
                        subtitle="Curriculum Subjects"
                    />

                    <StatCard
    icon={<img src={locationIcon} alt="" />}
    value={locations.length}
    title="Locations"
    subtitle="Rooms & Labs"
/>

                    <StatCard
    icon={<img src={divisionIcon} alt="" />}
    value={divisions.length}
    title="Divisions"
    subtitle="Student Divisions"
/>

                </div>

                <RecentTimetable />

            </div>

        </div>

    );

}

export default Dashboard;