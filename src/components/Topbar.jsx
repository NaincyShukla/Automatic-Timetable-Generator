import "../styles/topbar.css";

function Topbar() {

    const user = JSON.parse(localStorage.getItem("user"));

    return (

        <div className="topbar">

            <div>

                <h1>
                    Welcome {user?.name || "Admin"} 👋
                </h1>

                <p>
                    Manage your department timetables efficiently.
                </p>

            </div>

            <div className="profile">

                <div className="avatar">
                    {user?.name?.charAt(0).toUpperCase() || "A"}
                </div>

            </div>

        </div>

    );
}

export default Topbar;