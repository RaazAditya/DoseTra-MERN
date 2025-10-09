import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Plus, Search, Trash } from "lucide-react";
import { Button } from "../components/ui/button";
import axios from "axios"; // Backend integration

export default function ScheduleListPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("");
  const pageSize = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchedules = async () => {
      // get token from localStorage (or wherever you store it)
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
    if (!window.confirm("Are you sure you want to delete this schedule?"))
      return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:7000/api/schedules/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
       // Update frontend immediately
      setSchedules((prev) =>
      prev.map((sch) =>
        sch._id === id ? { ...sch, active: false } : sch
      )
    );
    } catch (err) {
      console.error(err);
      alert("Failed to delete schedule.");
    }
  };

  // Filtering
  const filteredSchedules = schedules
    .filter((sch) => {
      const medName = sch.medicineId?.name || "";
      return medName.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .filter((sch) => {
      const medForm = sch.medicineId?.form || "";
      return filter ? medForm.toLowerCase() === filter.toLowerCase() : true;
    });

  // Pagination
  const totalPages = Math.ceil(filteredSchedules.length / pageSize);
  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const Pagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex gap-2">
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
            className={`px-3 py-1 rounded ${
              currentPage === idx + 1
                ? "bg-indigo-600 text-white font-semibold"
                : "bg-gray-200 text-gray-600"
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
  };

  return (
    <div className="min-h-screen p-8 bg-slate-100">
      {/* Top controls */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2 mb-2 md:mb-0">
          <h1 className="text-3xl font-bold text-gray-800">Your Schedules</h1>
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
            {schedules.length} total
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search medicines"
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 bg-white text-gray-800 transition text-sm"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none"
          >
            <option value="">All forms</option>
            <option value="tablet">Tablet</option>
            <option value="capsule">Capsule</option>
            <option value="syrup">Syrup</option>
            <option value="injection">Injection</option>
          </select>
          <Button
            onClick={() => navigate("/schedules/new")}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Schedule
          </Button>
        </div>
      </div>

      {loading ? (
        <p>Loading schedules...</p>
      ) : filteredSchedules.length === 0 ? (
        <p>No schedules found.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded shadow">
              <thead className="bg-slate-200">
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
                {paginatedSchedules.map((sch) => (
                  <tr
                    key={sch._id}
                    className={`border-b transition-all ${
                      sch.active
                        ? "hover:bg-indigo-50/60"
                        : "bg-gray-50/70 opacity-70" // lighter & semi-transparent
                    }`}
                  >
                    <td className={`p-3 ${!sch.active ? "line-through" : ""}`}>
                      {sch.medicineId?.name || "-"}
                    </td>
                    <td className={`p-3 ${!sch.active ? "line-through" : ""}`}>
                      {sch.medicineId?.form || "-"}
                    </td>
                    <td className={`p-3 ${!sch.active ? "line-through" : ""}`}>
                      {sch.dosage}
                    </td>
                    <td className={`p-3 ${!sch.active ? "line-through" : ""}`}>
                      {sch.frequency}
                    </td>
                    <td className={`p-3 ${!sch.active ? "line-through" : ""}`}>
                      {sch.times?.join(", ")}
                    </td>
                    <td className={`p-3 ${!sch.active ? "line-through" : ""}`}>
                      {sch.startDate
                        ? new Date(sch.startDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className={`p-3 ${!sch.active ? "line-through" : ""}`}>
                      {sch.endDate
                        ? new Date(sch.endDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td
                      className={`p-3 font-semibold ${
                        sch.active ? "text-green-600" : "text-red-400"
                      }`}
                    >
                      {sch.active ? "Active" : "Inactive"}
                    </td>
                    <td className="p-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className={`focus:ring-2 focus:ring-indigo-400 ${
                          !sch.active
                            ? "text-gray-400 border-gray-200 cursor-not-allowed hover:bg-none"
                            : "hover:bg-indigo-50 hover:text-indigo-700"
                        }`}
                        onClick={() =>
                          sch.active && navigate(`/schedules/edit/${sch._id}`)
                        }
                        title="Edit"
                        disabled={!sch.active}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`focus:ring-2 focus:ring-red-300 ${
                          !sch.active
                            ? "text-gray-400 border-gray-200 cursor-not-allowed hover:bg-none"
                            : "border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
                        }`}
                        onClick={() => sch.active && handleDelete(sch._id)}
                        title="Delete"
                        disabled={!sch.active}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-center">
            <Pagination />
          </div>

          <div className="flex gap-2 flex-wrap justify-end mt-4">
            <button
              onClick={() => alert("Export CSV functionality pending")}
              className="px-4 py-2 bg-purple-200 rounded hover:bg-purple-300"
            >
              Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-purple-200 rounded hover:bg-purple-300"
            >
              Print List
            </button>
          </div>
        </>
      )}
    </div>
  );
}
