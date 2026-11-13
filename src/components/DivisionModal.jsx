import { useState } from "react";
import { addDivision } from "../api/divisionApi";

function DivisionModal({ onClose }) {

    const [formData, setFormData] = useState({
        divisionName: "",
        semester: "",
        batch: "",
        studentCount: "",
    });

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await addDivision(formData);

            alert("Division Added Successfully");

            onClose();

            window.location.reload();

        } catch (err) {

            console.log(err);

        }

    };

    return (

        <div className="modal-overlay">

            <div className="modal">

                <div className="modal-header">

                    <h2>Add Division</h2>

                    <button
                        type="button"
                        className="close-btn"
                        onClick={onClose}
                    >
                        ×
                    </button>

                </div>

                <form onSubmit={handleSubmit}>

                    <input
                        name="divisionName"
                        placeholder="Division Name (A, B, C...)"
                        value={formData.divisionName}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="number"
                        name="semester"
                        placeholder="Semester"
                        value={formData.semester}
                        onChange={handleChange}
                        required
                    />

                    

                    

                    <button type="submit">

                        Save Division

                    </button>

                </form>

            </div>

        </div>

    );

}

export default DivisionModal;