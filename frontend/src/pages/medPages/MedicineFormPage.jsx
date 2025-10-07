import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { createMedicine, updateMedicine, getMedicineById } from "@/features/api/medicineApi";
import { Loader2, Pill } from "lucide-react";
import { motion } from "framer-motion";

const MedicineFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    form: "tablet",
    dosage: "",
    frequency: "",
    instructions: "",
  });
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (id) fetchMedicine();
    // eslint-disable-next-line
  }, [id]);

  const fetchMedicine = async () => {
    setLoading(true);
    try {
      const data = await getMedicineById(id);
      setFormData({
        name: data.name,
        form: data.form,
        dosage: data.dosage,
        frequency: data.frequency,
        instructions: data.instructions,
      });
    } catch (err) {
      alert("Failed to fetch medicine info");
    }
    setLoading(false);
  };

  const validate = data => {
    let errors = {};
    if (!data.name.trim()) errors.name = "Medicine name is required";
    if (!data.dosage.trim()) errors.dosage = "Dosage is required";
    if (!data.frequency.trim()) errors.frequency = "Frequency is required";
    return errors;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors((errs) => ({ ...errs, [e.target.name]: undefined })); // clear error
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate(formData);
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setSaving(true);
    try {
      if (id) await updateMedicine(id, formData);
      else await createMedicine(formData);
      navigate("/medicines");
    } catch (err) {
      alert("Failed to save medicine: " + (err?.message || ""));
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg rounded-2xl shadow-xl bg-white border border-gray-100 p-8 relative"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-100 text-indigo-600 rounded-full p-3 mb-3 shadow-sm">
            <Pill size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 mb-1 text-center tracking-tight">
            {id ? "Edit Medicine" : "Add Medicine"}
          </h1>
          <p className="text-gray-500 text-center text-sm">
            {id ? "Update your medicine details below." : "Enter precise medicine info to get the best reminders and tracking."}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-60">
            <Loader2 className="animate-spin w-8 h-8 text-indigo-400" />
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1 text-[15px] text-gray-700 font-semibold">Name</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Paracetamol"
              required
              className={`transition-shadow ${errors.name ? 'border-red-400 ring-1 ring-red-300' : 'focus:ring-indigo-300'}`}
            />
            <p className="text-xs text-gray-400 mt-1">Full name on prescription or packaging.</p>
            {errors.name && <p className="text-xs mt-1 text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block mb-1 text-[15px] text-gray-700 font-semibold">Form</label>
            <select
              name="form"
              value={formData.form}
              onChange={handleChange}
              className="w-full border focus:border-indigo-400 rounded-md px-3 py-2 text-gray-800 bg-white"
            >
              <option value="tablet">Tablet</option>
              <option value="capsule">Capsule</option>
              <option value="syrup">Syrup</option>
              <option value="injection">Injection</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">What form is this medicine?</p>
          </div>

          <div>
            <label className="block mb-1 text-[15px] text-gray-700 font-semibold">Dosage</label>
            <Input
              name="dosage"
              value={formData.dosage}
              onChange={handleChange}
              placeholder="e.g., 500mg"
              required
              className={`transition-shadow ${errors.dosage ? 'border-red-400 ring-1 ring-red-300' : 'focus:ring-indigo-300'}`}
            />
            <p className="text-xs text-gray-400 mt-1">E.g., 500mg, 1 tablet, etc.</p>
            {errors.dosage && <p className="text-xs mt-1 text-red-500">{errors.dosage}</p>}
          </div>

          <div>
            <label className="block mb-1 text-[15px] text-gray-700 font-semibold">Frequency</label>
            <Input
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              placeholder="e.g., Twice daily after meals"
              required
              className={`transition-shadow ${errors.frequency ? 'border-red-400 ring-1 ring-red-300' : 'focus:ring-indigo-300'}`}
            />
            <p className="text-xs text-gray-400 mt-1">How often? (e.g., Once daily, after lunch)</p>
            {errors.frequency && <p className="text-xs mt-1 text-red-500">{errors.frequency}</p>}
          </div>

          <div>
            <label className="block mb-1 text-[15px] text-gray-700 font-semibold">Instructions<span className="text-gray-400 text-xs font-normal"> (optional)</span></label>
            <Input
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              placeholder="E.g., After meals, with water"
              className={`transition-shadow focus:ring-indigo-300`}
            />
            <p className="text-xs text-gray-400 mt-1">Any extra notes or instructions from your doctor.</p>
          </div>

          <div className="flex flex-col gap-2 mt-7 sm:flex-row justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/medicines")}
              className="w-full sm:w-auto bg-gray-50 hover:bg-gray-100 hover:text-indigo-700"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto bg-gradient-to-tr from-slate-600 to-slate-800 hover:bg-slate-400 text-white font-semibold shadow-md transition-all"
            >
              {saving ? (<Loader2 className="animate-spin inline mr-2" />) : null}
              {id ? "Update" : "Add"}
            </Button>
          </div>
        </form>
        )}
      </motion.div>
    </div>
  );
};

export default MedicineFormPage;
