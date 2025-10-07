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

  // Dummy data commented out
  /*
  const dummySchedules = Array.from({ length: 25 }, (_, i) => ({
    _id: (i + 1).toString(),
    scheduleId: `sch-${i + 1}`,
    medicineId: { _id: `m${i + 1}`, name: `Medicine ${i + 1}`, type: "Tablet" },
    dosage: `${500 + i}mg`,
    frequency: i % 2 === 0 ? "Twice a day" : "Once a day",
    times: ["08:00", "20:00"],
    startDate: "2025-10-01T00:00:00.000Z",
    endDate: "2025-10-07T00:00:00.000Z",
    active: i % 2 === 0,
  }));
  */

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/schedules");
        setSchedules(Array.isArray(res.data) ? res.data : res.data.schedules || []);
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
    try {
      await axios.delete(`/api/schedules/${id}`);
      setSchedules((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete schedule.");
    }
  };

  // Filter schedules
  const filteredSchedules = schedules
    .filter((sch) =>
      sch.medicineId?.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((sch) =>
      filter ? sch.medicineId?.type.toLowerCase() === filter.toLowerCase() : true
    );

  const totalPages = Math.ceil(filteredSchedules.length / pageSize);
  const paginatedSchedule = filteredSchedules.slice(
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
            className={`px-3 py-1 rounded  ${
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
                {paginatedSchedule.map((sch) => (
                  <tr key={sch._id} className="border-b hover:bg-indigo-50/60">
                    <td className="p-3">{sch.medicineId?.name || "-"}</td>
                    <td className="p-3">{sch.dosage}</td>
                    <td className="p-3">{sch.frequency}</td>
                    <td className="p-3">{sch.times?.join(", ")}</td>
                    <td className="p-3">{new Date(sch.startDate).toLocaleDateString()}</td>
                    <td className="p-3">{new Date(sch.endDate).toLocaleDateString()}</td>
                    <td className="p-3">{sch.active ? "Active" : "Inactive"}</td>
                    <td className="p-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-indigo-50 hover:text-indigo-700 focus:ring-2 focus:ring-indigo-400"
                        onClick={() => navigate(`/schedules/edit/${sch._id}`)}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600 focus:ring-2 focus:ring-red-300"
                        onClick={() => handleDelete(sch._id)}
                        title="Delete"
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
