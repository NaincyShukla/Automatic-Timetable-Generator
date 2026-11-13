import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import SubjectTable from "../components/SubjectTable";
import SubjectModal from "../components/SubjectModal";
import { getSubjects } from "../api/subjectApi";
import "../styles/subjects.css";

function Subjects() {

    const [subjects, setSubjects] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);
    useEffect(() => {
        loadSubjects();
    }, []);

    const loadSubjects = async () => {

        try {

            const data = await getSubjects();

            setSubjects(data);

        } catch (err) {

            console.log(err);

        }

    };

    return (

        <div className="dashboard-layout">

            <Sidebar />

            <div className="dashboard-content">

                <div className="subjects-page">

                    {/* Header */}

                    <div className="subjects-header">

                        <div>

                            <h1>Subjects</h1>

                            <p>
                                Manage curriculum subjects, assign codes and define weekly hours.
                            </p>

                        </div>

                        <button
    className="subject-btn"
    onClick={() => {
        setSelectedSubject(null);
        setOpenModal(true);
    }}
>
    + Add Subject
</button>

                    </div>

                    {/* Cards */}

                    <div className="subject-cards">

                        <div className="subject-card">

                            <div className="subject-icon">
                                📚
                            </div>

                            <div>

                                <h2>{subjects.length}</h2>

                                <p>Total Subjects</p>

                            </div>

                        </div>

                        <div className="subject-card">

                            <div className="subject-icon">
                                📖
                            </div>

                            <div>

                                <h2>
                                    {
                                        subjects.filter(
                                            s => s.type === "Mandatory"
                                        ).length
                                    }
                                </h2>

                                <p>Mandatory</p>

                            </div>

                        </div>

                        <div className="subject-card">

                            <div className="subject-icon">
                                ⭐
                            </div>

                            <div>

                                <h2>
                                    {
                                        subjects.filter(
                                            s => s.type === "Elective"
                                        ).length
                                    }
                                </h2>

                                <p>Elective</p>

                            </div>

                        </div>

                    </div>

                    {/* Search */}

                    <div className="subject-search">

                        <input
                            placeholder="🔍 Search by subject code or name..."
                        />

                    </div>

                    {/* Table */}

                    <SubjectTable
    subjects={subjects}
    refreshSubjects={loadSubjects}
    onEdit={(subject) => {
        setSelectedSubject(subject);
        setOpenModal(true);
    }}
/>

                </div>

            </div>

            {openModal && (

                <SubjectModal
    subject={selectedSubject}
    onClose={() => {
        setOpenModal(false);
        setSelectedSubject(null);
    }}
    refreshSubjects={loadSubjects}
/>

            )}

        </div>

    );

}

export default Subjects;