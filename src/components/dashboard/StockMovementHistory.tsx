import React, { useEffect, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, History, RefreshCw } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import axios from "../../api/axiosInstance";

type StockMovement = {
  _id?: string;
  materialId?: string;
  materialName?: string;
  type?: "IN" | "OUT" | string;
  quantity?: number;
  balanceAfter?: number;
  source?: string;
  note?: string;
  createdAt?: string;
};

const StockMovementHistory: React.FC = () => {
  const { isDark } = useTheme();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/stock-movements");
      const data = res.data?.data || res.data || [];
      setMovements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load stock movements", err);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, []);

  const getTypeBadge = (type?: string) => {
    if (type === "IN") {
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    }
    if (type === "OUT") {
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    }
    return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleString();
  };

  return (
    <div
      className={`p-6 rounded-xl border transition-colors duration-300 ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <History className="w-6 h-6 text-orange-500" />
          <div>
            <h2 className="text-xl font-semibold">Stock Movement History</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View all inventory in/out transactions
            </p>
          </div>
        </div>

        <button
          onClick={loadMovements}
          className="flex items-center px-3 py-2 text-white bg-orange-500 rounded-lg hover:bg-orange-600"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Movements</p>
          <p className="text-2xl font-bold">{movements.length}</p>
        </div>

        <div className="p-4 rounded-lg bg-green-50 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Stock In</p>
          <p className="text-2xl font-bold">
            {movements.filter((m) => m.type === "IN").length}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-red-50 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Stock Out</p>
          <p className="text-2xl font-bold">
            {movements.filter((m) => m.type === "OUT").length}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-500">Loading stock movements...</div>
      ) : movements.length === 0 ? (
        <div className="py-10 text-center text-gray-500">No stock movements found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                <th className="px-4 py-3 text-sm font-semibold text-left">Type</th>
                <th className="px-4 py-3 text-sm font-semibold text-left">Material</th>
                <th className="px-4 py-3 text-sm font-semibold text-left">Quantity</th>
                <th className="px-4 py-3 text-sm font-semibold text-left">Balance After</th>
                <th className="px-4 py-3 text-sm font-semibold text-left">Source</th>
                <th className="px-4 py-3 text-sm font-semibold text-left">Note</th>
                <th className="px-4 py-3 text-sm font-semibold text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement, index) => (
                <tr
                  key={movement._id || index}
                  className={`border-b transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    isDark ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(
                        movement.type
                      )}`}
                    >
                      {movement.type === "IN" ? (
                        <ArrowDownCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <ArrowUpCircle className="w-3 h-3 mr-1" />
                      )}
                      {movement.type || "-"}
                    </span>
                  </td>

                  <td className="px-4 py-4 font-medium">
                    {movement.materialName || "Unknown Material"}
                  </td>

                  <td className="px-4 py-4">{Number(movement.quantity || 0)}</td>

                  <td className="px-4 py-4">{Number(movement.balanceAfter || 0)}</td>

                  <td className="px-4 py-4 capitalize">{movement.source || "-"}</td>

                  <td className="px-4 py-4">{movement.note || "-"}</td>

                  <td className="px-4 py-4 text-sm text-gray-500">
                    {formatDate(movement.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StockMovementHistory;