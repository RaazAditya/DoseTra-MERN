import React from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import WorkflowSection from "@/components/WorkflowSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const LandingPage = () => {
  return (
    <div>
      <HeroSection />
      <FeaturesSection />
      <WorkflowSection />
      <CTASection />
    </div>
  );
};

export default LandingPage;
