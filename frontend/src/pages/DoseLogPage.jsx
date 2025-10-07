import { useEffect, useState } from "react";
import axios from "axios";

export default function DoseLogPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    axios.get("/api/dose-logs").then(res => setLogs(res.data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dose History</h1>
      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log._id} className="bg-slate-800 p-4 rounded-lg">
            <p>{log.medicineName}</p>
            <p>Status: {log.status}</p>
            <p>{new Date(log.takenAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
