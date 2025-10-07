import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ScheduleFormPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    medicineName: "",
    time: "",
    status: "active",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("/api/schedules", form);
      alert("Schedule added successfully!");
      navigate("/schedules"); // redirect to the main list page
    } catch (err) {
      console.error("Error adding schedule:", err);
      alert("Failed to add schedule!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white-800 text-white">
      <div className="bg-slate-700/70 backdrop-blur-md shadow-2xl rounded-2xl p-8 w-full max-w-md border border-slate-600">
        <h1 className="text-2xl font-bold text-center mb-6">
          ➕ Add New Medicine Schedule
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Medicine Name */}
          <div>
            <label className="block text-gray-200 font-medium mb-1">
              Medicine Name
            </label>
            <input
              type="text"
              name="medicineName"
              value={form.medicineName}
              onChange={handleChange}
              required
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Paracetamol"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-gray-200 font-medium mb-1">
              Time
            </label>
            <input
              type="datetime-local"
              name="time"
              value={form.time}
              onChange={handleChange}
              required
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-gray-200 font-medium mb-1">
              Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-between items-center mt-6">
            <button
              type="button"
              onClick={() => navigate("/schedules")}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              {loading ? "Saving..." : "Save Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
