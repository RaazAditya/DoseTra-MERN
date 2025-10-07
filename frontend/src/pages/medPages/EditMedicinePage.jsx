import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMedicineById, updateMedicine } from "@/features/api/medicineApi";
import { Button } from "@/components/ui/button";

const EditMedicinePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [medicine, setMedicine] = useState({
    name: "",
    dosage: "",
    form: "tablet",
    frequency: "",
    instructions: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        setLoading(true);
        const data = await getMedicineById(id);
        setMedicine({
          name: data.name || "",
          dosage: data.dosage || "",
          form: data.form || "tablet",
          frequency: data.frequency || "",
          instructions: data.instructions || "",
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load medicine");
      } finally {
        setLoading(false);
      }
    };
    fetchMedicine();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMedicine((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!medicine.name || !medicine.dosage || !medicine.frequency) {
      setError("Name, dosage, and frequency are required");
      return;
    }
    try {
      setSaving(true);
      await updateMedicine(id, medicine);
      alert("Medicine updated successfully");
      navigate("/medicines");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update medicine");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading medicine details...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md md:max-w-lg bg-white rounded-2xl shadow-md p-6 md:p-10">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Edit Medicine
        </h2>
        {error && (
          <p className="mb-6 text-center text-red-600 font-medium">{error}</p>
        )}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          noValidate
        >
          <div className="col-span-1">
            <label
              htmlFor="name"
              className="block font-semibold mb-2 text-gray-700"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              value={medicine.name}
              onChange={handleChange}
              required
              className="w-full rounded border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Medicine name"
              autoComplete="off"
            />
          </div>

          <div className="col-span-1">
            <label
              htmlFor="dosage"
              className="block font-semibold mb-2 text-gray-700"
            >
              Dosage <span className="text-red-500">*</span>
            </label>
            <input
              id="dosage"
              name="dosage"
              value={medicine.dosage}
              onChange={handleChange}
              required
              className="w-full rounded border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="e.g., 500mg"
              autoComplete="off"
            />
          </div>

          <div className="col-span-1">
            <label
              htmlFor="form"
              className="block font-semibold mb-2 text-gray-700"
            >
              Form
            </label>
            <select
              id="form"
              name="form"
              value={medicine.form}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="tablet">Tablet</option>
              <option value="capsule">Capsule</option>
              <option value="syrup">Syrup</option>
              <option value="injection">Injection</option>
            </select>
          </div>

          <div className="col-span-1">
            <label
              htmlFor="frequency"
              className="block font-semibold mb-2 text-gray-700"
            >
              Frequency <span className="text-red-500">*</span>
            </label>
            <input
              id="frequency"
              name="frequency"
              value={medicine.frequency}
              onChange={handleChange}
              required
              className="w-full rounded border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="e.g., Twice a day"
              autoComplete="off"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label
              htmlFor="instructions"
              className="block font-semibold mb-2 text-gray-700"
            >
              Instructions
            </label>
            <textarea
              id="instructions"
              name="instructions"
              value={medicine.instructions}
              onChange={handleChange}
              rows={5}
              className="w-full rounded border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="Additional instructions"
            />
          </div>

          <div className="col-span-1 md:col-span-2 flex justify-end gap-4 mt-2">
            <Button
              type="button"
              variant="outline"
              className="px-6 py-3 border rounded bg-gray-100 hover:bg-gray-300"
              onClick={() => navigate("/medicines")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="px-6 py-3">
              {saving ? "Saving..." : "Update Medicine"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMedicinePage;
