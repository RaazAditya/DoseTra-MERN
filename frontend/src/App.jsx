import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import RegisterPage from "./pages/authPages/RegisterPage";
import LoginPage from "./pages/authPages/LoginPage";
import ProfilePage from "./pages/authPages/ProfilePage";
import { useDispatch } from "react-redux";
import { loadUser } from "./features/authSlice";
<<<<<<< HEAD
import ScheduleListPage from "./pages/ScheduleListPage";
import ScheduleFormPage from "./pages/ScheduleFormPage";
import DoseLogPage from "./pages/DoseLogPage";

=======
import DashboardPage from "./pages/DashboardPage";
// import MedicineListPage from "./pages/medPages/MedicineListPage";
// import MedicineFormPage from "./pages/medPages/MedicineFormPage";
>>>>>>> origin/main

const App = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/get" element={<ProfilePage />} />
<<<<<<< HEAD
        <Route path="/schedulelist" element={<ScheduleListPage />} />
        <Route path="/add-schedule" element={<ScheduleFormPage />} />
        <Route path="/dose-logs" element={<DoseLogPage />} />
=======
        <Route path="/dashboard" element={<DashboardPage/>}/>
        {/* <Route path="/medicines" element={<MedicineListPage/>}/>
        <Route path="/medicine-form" element={<MedicineFormPage/>}/> */}
>>>>>>> origin/main
      </Routes>
      <Footer />
    </div>
  );
};

export default App;
