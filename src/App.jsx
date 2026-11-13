import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Teachers from "./pages/Teachers";
import Subjects from "./pages/Subjects";
import Timetable from "./pages/Timetable";
import Locations from "./pages/Locations";
import Divisions from "./pages/Divisions";
import Settings from "./pages/Settings";

function ProtectedRoute({ children }) {

    const user = localStorage.getItem("user");

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Landing Page */}
        <Route path="/" element={<Home />} />

        {/* Dashboard */}
       <Route
    path="/dashboard"
    element={
        <ProtectedRoute>
            <Dashboard />
        </ProtectedRoute>
    }
/>
         <Route path="/teachers" element={
            <ProtectedRoute>
                <Teachers />
            </ProtectedRoute>
        } />
      <Route
    path="/subjects"
    element={
        <ProtectedRoute>
            <Subjects />
        </ProtectedRoute>
    }
/>
<Route
    path="/timetable"
    element={<Timetable />}
/>
<Route
    path="/locations"
    element={
        <ProtectedRoute>
            <Locations />
        </ProtectedRoute>
    }
/>
 <Route path="/divisions" element={
    <ProtectedRoute>
        <Divisions />
    </ProtectedRoute>
 } />

<Route
    path="/settings"
    element={
        <ProtectedRoute>
            <Settings />
        </ProtectedRoute>
    }
/>

      </Routes>
      
    </BrowserRouter>
  );
}

export default App;