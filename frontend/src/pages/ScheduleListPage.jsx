import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Plus, Search, Trash } from "lucide-react";
import { Button } from "../components/ui/button";
import axios from "axios";
import { motion } from "framer-motion";

export default function ScheduleListPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchedules = async () => {
      const token = localStorage.getItem("token");
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:7000/api/schedules", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSchedules(
          Array.isArray(res.data) ? res.data : res.data.schedules || []
        );
      } catch (err) {
        console.error(err);
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this schedule?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:7000/api/schedules/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchedules((prev) =>
        prev.map((sch) => (sch._id === id ? { ...sch, active: false } : sch))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to delete schedule.");
    }
  };

  const filteredSchedules = schedules
    .filter((sch) => (sch.medicineId?.name || "").toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((sch) => (filter ? (sch.medicineId?.form || "").toLowerCase() === filter.toLowerCase() : true));

  const totalPages = Math.ceil(filteredSchedules.length / pageSize);
  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function Pagination() {
    if (totalPages <= 1) return null;
    return (
      <div className="flex gap-2 flex-wrap justify-center">
        <button
          onClick={() => setCurrentPage((idx) => Math.max(idx - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded hover:bg-gray-200 disabled:opacity-50"
        >
          Prev
        </button>
        {Array.from({ length: totalPages }, (_, idx) => (
          <button
            key={idx + 1}
            className={`px-3 py-1 rounded text-sm ${
              currentPage === idx + 1 ? "bg-indigo-600 text-white font-semibold" : "bg-gray-200 text-gray-600"
            }`}
            onClick={() => setCurrentPage(idx + 1)}
          >
            {idx + 1}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage((idx) => Math.min(idx + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded hover:bg-gray-200 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-6 px-2 sm:px-4 md:px-6">
      <div className="min-h-[calc(100vh-120px)] flex flex-col max-w-6xl mx-auto">
        {/* Header & Search */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Your Schedules</h1>
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium mt-2 sm:mt-0">
              {schedules.length} total
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search medicines"
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 bg-white text-gray-800 transition text-sm w-full sm:w-56"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none w-full sm:w-auto"
            >
              <option value="">All forms</option>
              <option value="tablet">Tablet</option>
              <option value="capsule">Capsule</option>
              <option value="syrup">Syrup</option>
              <option value="injection">Injection</option>
            </select>
            <Button
              onClick={() => navigate("/schedules/new")}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white shadow-md justify-center w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" /> Add Schedule
            </Button>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-lg overflow-x-auto border border-gray-100"
        >
          {loading ? (
            <div className="p-12 text-center text-gray-400 animate-pulse text-lg">Loading schedules...</div>
          ) : filteredSchedules.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <span className="block text-2xl mb-4">📋</span>
              <span>No schedules match your search or filter.</span>
            </div>
          ) : (
            <table className="w-full min-w-max bg-white rounded shadow-sm text-sm sm:text-base">
              <thead className="bg-gray-100/80">
                <tr>
                  <th className="p-3 text-left">Medicine</th>
                  <th className="p-3 text-left">Form</th>
                  <th className="p-3 text-left">Dosage</th>
                  <th className="p-3 text-left">Frequency</th>
                  <th className="p-3 text-left">Times</th>
                  <th className="p-3 text-left">Start Date</th>
                  <th className="p-3 text-left">End Date</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSchedules.map((sch, i) => (
                  <motion.tr
                    key={sch._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`border-b transition-colors ${
                      sch.active ? "hover:bg-indigo-50/60" : "bg-gray-50/70 opacity-70"
                    }`}
                  >
                    <td className={`p-3 ${!sch.active ? "line-through" : ""}`}>{sch.medicineId?.name || "-"}</td>
                    <td className={`p-3 ${!sch.active ? "line-through" : ""}`}>{sch.medicineId?.form || "-"}</td>
                    <td className={`p-3 ${!sch.active ? "line-through" : ""}`}>{sch.dosage}</td>
                    <td className={`p-3 ${!sch.active ? "line-through" : ""}`}>{sch.frequency}</td>
                    <td className={`p-3 ${!sch.active ? "line-through" : ""}`}>{sch.times?.join(", ")}</td>
                    <td className={`p-3 ${!sch.active ? "line-through" : ""}`}>{sch.startDate ? new Date(sch.startDate).toLocaleDateString() : "-"}</td>
                    <td className={`p-3 ${!sch.active ? "line-through" : ""}`}>{sch.endDate ? new Date(sch.endDate).toLocaleDateString() : "-"}</td>
                    <td className={`p-3 font-semibold ${sch.active ? "text-green-600" : "text-red-400"}`}>{sch.active ? "Active" : "Inactive"}</td>
                    <td className="p-3 flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className={`focus:ring-2 focus:ring-indigo-400 ${!sch.active ? "text-gray-400 border-gray-200 cursor-not-allowed hover:bg-none" : "hover:bg-indigo-50 hover:text-indigo-700"}`}
                        onClick={() => sch.active && navigate(`/schedules/edit/${sch._id}`)}
                        title="Edit"
                        disabled={!sch.active}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`focus:ring-2 focus:ring-red-300 ${!sch.active ? "text-gray-400 border-gray-200 cursor-not-allowed hover:bg-none" : "border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"}`}
                        onClick={() => sch.active && handleDelete(sch._id)}
                        title="Delete"
                        disabled={!sch.active}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>

        <div className="flex justify-center mt-6">
          <Pagination />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-6">
          <Button
            className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 w-full sm:w-auto"
            onClick={() => alert("Export to CSV")}
          >
            Export CSV
          </Button>
          <Button
            className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 w-full sm:w-auto"
            onClick={() => window.print()}
          >
            Print List
          </Button>
        </div>
      </div>
    </div>
  );
}
