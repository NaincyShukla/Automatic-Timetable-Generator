import { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";
import DivisionTable from "../components/DivisionTable";
import DivisionModal from "../components/DivisionModal";
import "../styles/divisions.css";

import { getDivisions } from "../api/divisionApi";

import "../styles/divisions.css";

function Divisions() {

    const [divisions, setDivisions] = useState([]);
    const [openModal, setOpenModal] = useState(false);

    useEffect(() => {

        loadDivisions();

    }, []);

    const loadDivisions = async () => {

        try {

            const data = await getDivisions();

            setDivisions(data);

        } catch (err) {

            console.log(err);

        }

    };

    return (

        <div className="dashboard-layout">

            <Sidebar />

            <div className="dashboard-content">

                <div className="divisions-page">

                    {/* Header */}

                    <div className="divisions-header">

                        <div>

                            <h1>Divisions</h1>

                            <p>
                                Manage student divisions and batches.
                            </p>

                        </div>

                        <button
                            className="division-btn"
                            onClick={() => setOpenModal(true)}
                        >
                            + Add Division
                        </button>

                    </div>

                    {/* Cards */}

                    <div className="division-cards">

                        <div className="division-card">

                            <div className="division-icon">
                                📦
                            </div>

                            <div>

                                <h2>{divisions.length}</h2>

                                <p>Total Divisions</p>

                            </div>

                        </div>

                        <div className="division-card">

                            <div className="division-icon">
                                🎓
                            </div>

                            <div>

                                <h2>
                                    {divisions.reduce(
                                        (sum, d) => sum + Number(d.studentCount || 0),
                                        0
                                    )}
                                </h2>

                                <p>Total Students</p>

                            </div>

                        </div>

                    </div>

                    {/* Search */}

                    <div className="division-search">

                        <input
                            type="text"
                            placeholder="🔍 Search division..."
                        />

                    </div>

                    {/* Table */}

                    <DivisionTable divisions={divisions} />

                </div>

            </div>

            {openModal && (

                <DivisionModal
                    onClose={() => setOpenModal(false)}
                />

            )}

        </div>

    );

}

export default Divisions;