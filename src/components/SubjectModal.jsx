import { useState, useEffect } from "react";
import { addSubject, updateSubject } from "../api/subjectApi";

//import { useState, useEffect } from "react";

function SubjectModal({
    subject: editingSubject,
    onClose,
    refreshSubjects
}) {

    const [formData, setFormData] = useState({
        code: "",
        name: "",
        semester: "",
        type: "Mandatory",
        theoryHours: "",
        labHours: ""
    });

    useEffect(() => {

        if (editingSubject) {

            setFormData({
                code: editingSubject.code,
                name: editingSubject.name,
                semester: editingSubject.semester,
                type: editingSubject.type,
                theoryHours: editingSubject.theoryHours,
                labHours: editingSubject.labHours || 0
            });

        }

    }, [editingSubject]);

    const handleChange = (e) => {
        
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });

    };

    const handleSubmit = async (e) => {
if (editingSubject) {
    console.log("Updating Subject");
    await updateSubject(editingSubject._id, formData);
} else {
    console.log("Adding Subject");
    await addSubject(formData);
}
        e.preventDefault();

        try {

           if (editingSubject) {

    await updateSubject(editingSubject._id, formData);

} else {

    await addSubject(formData);

}

            if (refreshSubjects) {
                refreshSubjects();
            }

            onClose();

        }catch (err) {

    console.log(err);

    console.log(err.response);

    console.log(err.response?.data);

    alert(err.response?.data?.message || "Failed to save subject.");

}
    };

    return (

        <div className="modal-overlay">

            <div className="modal">

                {/* Header */}

                <div className="modal-header">

                    <h2>Add Subject</h2>

                    <button
                        type="button"
                        className="close-btn"
                        onClick={onClose}
                    >
                        ×
                    </button>

                </div>

                {/* Form */}

                <form onSubmit={handleSubmit}>

                    <div className="form-group">

                        <label>Subject Code</label>

                        <input
                            type="text"
                            name="code"
                            placeholder="CS301"
                            value={formData.code}
                            onChange={handleChange}
                            required
                        />

                    </div>

                    <div className="form-group">

                        <label>Subject Name</label>

                        <input
                            type="text"
                            name="name"
                            placeholder="Compiler Design"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />

                    </div>

                    <div className="form-group">

                        <label>Semester</label>

                        <input
                            type="number"
                            name="semester"
                            placeholder="5"
                            value={formData.semester}
                            onChange={handleChange}
                            required
                            min="1"
                            max="8"
                        />

                    </div>

                    <div className="form-group">

                        <label>Subject Type</label>

                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                        >

                            <option value="Mandatory">
                                Mandatory
                            </option>

                            <option value="Elective">
                                Elective
                            </option>

                        </select>

                    </div>

                    <div className="form-group">

                        <label>Theory Hours</label>

                        <input
                            type="number"
                            name="theoryHours"
                            placeholder="3"
                            value={formData.theoryHours}
                            onChange={handleChange}
                            required
                            min="0"
                        />

                    </div>

                    <div className="form-group">

                        <label>Lab Hours</label>

                        <input
                            type="number"
                            name="labHours"
                            value={formData.labHours}
                            onChange={handleChange}
                            step="0.5"
                            min="0"
                            required
                        />

                    </div>

                    <button
                        className="save-btn"
                        type="submit"
                    >
                        Save Subject
                    </button>

                </form>

            </div>

        </div>

    );

}

export default SubjectModal;