import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Edit, Trash, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMedicines, deleteMedicine } from "@/features/api/medicineApi";
import { motion } from "framer-motion";


const MedicineListPage = () => {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;


  const navigate = useNavigate();


  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const data = await getMedicines();
      setMedicines(Array.isArray(data) ? data : []);
    } catch (error) {
      alert("Failed to fetch medicines");
      setMedicines([]);
    } finally {
        setLoading(false);
    }
  };


  useEffect(() => {
    fetchMedicines();
    setCurrentPage(1);
  }, []);


  const filteredMedicines = medicines.filter(
    (m) =>
      (!search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.dosage.toLowerCase().includes(search.toLowerCase()) ||
        m.form.toLowerCase().includes(search.toLowerCase())) &&
      (!filter || m.form === filter)
  );


  const totalPages = Math.ceil(filteredMedicines.length / pageSize);
  const paginatedMedicines = filteredMedicines.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );


  // Pagination component
  function Pagination() {
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
            className={`px-3 py-1 rounded  ${
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
  }


  // Delete Handler
  const handleDelete = async (_id) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      try {
        await deleteMedicine(_id);
        fetchMedicines();
      } catch (err) {
        alert("Failed to delete medicine");
      }
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-6 px-4 sm:px-6">
      <div className="min-h-[calc(100vh-120px)] flex flex-col max-w-6xl mx-auto">
        {/* Header & Search */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
        >
          <div className="flex items-center gap-2 mb-2 md:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Your Medicines
            </h1>
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
              {medicines.length} total
            </span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search medicines"
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 bg-white text-gray-800 transition text-sm"
                aria-label="Search medicines"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none"
              aria-label="Filter by form"
            >
              <option value="">All forms</option>
              <option value="tablet">Tablet</option>
              <option value="capsule">Capsule</option>
              <option value="syrup">Syrup</option>
              <option value="injection">Injection</option>
            </select>
            <Button
              onClick={() => navigate("/medicine-form")}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white shadow-md"
            >
              <Plus className="w-4 h-4" /> Add Medicine
            </Button>
          </div>
        </motion.div>


        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
        >
          {loading ? (
            <div className="p-12 text-center text-gray-400 animate-pulse text-lg">
              Loading medicines...
            </div>
          ) : filteredMedicines.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <span className="block text-2xl mb-4">🩺</span>
              <span>No medicines match your search or filter.</span>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-100/80">
                <TableRow>
                  <TableCell className="font-semibold text-gray-700">
                    Name
                  </TableCell>
                  <TableCell className="font-semibold text-gray-700">
                    Form
                  </TableCell>
                  <TableCell className="font-semibold text-gray-700">
                    Dosage
                  </TableCell>
                  <TableCell className="font-semibold text-gray-700">
                    Frequency
                  </TableCell>
                  <TableCell className="font-semibold text-gray-700">
                    Instructions
                  </TableCell>
                  <TableCell className="font-semibold text-gray-700 text-center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>


              <TableBody>
                {paginatedMedicines.map((med, i) => (
                  <motion.tr
                    key={med.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-indigo-50/60 transition-colors"
                  >
                    <TableCell className="py-2 px-3 text-sm font-medium flex items-center gap-1">
                      {med.name}{" "}
                    </TableCell>
                    <TableCell className="capitalize">{med.form}</TableCell>
                    <TableCell>{med.dosage}</TableCell>
                    <TableCell>{med.frequency}</TableCell>
                    <TableCell>{med.instructions || "-"}</TableCell>
                    <TableCell className="flex gap-3 justify-center py-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-indigo-50 hover:text-indigo-700 focus:ring-2 focus:ring-indigo-400"
                        onClick={() => navigate(`/medicine-form/${med.id}`)}
                        aria-label="Edit medicine"
                        tabIndex={0}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600 focus:ring-2 focus:ring-red-300"
                        onClick={() => handleDelete(med._id)}
                        aria-label="Delete medicine"
                        tabIndex={0}
                        title="Delete"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </motion.div>
        <div className="flex justify-center mt-6">
          <Pagination />
        </div>


        <div className="flex justify-end gap-4 mt-6">
          <Button
            className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
            onClick={() => alert("Export to CSV")}
          >
            Export CSV
          </Button>
          <Button
            className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
            onClick={() => window.print()}
          >
            Print List
          </Button>
        </div>
      </div>
    </div>
  );
};


export default MedicineListPage;