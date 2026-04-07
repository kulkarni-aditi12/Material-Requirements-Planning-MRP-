import React, { useEffect, useState, ChangeEvent } from "react";
import { Package, Building, RefreshCw, Pencil, Save, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import axiosInstance from "../../api/axiosInstance";
import { io, Socket } from "socket.io-client";

interface Material {
  _id: string;
  name: string;
  unit: string;
  supplier: string;
  minStock: number;
  currentStock: number;
  unitPrice: number;
}

const MaterialMaster: React.FC = () => {
  const { isDark } = useTheme();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<{
    name: string;
    unit: string;
    supplier: string;
    minStock: string;
    currentStock: string;
    unitPrice: string;
  }>({
    name: "",
    unit: "pcs",
    supplier: "Unknown",
    minStock: "0",
    currentStock: "0",
    unitPrice: "0",
  });

  const [newMaterial, setNewMaterial] = useState({
    name: "",
    unit: "pcs",
    supplier: "Unknown",
    minStock: "0",
    currentStock: "0",
    unitPrice: "0",
  });

  const normalize = (s: string) => s.trim().toLowerCase();

  const nameExists = (name: string) =>
    materials.some((m) => normalize(m.name) === normalize(name));

  const fetchMaterials = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);

      const res = await axiosInstance.get("/materials");
      const payload = res.data?.data ?? res.data;

      if (Array.isArray(payload)) {
        setMaterials(payload as Material[]);
      } else {
        setMaterials([]);
      }
    } catch (err: any) {
      console.error("FETCH MATERIALS ERROR →", err);
      setError("Failed to load materials.");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();

    const socket: Socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000");

    socket.on("connect", () => {
      console.log("Material Master connected to socket:", socket.id);
    });

    socket.on("stockUpdated", () => {
      fetchMaterials(false);
    });

    socket.on("poReceived", () => {
      fetchMaterials(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMaterial((prev) => ({ ...prev, [name]: value }));
  };

  const onEditInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditingMaterial((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = newMaterial.name.trim();
    const unit = newMaterial.unit.trim() || "pcs";
    const supplier = newMaterial.supplier.trim() || "Unknown";

    if (!name) {
      alert("Material name is required.");
      return;
    }
    if (!unit) {
      alert("Unit is required.");
      return;
    }
    if (!supplier) {
      alert("Supplier is required.");
      return;
    }

    if (nameExists(name)) {
      alert("Material name already exists.");
      return;
    }

    const payload = {
      name,
      unit,
      supplier,
      minStock: Number(newMaterial.minStock) || 0,
      currentStock: Number(newMaterial.currentStock) || 0,
      unitPrice: Number(newMaterial.unitPrice) || 0,
    };

    try {
      const res = await axiosInstance.post("/materials", payload);
      const created: Material = res.data?.data ?? res.data;

      if (!created || !created._id) {
        console.warn("Unexpected create response:", res.data);
        alert("Material added but server returned unexpected response.");
      } else {
        setMaterials((prev) => [...prev, created]);
        setSuccessMsg("Material added successfully!");
        setTimeout(() => setSuccessMsg(""), 2000);

        setNewMaterial({
          name: "",
          unit: "pcs",
          supplier: "Unknown",
          minStock: "0",
          currentStock: "0",
          unitPrice: "0",
        });
      }
    } catch (err: any) {
      console.error("ADD MATERIAL ERROR →", err);
      const serverMsg = err?.response?.data?.message;
      if (err.response?.status === 409 || serverMsg?.includes("exists")) {
        alert(serverMsg || "Material name already exists.");
      } else if (err.response?.status === 400) {
        alert(serverMsg || "Bad request — check required fields.");
      } else {
        alert(serverMsg || "Failed to add material.");
      }
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this material?")) return;
    try {
      await axiosInstance.delete(`/materials/${id}`);
      setMaterials((prev) => prev.filter((m) => m._id !== id));
    } catch (err: any) {
      console.error("DELETE ERROR →", err);
      alert("Failed to delete material");
    }
  };

  const startEditMaterial = (material: Material) => {
    setEditingId(material._id);
    setEditingMaterial({
      name: material.name,
      unit: material.unit,
      supplier: material.supplier,
      minStock: String(material.minStock ?? 0),
      currentStock: String(material.currentStock ?? 0),
      unitPrice: String(material.unitPrice ?? 0),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingMaterial({
      name: "",
      unit: "pcs",
      supplier: "Unknown",
      minStock: "0",
      currentStock: "0",
      unitPrice: "0",
    });
  };

  const handleSaveEdit = async (id: string) => {
    const trimmedName = editingMaterial.name.trim();

    if (!trimmedName) {
      alert("Material name is required.");
      return;
    }

    try {
      const currentMaterial = materials.find((m) => m._id === id);
      if (!currentMaterial) {
        alert("Material not found.");
        return;
      }

      const nonStockPayload = {
        name: trimmedName,
        unit: editingMaterial.unit.trim() || "pcs",
        supplier: editingMaterial.supplier.trim() || "Unknown",
        minStock: Number(editingMaterial.minStock) || 0,
        unitPrice: Number(editingMaterial.unitPrice) || 0,
      };

      const updatedNonStockRes = await axiosInstance.put(`/materials/${id}`, nonStockPayload);
      let updatedMaterial: Material = updatedNonStockRes.data?.data ?? updatedNonStockRes.data;

      const newStock = Number(editingMaterial.currentStock) || 0;
      const oldStock = Number(currentMaterial.currentStock) || 0;

      if (newStock !== oldStock) {
        const stockRes = await axiosInstance.post("/materials/edit-stock", {
          materialId: id,
          newStock,
          note: "Updated from Material Master",
        });

        updatedMaterial = stockRes.data?.material ?? updatedMaterial;
      }

      setMaterials((prev) =>
        prev.map((m) =>
          m._id === id
            ? {
                ...m,
                ...updatedMaterial,
                currentStock: newStock,
              }
            : m
        )
      );

      setSuccessMsg("Material updated successfully!");
      setTimeout(() => setSuccessMsg(""), 2000);
      cancelEdit();
      fetchMaterials(false);
    } catch (err: any) {
      console.error("UPDATE ERROR →", err);
      alert(err?.response?.data?.message || "Failed to update material");
    }
  };

  const isLowStock = (material: Material) =>
    Number(material.currentStock || 0) <= Number(material.minStock || 0);

  if (loading) return <div className="p-6">Loading materials...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div
      className={`p-6 rounded-xl border transition-colors duration-300 ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Package className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-semibold">Material Master</h2>
        </div>

        <button
          onClick={() => fetchMaterials()}
          className="flex items-center px-3 py-2 text-white bg-orange-500 rounded-lg hover:bg-orange-600"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {successMsg && <p className="pb-3 text-sm text-green-500">{successMsg}</p>}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              <th className="px-2 py-3 text-sm font-semibold text-left">Material</th>
              <th className="px-2 py-3 text-sm font-semibold text-left">Unit</th>
              <th className="px-2 py-3 text-sm font-semibold text-left">Supplier</th>
              <th className="px-2 py-3 text-sm font-semibold text-left">Min Stock</th>
              <th className="px-2 py-3 text-sm font-semibold text-left">Current</th>
              <th className="px-2 py-3 text-sm font-semibold text-left">Unit Price</th>
              <th className="px-2 py-3 text-sm font-semibold text-left">Status</th>
              <th className="px-2 py-3 text-sm font-semibold text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {materials.map((material) => (
              <tr
                key={material._id}
                className={`border-b transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  isDark ? "border-gray-700" : "border-gray-200"
                } ${isLowStock(material) ? "bg-red-50 dark:bg-red-950/20" : ""}`}
              >
                <td className="px-2 py-3 font-medium">
                  {editingId === material._id ? (
                    <input
                      name="name"
                      type="text"
                      className="w-full p-2 border rounded"
                      value={editingMaterial.name}
                      onChange={onEditInputChange}
                    />
                  ) : (
                    material.name
                  )}
                </td>

                <td className="px-2 py-3">
                  {editingId === material._id ? (
                    <input
                      name="unit"
                      type="text"
                      className="w-full p-2 border rounded"
                      value={editingMaterial.unit}
                      onChange={onEditInputChange}
                    />
                  ) : (
                    material.unit
                  )}
                </td>

                <td className="px-2 py-3 text-sm">
                  {editingId === material._id ? (
                    <input
                      name="supplier"
                      type="text"
                      className="w-full p-2 border rounded"
                      value={editingMaterial.supplier}
                      onChange={onEditInputChange}
                    />
                  ) : (
                    <div className="flex items-center">
                      <Building className="w-4 h-4 mr-1 text-gray-400" />
                      {material.supplier}
                    </div>
                  )}
                </td>

                <td className="px-2 py-3">
                  {editingId === material._id ? (
                    <input
                      name="minStock"
                      type="number"
                      className="w-24 p-2 border rounded"
                      value={editingMaterial.minStock}
                      onChange={onEditInputChange}
                    />
                  ) : (
                    material.minStock
                  )}
                </td>

                <td className="px-2 py-3">
                  {editingId === material._id ? (
                    <input
                      name="currentStock"
                      type="number"
                      className="w-24 p-2 border rounded"
                      value={editingMaterial.currentStock}
                      onChange={onEditInputChange}
                    />
                  ) : (
                    material.currentStock
                  )}
                </td>

                <td className="px-2 py-3 font-medium">
                  {editingId === material._id ? (
                    <input
                      name="unitPrice"
                      type="number"
                      className="p-2 border rounded w-28"
                      value={editingMaterial.unitPrice}
                      onChange={onEditInputChange}
                    />
                  ) : (
                    <>₹{(material.unitPrice ?? 0).toFixed(2)}</>
                  )}
                </td>

                <td className="px-2 py-3">
                  {isLowStock(material) ? (
                    <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full dark:bg-red-900 dark:text-red-300">
                      Low Stock
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-300">
                      Healthy
                    </span>
                  )}
                </td>

                <td className="px-2 py-3">
                  <div className="flex gap-2">
                    {editingId === material._id ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(material._id)}
                          className="px-3 py-1 text-sm text-white bg-green-500 rounded hover:bg-green-600"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 text-sm text-white bg-gray-500 rounded hover:bg-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditMaterial(material)}
                          className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(material._id)}
                          className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
        <span className="text-gray-600 dark:text-gray-400">
          Total Materials: {materials.length}
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          Low Stock Items: {materials.filter(isLowStock).length}
        </span>
      </div>

      <div
  className={`mt-8 overflow-hidden rounded-2xl border shadow-sm transition-all ${
    isDark
      ? "border-gray-700 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      : "border-gray-200 bg-gradient-to-br from-orange-50 via-white to-white"
  }`}
>
  <div
    className={`flex items-center justify-between px-5 py-4 border-b ${
      isDark ? "border-gray-700" : "border-orange-100"
    }`}
  >
    <div className="flex items-center gap-3">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          isDark ? "bg-orange-500/15 text-orange-400" : "bg-orange-100 text-orange-600"
        }`}
      >
        <Package className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">Add New Material</h3>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          Create a material record for inventory and production tracking
        </p>
      </div>
    </div>
  </div>

  <form onSubmit={handleAddMaterial} className="p-5">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
          Material Name
        </label>
        <input
          name="name"
          type="text"
          placeholder="Enter material name"
          className={`w-full rounded-xl px-4 py-3 outline-none transition ${
            isDark
              ? "bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              : "bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          }`}
          value={newMaterial.name}
          onChange={onInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
          Unit
        </label>
        <input
          name="unit"
          type="text"
          placeholder="pcs / kg / litre"
          className={`w-full rounded-xl px-4 py-3 outline-none transition ${
            isDark
              ? "bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              : "bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          }`}
          value={newMaterial.unit}
          onChange={onInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
          Supplier
        </label>
        <input
          name="supplier"
          type="text"
          placeholder="Supplier name"
          className={`w-full rounded-xl px-4 py-3 outline-none transition ${
            isDark
              ? "bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              : "bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          }`}
          value={newMaterial.supplier}
          onChange={onInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
          Minimum Stock
        </label>
        <input
          name="minStock"
          type="number"
          placeholder="Enter minimum stock"
          className={`w-full rounded-xl px-4 py-3 outline-none transition ${
            isDark
              ? "bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              : "bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          }`}
          value={newMaterial.minStock}
          onChange={onInputChange}
        />
      </div>

      <div className="space-y-2">
        <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
          Current Stock
        </label>
        <input
          name="currentStock"
          type="number"
          placeholder="Enter current stock"
          className={`w-full rounded-xl px-4 py-3 outline-none transition ${
            isDark
              ? "bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              : "bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          }`}
          value={newMaterial.currentStock}
          onChange={onInputChange}
        />
      </div>

      <div className="space-y-2">
        <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
          Unit Price
        </label>
        <input
          name="unitPrice"
          type="number"
          placeholder="Enter unit price"
          className={`w-full rounded-xl px-4 py-3 outline-none transition ${
            isDark
              ? "bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              : "bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          }`}
          value={newMaterial.unitPrice}
          onChange={onInputChange}
        />
      </div>
    </div>

    <div className="flex justify-end mt-5">
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:scale-[1.01] hover:from-orange-600 hover:to-orange-700"
      >
        <Package className="w-4 h-4" />
        Add Material
      </button>
    </div>
  </form>
</div>
    </div>
  );
};

export default MaterialMaster;