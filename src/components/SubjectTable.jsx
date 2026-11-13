import { useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaEdit, FaTrash } from "react-icons/fa";
import { deleteSubject } from "../api/subjectApi";

function SubjectTable({
    subjects,
    onEdit,
    refreshSubjects,
}) {

    const [openMenu, setOpenMenu] = useState(null);

    const handleDelete = async (id) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this subject?"
        );

        if (!confirmDelete) return;

        try {

            await deleteSubject(id);

            if (refreshSubjects) {
                refreshSubjects();
            }

            setOpenMenu(null);

        } catch (err) {

            console.log(err);

            alert("Failed to delete subject.");

        }

    };

    return (

        <table className="subject-table">

            <thead>

                <tr>

                    <th>Code</th>
                    <th>Subject Name</th>
                    <th>Semester</th>
                    <th>Type</th>
                    <th>Theory Hours</th>
                    <th>Lab Hours</th>
                    <th>Actions</th>

                </tr>

            </thead>

            <tbody>

                {subjects.length === 0 ? (

                    <tr>

                        <td
                            colSpan="7"
                            style={{ textAlign: "center" }}
                        >
                            No Subjects Found
                        </td>

                    </tr>

                ) : (

                    subjects.map((subject) => (

                        <tr key={subject._id}>

                            <td>{subject.code}</td>

                            <td>{subject.name}</td>

                            <td>{subject.semester}</td>

                            <td>{subject.type}</td>

                            <td>{subject.theoryHours}</td>

                            <td>{subject.labHours}</td>

                            <td className="action-cell">

                                <button
                                    className="menu-btn"
                                    onClick={() =>
                                        setOpenMenu(
                                            openMenu === subject._id
                                                ? null
                                                : subject._id
                                        )
                                    }
                                >
                                    <BsThreeDotsVertical />
                                </button>

                                {openMenu === subject._id && (

                                    <div className="action-menu">

                                        <button
                                            className="edit-menu-btn"
                                            onClick={() => {
                                                onEdit(subject);
                                                setOpenMenu(null);
                                            }}
                                        >
                                            <FaEdit />
                                            <span>Edit</span>
                                        </button>

                                        <button
                                            className="delete-menu-btn"
                                            onClick={() =>
                                                handleDelete(subject._id)
                                            }
                                        >
                                            <FaTrash />
                                            <span>Delete</span>
                                        </button>

                                    </div>

                                )}

                            </td>

                        </tr>

                    ))

                )}

            </tbody>

        </table>

    );

}

export default SubjectTable;