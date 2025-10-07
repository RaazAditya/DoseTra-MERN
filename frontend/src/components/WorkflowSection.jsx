import React from "react";
import { Link } from "react-router-dom";

const workflow = [
  { title: "Add Medicine", icon: "💊", link: "/medicines" },
  { title: "Add Schedule", icon: "📅", link: "/schedules/new" },
  { title: "Take Dose", icon: "⏱️", link: "/doses/today" },
  { title: "View Dashboard", icon: "📊", link: "/dashboard" },
];

const WorkflowSection = () => {
  return (
    <section className="mt-32 px-8 md:px-20 text-center">
      <h2 className="text-4xl font-bold text-slate-900 mb-10">How DoseTra Works</h2>
      
      {/* Responsive grid: 1 col on mobile, 2 cols on md, 4 cols on lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {workflow.map((step, idx) => (
          <Link
            key={idx}
            to={step.link}
            className="flex flex-col items-center bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition h-full"
          >
            <div className="text-5xl mb-4">{step.icon}</div>
            <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default WorkflowSection;
