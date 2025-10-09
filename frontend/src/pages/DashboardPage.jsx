// import React, { useEffect, useState } from "react";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
// import { Button } from "@/components/ui/button";
// import { Pill, Calendar, AlertTriangle, BarChart2 } from "lucide-react";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   Legend,
//   LineChart,
//   Line,
// } from "recharts";
// import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
// import { getDashboardSummary } from "../features/api/authApi";


// const DashboardPage = () => {
//   const [summary, setSummary] = useState({});
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchDashboard = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         if (!token) return navigate("/login");

//         const data = await getDashboardSummary(token);

//         // Transform missedTrends to trends array for charts
//         const trends = Object.entries(data.missedTrends || {}).map(
//           ([date, missed]) => ({
//             date,
//             missed,
//             taken: 0, // optional, if your API doesn't provide "taken", you can calculate later
//           })
//         );

//         setSummary({
//           adherence: data.adherence || 0,
//           upcoming: data.upcoming || [],
//           trends,
//         });
//       } catch (error) {
//         console.error("Failed to fetch dashboard:", error);
//       }
//     };

//     fetchDashboard();
//   }, [navigate]);

//   const today = new Date().toISOString().split("T")[0];

//   const getAdherenceColor = (value) => {
//     if (value >= 80) return "bg-green-500";
//     if (value >= 50) return "bg-yellow-400";
//     return "bg-red-500";
//   };

//   const formatTimeRemaining = (scheduledAt) => {
//     const now = new Date();
//     const target = new Date(scheduledAt);
//     const diff = target - now;
//     if (diff <= 0) return "Now";
//     const hrs = Math.floor(diff / 1000 / 60 / 60);
//     const mins = Math.floor((diff / 1000 / 60) % 60);
//     return `${hrs}h ${mins}m`;
//   };

//   const adherenceData = summary.trends?.map((d) => ({
//     date: d.date,
//     adherence: ((d.taken / (d.taken + d.missed)) * 100 || 0).toFixed(0),
//   }));

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6 md:p-8">
//       {/* Header */}
//       <motion.div
//         className="mb-6 text-center"
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//       >
//         <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
//           Dashboard
//         </h1>
//         <p className="text-gray-600 mt-1 text-sm md:text-base">
//           Monitor your medication adherence & trends
//         </p>
//       </motion.div>

//       {/* Summary Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8">
//         {/* Adherence Card */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//         >
//           <Card className="rounded-3xl shadow-xl border border-gray-200 hover:shadow-2xl transform hover:-translate-y-1 transition">
//             <CardHeader className="flex items-center gap-3">
//               <Pill className="w-7 h-7 text-blue-600" />
//               <CardTitle className="text-lg font-semibold">Adherence</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="flex items-center justify-between mb-2">
//                 <span className="font-bold text-gray-700 text-lg md:text-xl">
//                   {summary.adherence || 0}%
//                 </span>
//                 <span
//                   className={`px-3 py-1 text-xs md:text-sm font-semibold rounded-full text-white ${getAdherenceColor(
//                     summary.adherence
//                   )}`}
//                 >
//                   {summary.adherence >= 80
//                     ? "Excellent"
//                     : summary.adherence >= 50
//                     ? "Moderate"
//                     : "Poor"}
//                 </span>
//               </div>
//               <Progress
//                 value={summary.adherence || 0}
//                 className="h-5 rounded-full bg-gray-200"
//               />
//             </CardContent>
//           </Card>
//         </motion.div>

//         {/* Upcoming Doses Card */}
//         <motion.div
//           initial={{ opacity: 0, y: 25 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5, delay: 0.1 }}
//         >
//           <Card className="rounded-3xl shadow-xl border border-gray-200 hover:shadow-2xl transform hover:-translate-y-1 transition">
//             <CardHeader className="flex items-center gap-3">
//               <Calendar className="w-7 h-7 text-green-600" />
//               <CardTitle className="text-lg font-semibold">
//                 Upcoming Doses
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               {(summary.upcoming ?? []).map((dose, idx) => (
//                 <div
//                   key={idx}
//                   className={`flex justify-between items-center py-2 px-3 mb-2 rounded-lg transition transform hover:scale-105 ${
//                     new Date(dose.scheduledAt).toISOString().split("T")[0] ===
//                     today
//                       ? "bg-green-100"
//                       : "bg-gray-100 hover:bg-gray-200"
//                   }`}
//                 >
//                   <span className="font-medium flex items-center gap-2">
//                     <span
//                       className={`w-3 h-3 rounded-full ${
//                         dose.schedule?.color || "bg-blue-400"
//                       }`}
//                     />
//                     {dose.schedule?.name}
//                     <span className="text-gray-400 text-xs ml-1">
//                       ({formatTimeRemaining(dose.scheduledAt)})
//                     </span>
//                   </span>
//                   <span className="text-gray-500 text-sm md:text-base">
//                     {new Date(dose.scheduledAt).toLocaleTimeString([], {
//                       hour: "2-digit",
//                       minute: "2-digit",
//                     })}
//                   </span>
//                 </div>
//               ))}
//               {(!summary.upcoming || summary.upcoming.length === 0) && (
//                 <p className="text-gray-400 text-sm mt-2">No upcoming doses</p>
//               )}
//             </CardContent>
//           </Card>
//         </motion.div>

//         {/* Missed Doses Card */}
//         <motion.div
//           initial={{ opacity: 0, y: 30 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5, delay: 0.2 }}
//         >
//           <Card className="rounded-3xl shadow-xl border border-gray-200 hover:shadow-2xl transform hover:-translate-y-1 transition">
//             <CardHeader className="flex items-center gap-3">
//               <AlertTriangle className="w-7 h-7 text-red-600" />
//               <CardTitle className="text-lg font-semibold">
//                 Missed Doses
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p className="text-3xl md:text-4xl font-bold text-red-500">
//                 {summary.trends?.reduce((a, c) => a + c.missed, 0) || 0}
//               </p>
//               <p className="text-gray-500 text-sm md:text-base">
//                 Missed in the last 7 days
//               </p>
//             </CardContent>
//           </Card>
//         </motion.div>
//       </div>

//       {/* Charts: Side by Side */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//         {/* Weekly Adherence Line Chart */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//         >
//           <Card className="rounded-2xl shadow-lg border border-gray-200 p-4">
//             <CardHeader>
//               <CardTitle className="text-lg font-semibold mb-3">
//                 Weekly Adherence (%)
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="w-full h-64 md:h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <LineChart data={adherenceData}>
//                     <XAxis
//                       dataKey="date"
//                       tickFormatter={(date) =>
//                         new Date(date).toLocaleDateString(undefined, {
//                           month: "short",
//                           day: "numeric",
//                         })
//                       }
//                     />
//                     <YAxis />
//                     <Tooltip
//                       formatter={(value) => [`${value}%`, "Adherence"]}
//                     />
//                     <Line
//                       type="monotone"
//                       dataKey="adherence"
//                       stroke="#22c55e"
//                       strokeWidth={3}
//                     />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </CardContent>
//           </Card>
//         </motion.div>

//         {/* Dose Trends Bar Chart */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6 }}
//         >
//           <Card className="rounded-3xl shadow-xl border border-gray-200 p-4">
//             <CardHeader>
//               <CardTitle className="text-lg font-semibold mb-3">
//                 Dose Trends (Last 7 Days)
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="w-full h-64 md:h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={summary.trends} barCategoryGap="20%">
//                     <XAxis
//                       dataKey="date"
//                       tickFormatter={(date) =>
//                         new Date(date).toLocaleDateString(undefined, {
//                           month: "short",
//                           day: "numeric",
//                         })
//                       }
//                     />
//                     <YAxis />
//                     <Tooltip />
//                     <Legend verticalAlign="top" height={36} />
//                     <Bar dataKey="taken" fill="#22c55e" radius={[8, 8, 0, 0]} />
//                     <Bar
//                       dataKey="missed"
//                       fill="#ef4444"
//                       radius={[8, 8, 0, 0]}
//                     />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </CardContent>
//           </Card>
//         </motion.div>
//       </div>

//       {/* Dose Logs Button */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//         className="flex justify-center"
//       >
//         <Button
//           className="bg-slate-900 text-white hover:bg-slate-700 transition px-6 py-3 rounded-full shadow-lg text-lg md:text-xl flex items-center gap-2"
//           onClick={() => navigate("/doselog")}
//         >
//           <BarChart2 className="w-5 h-5" /> View Dose Logs
//         </Button>
//       </motion.div>
//     </div>
//   );
// };

// export default DashboardPage;

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Pill, Calendar, AlertTriangle, BarChart2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { useNavigate } from "react-router-dom";
//import {motion} from "framer-motion"; // for animation

// Sample data
const sampleData = {
  adherence: 85,
  upcoming: [
    {
      doseId: "1",
      scheduledAt: "2025-10-05T08:00:00Z",
      schedule: { name: "Vitamin D", color: "bg-yellow-400" },
    },
    {
      doseId: "2",
      scheduledAt: "2025-10-05T12:00:00Z",
      schedule: { name: "Aspirin", color: "bg-red-400" },
    },
    {
      doseId: "3",
      scheduledAt: "2025-10-05T18:00:00Z",
      schedule: { name: "Omega 3", color: "bg-blue-400" },
    },
    {
      doseId: "4",
      scheduledAt: "2025-10-06T08:00:00Z",
      schedule: { name: "Magnesium", color: "bg-green-400" },
    },
  ],
  trends: [
    { date: "2025-09-29", taken: 2, missed: 1 },
    { date: "2025-09-30", taken: 1, missed: 2 },
    { date: "2025-10-01", taken: 3, missed: 0 },
    { date: "2025-10-02", taken: 2, missed: 1 },
    { date: "2025-10-03", taken: 1, missed: 3 },
    { date: "2025-10-04", taken: 3, missed: 0 },
    { date: "2025-10-05", taken: 1, missed: 2 },
  ],
};

const getAdherenceColor = (value) => {
  if (value >= 80) return "bg-green-500";
  if (value >= 50) return "bg-yellow-400";
  return "bg-red-500";
};

const DashboardPage = () => {
  const [summary, setSummary] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setSummary(sampleData), 500);
  }, []);

  // const today = new Date().toISOString().split("T")[0];

  // const getAdherenceColor = (value) => {
  //   if (value >= 80) return "bg-green-500";
  //   if (value >= 50) return "bg-yellow-400";
  //   return "bg-red-500";
  // };

  // const formatTimeRemaining = (scheduledAt) => {
  //   const now = new Date();
  //   const target = new Date(scheduledAt);
  //   const diff = target - now;
  //   if (diff <= 0) return "Now";
  //   const hrs = Math.floor(diff / 1000 / 60 / 60);
  //   const mins = Math.floor((diff / 1000 / 60) % 60);
  //   return `${hrs}h ${mins}m`;
  // };

  // Prepare data for weekly adherence line chart
  const adherenceData = summary.trends?.map((d) => ({
    date: d.date,
    adherence: ((d.taken / (d.taken + d.missed)) * 100).toFixed(0),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6 md:p-8">
      {/* Header */}
      <motion.div
        className="mb-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          Monitor your medication adherence & trends
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8">
        {["Adherence", "Upcoming", "Missed"].map((type, idx) => {
          const cardData =
            type === "Adherence"
              ? {
                  value: summary.adherence,
                  icon: <Pill className="w-7 h-7 text-blue-600" />,
                  color: getAdherenceColor(summary.adherence),
                }
              : type === "Upcoming"
              ? {
                  value: summary.upcoming?.length,
                  icon: <Calendar className="w-7 h-7 text-green-600" />,
                }
              : {
                  value: summary.trends?.reduce((a, c) => a + c.missed, 0),
                  icon: <AlertTriangle className="w-7 h-7 text-red-600" />,
                };

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.2 }}
            >
              <Card className="rounded-3xl shadow-xl border border-gray-200 hover:shadow-2xl transform hover:-translate-y-1 transition">
                <CardHeader className="flex items-center gap-3">
                  {cardData.icon}
                  <CardTitle className="text-lg font-semibold">
                    {type === "Adherence"
                      ? "Adherence"
                      : type === "Upcoming"
                      ? "Upcoming Doses"
                      : "Missed Doses"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {type === "Adherence" && (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-700 text-lg md:text-xl">
                          {parseFloat(summary.adherence) || 0}%
                        </span>
                        <span
                          className={`px-3 py-1 text-xs md:text-sm font-semibold rounded-full text-white ${cardData.color}`}
                        >
                          {parseFloat(summary.adherence) >= 80
                            ? "Excellent"
                            : parseFloat(summary.adherence) >= 50
                            ? "Moderate"
                            : "Poor"}
                        </span>
                      </div>
                      <Progress
                        value={parseFloat(summary.adherence) || 0}
                        className="h-5 rounded-full bg-gray-200"
                      />
                    </>
                  )}
                  {type === "Upcoming" && (
                    <div className="flex space-x-4 overflow-x-auto py-1">
                      {summary.upcoming?.map((dose, idx) => (
                        <div
                          key={idx}
                          className={`flex-shrink-0 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-2 transition transform hover:scale-105`}
                        >
                          <span
                            className={`w-3 h-3 rounded-full ${
                              dose.schedule?.color || "bg-blue-400"
                            } inline-block mr-2`}
                          ></span>
                          {dose.schedule?.name}
                        </div>
                      ))}
                    </div>
                  )}
                  {type === "Missed" && (
                    <p className="text-3xl md:text-4xl font-bold text-red-500">
                      {cardData.value || 0}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Adherence Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
        >
          <Card className="rounded-2xl shadow-lg border border-gray-200 p-4">
            <CardHeader>
              <CardTitle className="text-lg font-semibold mb-3">
                Weekly Adherence (%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={adherenceData}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      tickFormatter={(date) =>
                        new Date(date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#f3f4f6",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        padding: "8px 12px",
                      }}
                      formatter={(value) => [`${value}%`, "Adherence"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="adherence"
                      stroke="#22c55e"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Dose Trends Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.6,
            type: "spring",
            stiffness: 80,
            damping: 12,
          }}
        >
          <Card className="rounded-3xl shadow-xl border border-gray-200 p-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold mb-4">
                Dose Trends (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-72 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summary.trends}
                    margin={{ top: 20, right: 20, left: 20, bottom: 12 }}
                    barCategoryGap="20%"
                    onClick={(data) => {
                      if (data && data.activeLabel) {
                        navigate(`/doselog?date=${data.activeLabel}`);
                      }
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="takenGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#22c55e"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor="#86efac"
                          stopOpacity={0.6}
                        />
                      </linearGradient>
                      <linearGradient
                        id="missedGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#ef4444"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor="#fca5a5"
                          stopOpacity={0.6}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 13, fill: "#6b7280", fontWeight: 600 }}
                      tickFormatter={(date) =>
                        new Date(date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis
                      tick={{ fontSize: 13, fill: "#6b7280", fontWeight: 600 }}
                    />
                    <Tooltip
                      cursor={{ fill: "#f3f4f6" }}
                      contentStyle={{
                        backgroundColor: "#f3f4f6",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        fontSize: 14,
                        padding: "8px 12px",
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar
                      dataKey="taken"
                      fill="url(#takenGradient)"
                      radius={[8, 8, 0, 0]}
                      barSize={28}
                    />
                    <Bar
                      dataKey="missed"
                      fill="url(#missedGradient)"
                      radius={[8, 8, 0, 0]}
                      barSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Reports Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center"
      >
        <Button
          className="bg-slate-900 text-white hover:bg-slate-700 transition px-6 py-3 rounded-full shadow-lg text-lg md:text-xl flex items-center gap-2"
          onClick={() => navigate("/dose-logs")}
        >
          <BarChart2 className="w-5 h-5" /> View Dose Logs
        </Button>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
