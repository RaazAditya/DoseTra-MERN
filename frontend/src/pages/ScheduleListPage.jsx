import { useEffect, useState } from "react";
import axios from "axios";

export default function ScheduleListPage() {
  const [schedules, setSchedules] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch schedules from backend
//   useEffect(() => {
//     const fetchSchedules = async () => {
//       try {
//         const res = await axios.get("/api/schedules");
//         setSchedules(res.data);
//       } catch (err) {
//         console.error("Error fetching schedules:", err);
//       }
//     };
//     fetchSchedules();
useEffect(() => {
    // Dummy data (replace with API)
    setSchedules([
      { _id: 1, medicineName: "Paracetamol", time: new Date(), status: "active" },
      { _id: 2, medicineName: "Vitamin D", time: new Date(), status: "paused" },
      { _id: 3, medicineName: "Vitamin E", time: new Date(), status: "paused" },
      { _id: 4, medicineName: "Zinc Tablet", time: new Date(), status: "active" },
      { _id: 5, medicineName: "Omega 3", time: new Date(), status: "paused" },
      { _id: 1, medicineName: "Paracetamol", time: new Date(), status: "active" },
      { _id: 2, medicineName: "Vitamin D", time: new Date(), status: "paused" },
      { _id: 3, medicineName: "Vitamin E", time: new Date(), status: "paused" },
      { _id: 4, medicineName: "Zinc Tablet", time: new Date(), status: "active" },
      { _id: 5, medicineName: "Omega 3", time: new Date(), status: "paused" },
    ]);
  }, []);

  // Delete handler
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/schedules/${id}`);
      setSchedules((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error("Error deleting schedule:", err);
    }
  };

  // Update handler (placeholder)
  const handleUpdate = (id) => {
    alert(`Update schedule for ID: ${id}`);
  };

  //  Pagination
  const totalPages = Math.ceil(schedules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = schedules.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-slate-800 text-white px-6 py-4 shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold">Medicine Schedules</h1>
        <button
          onClick={() => (window.location.href = "/add-schedule")}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
        >
          + Add New
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-grow p-6">
        <div className="space-y-4 max-w-3xl mx-auto">
          {currentItems.length > 0 ? (
            currentItems.map((s) => (
              <div
                key={s._id}
                className="bg-gray-50 p-5 rounded-2xl shadow-md border-l-4 border-slate-400 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                     {s.medicineName}
                  </h2>
                  <span className="bg-blue-100 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                    {new Date(s.time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <p className="text-gray-600 mb-3">
                  Date:{" "}
                  {new Date(s.time).toLocaleDateString([], {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>

                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full ${
                    s.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {s.status}
                </span>

                <div className="flex gap-3 mt-3">
                  <button
                    onClick={() => handleUpdate(s._id)}
                    className="bg-blue-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => handleDelete(s._id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600 mt-10">
              No medicine schedules found.
            </p>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-6 gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className={`px-3 py-2 rounded-md ${
                currentPage === 1
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-slate-800 hover:bg-slate-700 text-white"
              }`}
            >
              Prev
            </button>

            <span className="text-gray-700 font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className={`px-3 py-2 rounded-md ${
                currentPage === totalPages
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-slate-800 hover:bg-slate-700 text-white"
              }`}
            >
              Next
            </button>
          </div>
        )}
      </main>

      
    </div>
  );
}
