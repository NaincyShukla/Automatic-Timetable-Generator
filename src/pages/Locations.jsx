
import Sidebar from "../components/Sidebar";
import LocationTable from "../components/LocationTable";
import LocationModal from "../components/LocationModal";
import "../styles/locations.css";
import { useEffect, useState } from "react";
import { getLocations } from "../api/locationApi";

function Locations() {

   
    const [openModal, setOpenModal] = useState(false);
    const [locations, setLocations] = useState([]);
    useEffect(() => {

    loadLocations();

}, []);
const loadLocations = async () => {

    try {

        const data = await getLocations();

        setLocations(data);

    } catch (err) {

        console.log(err);

    }

};

    return (

        <div className="dashboard-layout">

            <Sidebar />

            <div className="dashboard-content">

                <div className="locations-page">

                    {/* Header */}

                    <div className="locations-header">

                        <div>

                            <h1>Locations</h1>

                            <p>
                                Manage classrooms and labs.
                            </p>

                        </div>

                        <button
                            className="location-btn"
                            onClick={() => setOpenModal(true)}
                        >
                            + Add Location
                        </button>

                    </div>

                    {/* Cards */}

                    <div className="location-cards">

                        <div className="location-card">

                            <div className="location-icon">
                               <span><svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-geo-alt" viewBox="0 0 16 16">
  <path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A32 32 0 0 1 8 14.58a32 32 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10"/>
  <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4m0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
</svg></span>
                            </div>

                            <div>

                                <h2>{locations.length}</h2>

                                <p>Total Locations</p>

                            </div>

                        </div>

                        <div className="location-card">

                            <div className="location-icon">
                                <span><svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-geo-alt" viewBox="0 0 16 16">
  <path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A32 32 0 0 1 8 14.58a32 32 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10"/>
  <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4m0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
</svg></span>
                            </div>

                            <div>

                                <h2>{locations.filter((l) => l.type === "Classroom").length}</h2>

                                <p>Classrooms</p>

                            </div>

                        </div>

                        <div className="location-card">

                            <div className="location-icon">
                                <span><svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-geo-alt" viewBox="0 0 16 16">
  <path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A32 32 0 0 1 8 14.58a32 32 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10"/>
  <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4m0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
</svg></span>
                            </div>

                            <div>

                                <h2>{locations.filter((l) => l.type === "Laboratory").length}</h2>

                                <p>Labs</p>

                            </div>

                        </div>

                    </div>

                    {/* Search */}

                    <div className="location-search">

                        <input
                            placeholder="🔍 Search room number..."
                        />

                    </div>

                    {/* Table */}

                   <LocationTable locations={locations} />

                </div>

            </div>

            {openModal && (

                <LocationModal
                    onClose={() => setOpenModal(false)}
                />

            )}

        </div>

    );

}

export default Locations;