import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="flex flex-col-reverse md:flex-row items-center justify-between px-8 md:px-20 mt-16 gap-10 md:gap-20">
      {/* Text */}
      <div className="md:w-1/2 space-y-6 text-center md:text-left">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight">
          Never Miss a Dose Again
        </h2>
        <p className="text-slate-700 text-lg sm:text-xl">
          Managing daily medicines can be stressful. DoseTra helps you stay on top of your health by organizing your medicine schedule effortlessly.
          Receive timely reminders, track your doses, and gain insights into your adherence patterns.
        </p>
        <p className="text-slate-700 text-lg sm:text-xl">
          With AI-powered predictions, DoseTra identifies high-risk times when you might forget a dose and sends proactive nudges. Sync your schedule with Google Calendar for seamless planning and peace of mind.
        </p>

        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0 justify-center md:justify-start">
          <Link to="/register">
            <Button className="border border-slate-900 bg-slate-900 text-white hover:bg-slate-100 hover:text-slate-900">
              Get Started
            </Button>
          </Link>
          <Link to="#features">
            <Button className="border border-slate-900 text-slate-100 hover:bg-slate-100 hover:text-slate-900">
              Learn More
            </Button>
          </Link>
        </div>
      </div>

      {/* Image */}
      <div className="md:w-1/2 flex justify-center">
        <div className="w-full max-w-lg aspect-[4/3]">
          <img
            src="https://images.unsplash.com/photo-1622227922682-56c92e523e58?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0"
            alt="Medicine Scheduling"
            className="rounded-xl shadow-xl object-cover w-full h-full"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
