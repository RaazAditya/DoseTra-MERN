import React from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import WorkflowSection from "@/components/WorkflowSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";


import { useSelector } from "react-redux";
import LoggedInLanding from "@/components/LoggedInLanding";


export default function LandingPage() {
  const { user } = useSelector((state) => state.auth);

  return user ? <LoggedInLanding /> : (
    <div>
      <HeroSection />
      <FeaturesSection />
      <WorkflowSection />
      <CTASection />
    </div>
  );
}
