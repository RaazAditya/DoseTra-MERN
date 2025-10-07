import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addMedicine,
  fetchMedicines,
  deleteMedicine,
} from "../features/medicineSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Trash2, PlusCircle } from "lucide-react";

const MedicinePage = () => {
  const dispatch = useDispatch();
  const { medicines, loading } = useSelector((state) => state.medicine);

  const [form, setForm] = useState({
    name: "",
    dosage: "",
    formType: "tablet",
    frequency: "Once a day",
    instructions: "",
  });

  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchMedicines());
    console.log("hy")
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.dosage || !form.frequency) return;

    dispatch(addMedicine(form)).then(() => {
      dispatch(fetchMedicines());
      setForm({
        name: "",
        dosage: "",
        formType: "tablet",
        frequency: "Once a day",
        instructions: "",
      });
      setDialogOpen(false); // Close dialog safely
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-2">
          My Medicines
        </h1>
        <p className="text-slate-600 text-lg">
          Track and manage your medicines easily
        </p>
      </div>

      {/* Add Medicine Button / Dialog */}
      <div className="flex justify-center">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg">
              <PlusCircle /> Add Medicine
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg bg-slate-900 text-white rounded-2xl p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <PlusCircle /> Add New Medicine
              </DialogTitle>
            </DialogHeader>
            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"
              onSubmit={handleSubmit}
            >
              <Input
                placeholder="Medicine Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-slate-800 text-white"
                required
              />
              <Input
                placeholder="Dosage (e.g. 500mg)"
                value={form.dosage}
                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                className="bg-slate-800 text-white"
                required
              />
              <Select
                value={form.formType}
                onValueChange={(val) => setForm({ ...form, formType: val })}
              >
                <SelectTrigger className="bg-slate-800 text-white">
                  {form.formType}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tablet">Tablet</SelectItem>
                  <SelectItem value="capsule">Capsule</SelectItem>
                  <SelectItem value="syrup">Syrup</SelectItem>
                  <SelectItem value="injection">Injection</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={form.frequency}
                onValueChange={(val) => setForm({ ...form, frequency: val })}
              >
                <SelectTrigger className="bg-slate-800 text-white">
                  {form.frequency}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Once a day">Once a day</SelectItem>
                  <SelectItem value="Twice a day">Twice a day</SelectItem>
                  <SelectItem value="Thrice a day">Thrice a day</SelectItem>
                  <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Instructions"
                value={form.instructions}
                onChange={(e) =>
                  setForm({ ...form, instructions: e.target.value })
                }
                className="col-span-1 md:col-span-2"
              />
              <Button
                type="submit"
                disabled={loading}
                className="col-span-1 md:col-span-2 mt-2"
              >
                {loading ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  "Add Medicine"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Medicines Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {!medicines || loading ? (
          <p className="text-center col-span-full text-slate-400">Loading...</p>
        ) : medicines.length === 0 ? (
          <p className="text-center col-span-full text-slate-400">
            No medicines added yet.
          </p>
        ) : (
          medicines.map((med, index) => (
            <div
              key={med._id || index} // fixed: unique key
              className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl hover:scale-105 transition-transform"
            >
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-slate-300">{med.name}</h2>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() =>
                    dispatch(deleteMedicine(med._id)).then(() =>
                      dispatch(fetchMedicines())
                    )
                  }
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              <p className="mt-2">
                <span className="text-white font-semibold">Dosage: </span>
                <span className="text-slate-300">{med.dosage}</span>
              </p>
              <div className="flex flex-wrap mt-2 gap-2">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                  {med.form}
                </span>
                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">
                  {med.frequency}
                </span>
              </div>
              {med.instructions && (
                <p className="mt-2">
                  <span className="text-white font-semibold">
                    Instructions:{" "}
                  </span>
                  <span className="text-slate-400">{med.instructions}</span>
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MedicinePage;
