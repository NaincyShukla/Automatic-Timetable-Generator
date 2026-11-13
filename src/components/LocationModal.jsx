import { useState } from "react";
import { addLocation } from "../api/locationApi";

function LocationModal({ onClose }) {

    const [formData, setFormData] = useState({
        roomNo: "",
        type: "Classroom",
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

            await addLocation(formData);

            alert("Location Added Successfully");

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

                    <h2>Add Location</h2>

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
                        name="roomNo"
                        value={formData.roomNo}
                        onChange={handleChange}
                        placeholder="Room Number"
                        required
                    />

                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                    >
                        <option value="Classroom">Classroom</option>
                        <option value="Laboratory">Lab
                            
                        </option>
                    </select>

                    <button type="submit">

                        Save Location

                    </button>

                </form>

            </div>

        </div>

    );

}

export default LocationModal;