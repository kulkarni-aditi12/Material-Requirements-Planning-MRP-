import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface AlertItem {
  material: string;
  quantity: number;
}

const SmartAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const { isDark } = useTheme();

  useEffect(() => {
    fetch("http://localhost:5000/api/dashboard/alerts")
      .then((res) => res.json())
      .then((data) => {
        // Backend returns { alerts: [...] }
        if (Array.isArray(data.alerts)) {
          setAlerts(data.alerts);       // ✅ CORRECT
        } else {
          setAlerts([]);                // fallback
        }
      })
      .catch((err) => {
        console.error("Alerts fetch error:", err);
        setAlerts([]);
      });
  }, []);

  return (
    <div
      className={`p-6 rounded-xl border ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      <h2 className="flex items-center gap-2 mb-4 text-xl font-semibold">
        <AlertTriangle className="text-yellow-500" /> Smart Alerts
      </h2>

      {alerts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No alerts found.</p>
      ) : (
        <ul className="space-y-3">
          {alerts.map((item, idx) => (
            <li
              key={idx}
              className="p-3 text-yellow-800 bg-yellow-100 rounded-lg dark:bg-yellow-900 dark:text-yellow-300"
            >
              ⚠️ <strong>{item.material}</strong> is low — only{" "}
              <strong>{item.quantity}</strong> left
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SmartAlerts;
