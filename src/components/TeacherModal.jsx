import { useEffect, useState } from "react";
import { addTeacher } from "../api/teacherApi";
import { getSubjects } from "../api/subjectApi";

function TeacherModal({ onClose, refreshTeachers }) {

    const [subjects, setSubjects] = useState([]);

    const [teacher, setTeacher] = useState({
        employeeId: "",
        name: "",
        subjects: [],
    });

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

    const handleChange = (e) => {

        setTeacher({
            ...teacher,
            [e.target.name]: e.target.value,
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await addTeacher(teacher);

            alert("Teacher Added Successfully");

            refreshTeachers();

            onClose();

        } catch (err) {

            console.log(err);

            alert("Could not save teacher.");

        }

    };

    return (

        <div className="modal-overlay">

            <div className="modal">

                <div className="modal-header">

                    <h2>Add Teacher</h2>

                    <button
                        type="button"
                        className="close-btn"
                        onClick={onClose}
                    >
                        ×
                    </button>

                </div>

                <form onSubmit={handleSubmit}>

                    <div className="form-group">

                        <label>Employee ID</label>

                        <input
                            type="text"
                            name="employeeId"
                            value={teacher.employeeId}
                            onChange={handleChange}
                            required
                        />

                    </div>

                    <div className="form-group">

                        <label>Teacher Name</label>

                        <input
                            type="text"
                            name="name"
                            value={teacher.name}
                            onChange={handleChange}
                            required
                        />

                    </div>

                    <div className="form-group">

                        <label>Subjects</label>

                        <div className="subject-list">

                            {subjects.length === 0 ? (

                                <p>Add subjects first.</p>

                            ) : (

                                subjects.map((subject) => (

                                    <label
                                        key={subject._id}
                                        className="subject-item"
                                    >

                                        <input
                                            type="checkbox"
                                            checked={teacher.subjects.includes(subject.name)}
                                            onChange={(e) => {

                                                if (e.target.checked) {

                                                    setTeacher({
                                                        ...teacher,
                                                        subjects: [
                                                            ...teacher.subjects,
                                                            subject.name
                                                        ]
                                                    });

                                                } else {

                                                    setTeacher({
                                                        ...teacher,
                                                        subjects:
                                                            teacher.subjects.filter(
                                                                s => s !== subject.name
                                                            )
                                                    });

                                                }

                                            }}
                                        />

                                        {subject.code} — {subject.name}

                                    </label>

                                ))

                            )}

                        </div>

                    </div>

                    <button
                        className="save-btn"
                        type="submit"
                    >
                        Save Teacher
                    </button>

                </form>

            </div>

        </div>

    );

}

export default TeacherModal;