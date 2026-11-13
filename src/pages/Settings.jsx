import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getSettings, updateSettings } from "../api/settingApi";
import "../styles/settings.css";
import { changePassword, deleteAccount } from "../api/authApi";
import { useTheme } from "../context/ThemeContext";

function Settings() {

    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("user"));
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [activeTab, setActiveTab] = useState("profile");
     const {

    darkMode,

    setDarkMode

} = useTheme();

    const [settings, setSettings] = useState({
        userId: user?._id || "",
        institutionName: "",
        department: "",
        workingDays: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday"
        ],
        collegeStartTime: "09:00",
        collegeEndTime: "16:00",
        breakStart: "13:00",
        breakEnd: "13:30",
        darkMode: false,
    });

   const loadSettings = async () => {
    try {

        const data = await getSettings(user._id);

        setSettings(data);
        setDarkMode(data.darkMode);

        if (data.darkMode) {
            document.body.classList.add("dark-mode");
        } else {
            document.body.classList.remove("dark-mode");
        }

    } catch (err) {
        console.log(err);
    }
};

useEffect(() => {
    if (user?._id) {
        loadSettings();
    }
}, []);


    //const loadSettings = async () => {
       // try {
           // const data = await getSettings(user._id);
           // setSettings(data);
      //  } catch (err) {
           // console.log(err);
      //  }
   // };

    const handleChange = (e) => {
        setSettings({
            ...settings,
            [e.target.name]: e.target.value,
        });
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            alert("Please fill all password fields.");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("New passwords do not match.");
            return;
        }

        try {
            await changePassword({
                userId: user._id,
                currentPassword,
                newPassword
            });

            alert("Password Updated Successfully");

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            alert(
                err.response?.data?.message ||
                "Could not update password."
            );
        }
    };

    const saveSettings = async () => {

    try {

        const updated = await updateSettings(settings);

        setSettings(updated);

        setDarkMode(updated.darkMode);

        localStorage.setItem(
            "darkMode",
            updated.darkMode
        );

        if (updated.darkMode) {
            document.body.classList.add("dark-mode");
        } else {
            document.body.classList.remove("dark-mode");
        }

        alert("Settings Saved Successfully");

    } catch (err) {

        console.log(err);

        alert("Could not save settings.");

    }

};

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to delete your account? This action cannot be undone."
        );

        if (!confirmed) return;

        try {
            await deleteAccount(user._id);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            alert("Account deleted successfully.");
            navigate("/", { replace: true });
        } catch (err) {
            alert(
                err.response?.data?.message ||
                "Could not delete account."
            );
        }
    };

    const days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ];

    const dayShort = {
        Monday: "Mon",
        Tuesday: "Tue",
        Wednesday: "Wed",
        Thursday: "Thu",
        Friday: "Fri",
        Saturday: "Sat",
        Sunday: "Sun",
    };

    const toggleDay = (day) => {
        if (settings.workingDays.includes(day)) {
            setSettings({
                ...settings,
                workingDays: settings.workingDays.filter((d) => d !== day),
            });
        } else {
            setSettings({
                ...settings,
                workingDays: [...settings.workingDays, day],
            });
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <div className="dashboard-content">
                <div className="settings-page">

                    <h1>Settings</h1>
                    <p className="settings-subtitle">
                        Manage your account and preferences
                    </p>

                    <div className="settings-tabs">
                        <button
                            className={activeTab === "profile" ? "tab active" : "tab"}
                            onClick={() => setActiveTab("profile")}
                        >
                            Profile
                        </button>
                        <button
                            className={activeTab === "timetable" ? "tab active" : "tab"}
                            onClick={() => setActiveTab("timetable")}
                        >
                            Timetable
                        </button>
                        <button
                            className={activeTab === "appearance" ? "tab active" : "tab"}
                            onClick={() => setActiveTab("appearance")}
                        >
                            Appearance
                        </button>
                    </div>

                    {activeTab === "profile" && (
                        <>
                            <div className="setting-card">
                                <div className="profile-header">
                                    <div className="avatar-circle">
                                        {user?.name?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                    <div>
                                        <h3>{user?.name}</h3>
                                        <p className="muted-text">{user?.email}</p>
                                    </div>
                                </div>

                                <div className="profile-fields">
                                    <div>
                                        <label>First Name</label>
                                        <input value={user?.name || ""} disabled />
                                    </div>
                                    <div>
                                        <label>Email</label>
                                        <input value={user?.email || ""} disabled />
                                    </div>
                                </div>
                            </div>

                            <div className="setting-card">
                                <h2>Password</h2>
                                <p className="muted-text">Change your login password</p>

                                <label>Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                />

                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />

                                <label>Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />

                                <button className="save-btn" onClick={handleChangePassword}>
                                    Update Password
                                </button>
                            </div>

                            <div className="setting-card danger-zone">
                                <h2>Delete Account</h2>
                                <p className="muted-text">
                                    Permanently delete your account and all associated data.
                                    This action cannot be undone.
                                </p>
                                <button
                                    className="delete-btn"
                                    onClick={handleDeleteAccount}
                                >
                                    Delete Account
                                </button>
                            </div>
                        </>
                    )}

                    {activeTab === "timetable" && (
                        <>
                            <div className="setting-card">
                                <h2>Institution</h2>
                                <label>Institution Name</label>
                                <input
                                    name="institutionName"
                                    value={settings.institutionName}
                                    onChange={handleChange}
                                    placeholder="Institution Name"
                                />
                               
                            </div>

                            <div className="setting-card">
                                <h2>Working Days</h2>
                                <p className="muted-text">Select which days classes are held</p>

                                <div className="days-grid">
                                    {days.map((day) => (
                                        <button
                                            key={day}
                                            type="button"
                                            className={
                                                settings.workingDays.includes(day)
                                                    ? "day-pill active"
                                                    : "day-pill"
                                            }
                                            onClick={() => toggleDay(day)}
                                        >
                                            {dayShort[day]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="setting-card">
                                <h2>College Hours</h2>
                                <p className="muted-text">Set your daily schedule and break time</p>

                                <div className="time-grid">
                                    <div>
                                        <label>Start Time</label>
                                        <input
                                            type="time"
                                            name="collegeStartTime"
                                            value={settings.collegeStartTime}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label>End Time</label>
                                        <input
                                            type="time"
                                            name="collegeEndTime"
                                            value={settings.collegeEndTime}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label>Break Start</label>
                                        <input
                                            type="time"
                                            name="breakStart"
                                            value={settings.breakStart}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label>Break End</label>
                                        <input
                                            type="time"
                                            name="breakEnd"
                                            value={settings.breakEnd}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <hr />

                                <p className="muted-text small-label">Day Overview</p>
                                <div className="day-overview-bar">
                                    <div className="bar-track"></div>
                                </div>
                                <div className="bar-labels">
                                    <span>{settings.collegeStartTime}</span>
                                    <span>
                                        Break {settings.breakStart}–{settings.breakEnd}
                                    </span>
                                    <span>{settings.collegeEndTime}</span>
                                </div>
                            </div>

                            <button className="save-settings" onClick={saveSettings}>
                                Save Changes
                            </button>
                        </>
                    )}

                    {activeTab === "appearance" && (
                        <div className="setting-card">
                            <h2>Appearance</h2>
                            <p className="muted-text">Customize how the app looks</p>

                            <div className="dark-mode-row">
                                <div>
                                    <h3>Dark Mode</h3>
                                    <p className="muted-text">Switch to a darker color palette</p>
                                </div>

                                <label className="switch">
                                    <input
                                        type="checkbox"
                                       checked={darkMode}
                                        onChange={(e) =>{
                                            setDarkMode(e.target.checked);
                                            setSettings({
                                                ...settings,
                                                darkMode: e.target.checked,
                                            })
                                        }}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>

                            <hr />

                            
                            

                            <button className="save-settings" onClick={saveSettings}>
                                Save Changes
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

export default Settings;