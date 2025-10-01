import React from "react";

const features = [
  { title: "Smart Reminders", desc: "Receive timely notifications for every dose via browser or email.", icon: "⏰" },
  { title: "AI Predictions", desc: "Our AI analyzes your adherence patterns and nudges you proactively.", icon: "🤖" },
  { title: "Calendar Sync", desc: "Sync your medicine schedules with Google Calendar for better convenience.", icon: "📅" },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="mt-32 px-8 md:px-20 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
      {features.map((feature, idx) => (
        <div key={idx} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition flex flex-col items-center justify-center">
          <div className="text-5xl mb-4">{feature.icon}</div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
          <p className="text-slate-600">{feature.desc}</p>
        </div>
      ))}
    </section>
  );
};

export default FeaturesSection;
