import React, { useEffect } from "react";
import { Routes, Route, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import LandingPage from "./pages/LandingPage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import RegisterPage from "./pages/authPages/RegisterPage";
import LoginPage from "./pages/authPages/LoginPage";
import VerifyEmailPage from "./pages/authPages/VerifyEmailPage";
import ProfilePage from "./pages/authPages/ProfilePage";

import { useDispatch } from "react-redux";
import { loadUser } from "./features/authSlice";

import ScheduleListPage from "./pages/ScheduleListPage";
import ScheduleFormPage from "./pages/ScheduleFormPage";
import DoseLogPage from "./pages/DoseLogPage";
import ScheduleForm from "./pages/ScheduleForm"


import DashboardPage from "./pages/DashboardPage";
import MedicineListPage from "./pages/medPages/MedicineListPage";
import MedicineFormPage from "./pages/medPages/MedicineFormPage";
import EditMedicinePage from "./pages/medPages/EditMedicinePage";
import NotificationsPage from "./pages/NotificationsPage";
import Chatbot from "./components/Chatbot";


const App = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  useEffect(() => {
    const calendarParam = searchParams.get("calendar");
    if (calendarParam === "connected") {
      toast.success("Google Calendar connected!");
      dispatch(loadUser());
      setSearchParams({}, { replace: true });
    } else if (calendarParam === "error") {
      toast.error("Failed to connect Google Calendar.");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, dispatch, setSearchParams]);

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage/>} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/get" element={<ProfilePage />} />

        <Route path="/schedules" element={<ScheduleListPage />} />
        <Route path="/schedules/new/:medicineId?" element={<ScheduleFormPage />} />
        <Route path="/schedules/edit/:scheduleId" element={<ScheduleFormPage />} />
        <Route path="/schedules/new" element={<ScheduleForm />} />

      
        <Route path="/dose-logs" element={<DoseLogPage />} />
        <Route path="/dashboard" element={<DashboardPage/>}/>
        <Route path="/medicines" element={<MedicineListPage/>}/>
        <Route path="/medicine-form" element={<MedicineFormPage/>}/>
        <Route path="/medicine-form/:id" element={<EditMedicinePage/>}/>

        <Route path="/notifications" element={<NotificationsPage/>}/>
      </Routes>
      <Chatbot/>
      <Footer />
    </div>
  );
};

export default App;
