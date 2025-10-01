import React from 'react'
import { Routes, Route } from "react-router-dom";
import LandingPage from './pages/LandingPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const App = () => {
  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
    <Navbar/>
    <Routes>
      <Route path="/" element={<LandingPage/>} />
    </Routes>
    <Footer/>
    </div>
  )
}

export default App
