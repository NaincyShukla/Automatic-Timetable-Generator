import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TeacherTable from "../components/TeacherTable";
import TeacherModal from "../components/TeacherModal";
import "../styles/teachers.css";
import { useEffect } from "react";
import { getTeachers } from "../api/teacherApi";

function Teachers() {

  const [teachers, setTeachers] = useState([]);
  const [openModal, setOpenModal] = useState(false);

  const loadTeachers = async () => {

    const data = await getTeachers();

    setTeachers(data);

};
useEffect(() => {

    loadTeachers();

}, []);
  return (

    <div className="dashboard-layout">

      <Sidebar />

      <div className="dashboard-content">

        <div className="teachers-page">

          {/* Header */}

          <div className="teachers-header">

            <div>

              <h1>Teachers</h1>

              <p>
                Manage faculty, assign subjects and define teaching capacities.
              </p>

            </div>

            <button
              className="teacher-btn"
              onClick={() => setOpenModal(true)}
            >
              + Add Teacher
            </button>

          </div>

          {/* Stats */}

          <div className="teacher-cards">

    <div className="teacher-card">

        <div className="teacher-icon">
            👨‍🏫
        </div>

        <div>

            <h2>{teachers.length}</h2>

            <p>Total Teachers</p>

        </div>

    </div>

   

    

</div>

          {/* Search */}

          <div className="teacher-search">

            <input
              placeholder="🔍 Search by name, ID or subject..."
            />

          </div>

          {/* Table */}

          <TeacherTable teachers={teachers} />

        </div>

      </div>

      {openModal && (

       <TeacherModal
    onClose={() => setOpenModal(false)}
    refreshTeachers={loadTeachers}
/>

      )}

    </div>

  );

}

export default Teachers;