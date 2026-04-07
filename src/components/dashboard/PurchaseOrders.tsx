import React, { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Download,
  Mail,
  Eye,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import { jsPDF } from 'jspdf';

interface PO {
  _id?: string;
  poNumber: string;
  supplier: string;
  items: number | '';
  totalAmount: number | '';
  status: string;
  date: string;
  deliveryDate: string;
}

const PurchaseOrders: React.FC = () => {
  const { isDark } = useTheme();
  const [purchaseOrders, setPurchaseOrders] = useState<PO[]>([]);
  const [showForm, setShowForm] = useState(false);

  const emptyPO: PO = {
    poNumber: '',
    supplier: '',
    items: '',
    totalAmount: '',
    status: 'draft',
    date: '',
    deliveryDate: '',
  };

  const [newPO, setNewPO] = useState<PO>(emptyPO);
  const [editingPOId, setEditingPOId] = useState<string | null>(null);
  const [editingPO, setEditingPO] = useState<PO | null>(null);
  const [receivingPOId, setReceivingPOId] = useState<string | null>(null);

  const API_URL = 'http://localhost:5000/api/pos';

  const fetchPOs = async () => {
    try {
      const res = await axios.get(API_URL);
      setPurchaseOrders(res.data);
    } catch (err) {
      console.error('Error fetching POs:', err);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, []);

  const resetForm = () => {
    setNewPO(emptyPO);
    setShowForm(false);
  };

  const handleCreatePO = async () => {
    try {
      if (
        !newPO.poNumber.trim() ||
        !newPO.supplier.trim() ||
        newPO.items === '' ||
        newPO.totalAmount === '' ||
        Number(newPO.items) <= 0 ||
        Number(newPO.totalAmount) <= 0 ||
        !newPO.deliveryDate
      ) {
        alert('Please fill all fields correctly');
        return;
      }

      const payload = {
        ...newPO,
        items: Number(newPO.items),
        totalAmount: Number(newPO.totalAmount),
        date: newPO.date || new Date().toISOString().split('T')[0],
      };

      const res = await axios.post(API_URL, payload);
      setPurchaseOrders((prev) => [res.data, ...prev]);
      resetForm();
    } catch (err: any) {
      console.error('Error creating PO:', err);
      alert(err?.response?.data?.message || err?.response?.data?.error || 'Failed to create PO');
    }
  };

  const handleEditPO = (order: PO) => {
    setEditingPOId(order._id || null);
    setEditingPO({
      ...order,
      items: order.items === '' ? '' : Number(order.items),
      totalAmount: order.totalAmount === '' ? '' : Number(order.totalAmount),
      date: order.date ? String(order.date).split('T')[0] : '',
      deliveryDate: order.deliveryDate ? String(order.deliveryDate).split('T')[0] : '',
    });
  };

  const handleCancelEdit = () => {
    setEditingPOId(null);
    setEditingPO(null);
  };

  const handleSaveEdit = async () => {
    if (!editingPO || !editingPOId) return;

    try {
      if (
        !editingPO.poNumber.trim() ||
        !editingPO.supplier.trim() ||
        editingPO.items === '' ||
        editingPO.totalAmount === '' ||
        Number(editingPO.items) <= 0 ||
        Number(editingPO.totalAmount) <= 0 ||
        !editingPO.deliveryDate
      ) {
        alert('Please fill all edit fields correctly');
        return;
      }

      const payload = {
        ...editingPO,
        items: Number(editingPO.items),
        totalAmount: Number(editingPO.totalAmount),
      };

      const res = await axios.put(`${API_URL}/${editingPOId}`, payload);

      setPurchaseOrders((prev) =>
        prev.map((po) => (po._id === editingPOId ? res.data : po))
      );

      setEditingPOId(null);
      setEditingPO(null);
    } catch (err: any) {
      console.error('Error updating PO:', err);
      alert(err?.response?.data?.message || err?.response?.data?.error || 'Failed to update PO');
    }
  };

  const handleReceivePO = async (poId?: string) => {
    if (!poId) return;

    try {
      setReceivingPOId(poId);
      const res = await axios.post(`${API_URL}/receive`, { poId });

      setPurchaseOrders((prev) =>
        prev.map((po) =>
          po._id === poId
            ? { ...po, status: 'received' }
            : po
        )
      );

      await fetchPOs();

      const updatedMaterials = res.data?.updatedMaterials || [];
      if (updatedMaterials.length > 0) {
        const msg = updatedMaterials
          .map((m: any) => `${m.materialName} +${m.addedQty}`)
          .join('\n');
        alert(`${res.data?.message || 'PO received successfully'}\n\nStock Updated:\n${msg}`);
      } else {
        alert(res.data?.message || 'PO received successfully');
      }
    } catch (err: any) {
      console.error('Error receiving PO:', err);
      alert(err?.response?.data?.message || err?.response?.data?.error || 'Failed to receive PO');
    } finally {
      setReceivingPOId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'received':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'draft':
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatCurrency = (amount: number | '' | undefined) => {
    return `₹${Number(amount || 0)}`;
  };

  const downloadPDF = (order: PO) => {
    const doc = new jsPDF('p', 'mm', 'a4');

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Sunrise Technologies', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('K H P L compound, Doddaballapur Bangalore Road', 105, 28, { align: 'center' });
    doc.text('Karnataka, 562163', 105, 34, { align: 'center' });
    doc.text('Phone: +91 80 2345 6789 | Email: info@sunrise.com', 105, 40, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.line(10, 45, 200, 45);

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PURCHASE ORDER', 105, 55, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    doc.text(`PO Number: ${order.poNumber}`, 14, 70);
    doc.text(`Date: ${order.date ? new Date(order.date).toLocaleDateString() : '-'}`, 150, 70);

    doc.text(`Supplier: ${order.supplier}`, 14, 80);
    doc.text(`Delivery Date: ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '-'}`, 150, 80);

    doc.line(10, 85, 200, 85);

    const tableStartY = 95;

    doc.setFont('helvetica', 'bold');
    doc.rect(10, tableStartY, 190, 10);
    doc.text('No.', 12, tableStartY + 7);
    doc.text('Description', 32, tableStartY + 7);
    doc.text('Qty', 115, tableStartY + 7);
    doc.text('Rate', 145, tableStartY + 7);
    doc.text('Amount', 175, tableStartY + 7);

    doc.setFont('helvetica', 'normal');
    const rowY = tableStartY + 15;
    doc.rect(10, rowY - 7, 190, 10);
    doc.text('1', 12, rowY);
    doc.text('Purchased Items', 32, rowY);
    doc.text(String(order.items || 0), 115, rowY);

    const rate =
      Number(order.items || 0) > 0
        ? (Number(order.totalAmount || 0) / Number(order.items || 0)).toFixed(2)
        : '0.00';

    doc.text(rate, 145, rowY);
    doc.text(formatCurrency(order.totalAmount), 175, rowY);

    const totalY = rowY + 15;
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 145, totalY);
    doc.text(formatCurrency(order.totalAmount), 175, totalY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Thank you for your business!', 105, totalY + 20, { align: 'center' });
    doc.text('Authorized Signature: ____________________', 14, totalY + 40);

    doc.save(`PO_${order.poNumber}.pdf`);
  };

  return (
    <div
      className={`p-6 rounded-xl border transition-colors duration-300 mb-8 ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <ShoppingCart className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-semibold">Purchase Orders</h2>
        </div>

        <button
          className="flex items-center px-3 py-2 font-medium text-white transition-colors duration-200 bg-orange-500 rounded-lg hover:bg-orange-600"
          onClick={() => setShowForm(!showForm)}
        >
          <FileText className="w-4 h-4 mr-2" />
          {showForm ? 'Close Form' : 'New PO'}
        </button>
      </div>

      {showForm && (
        <div className="p-4 mb-6 border rounded-lg bg-gray-50 dark:bg-gray-700">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-1 text-sm font-medium">PO Number</label>
              <input
                type="text"
                placeholder="Enter PO number"
                className="w-full p-2 bg-white border rounded dark:bg-gray-800 dark:border-gray-600"
                value={newPO.poNumber}
                onChange={(e) => setNewPO({ ...newPO, poNumber: e.target.value })}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Supplier</label>
              <input
                type="text"
                placeholder="Enter supplier name"
                className="w-full p-2 bg-white border rounded dark:bg-gray-800 dark:border-gray-600"
                value={newPO.supplier}
                onChange={(e) => setNewPO({ ...newPO, supplier: e.target.value })}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Items</label>
              <input
                type="number"
                placeholder="Enter number of items"
                className="w-full p-2 bg-white border rounded dark:bg-gray-800 dark:border-gray-600"
                value={newPO.items}
                onChange={(e) =>
                  setNewPO({
                    ...newPO,
                    items: e.target.value === '' ? '' : Number(e.target.value),
                  })
                }
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Total Amount</label>
              <input
                type="number"
                placeholder="Enter total amount"
                className="w-full p-2 bg-white border rounded dark:bg-gray-800 dark:border-gray-600"
                value={newPO.totalAmount}
                onChange={(e) =>
                  setNewPO({
                    ...newPO,
                    totalAmount: e.target.value === '' ? '' : Number(e.target.value),
                  })
                }
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Status</label>
              <select
                className="w-full p-2 bg-white border rounded dark:bg-gray-800 dark:border-gray-600"
                value={newPO.status}
                onChange={(e) => setNewPO({ ...newPO, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="approved">Approved</option>
                <option value="received">Received</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Delivery Date</label>
              <input
                type="date"
                className="w-full p-2 bg-white border rounded dark:bg-gray-800 dark:border-gray-600"
                value={newPO.deliveryDate}
                onChange={(e) => setNewPO({ ...newPO, deliveryDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600"
              onClick={handleCreatePO}
            >
              Save PO
            </button>

            <button
              className="px-4 py-2 text-white bg-gray-500 rounded hover:bg-gray-600"
              onClick={resetForm}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <th className="px-4 py-3 text-sm font-semibold text-left">PO Number</th>
              <th className="px-4 py-3 text-sm font-semibold text-left">Supplier</th>
              <th className="px-4 py-3 text-sm font-semibold text-left">Items</th>
              <th className="px-4 py-3 text-sm font-semibold text-left">Amount</th>
              <th className="px-4 py-3 text-sm font-semibold text-left">Status</th>
              <th className="px-4 py-3 text-sm font-semibold text-left">Delivery</th>
              <th className="px-4 py-3 text-sm font-semibold text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {purchaseOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  No purchase orders found.
                </td>
              </tr>
            ) : (
              purchaseOrders.map((order) => (
                <tr
                  key={order._id}
                  className={`border-b transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}
                >
                  <td className="px-4 py-4">
                    {editingPOId === order._id ? (
                      <input
                        className="w-full p-1 bg-white border rounded dark:bg-gray-800 dark:border-gray-600"
                        value={editingPO?.poNumber || ''}
                        onChange={(e) =>
                          setEditingPO({ ...editingPO!, poNumber: e.target.value })
                        }
                      />
                    ) : (
                      <div className="font-medium">{order.poNumber}</div>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    {editingPOId === order._id ? (
                      <input
                        className="w-full p-1 bg-white border rounded dark:bg-gray-800 dark:border-gray-600"
                        value={editingPO?.supplier || ''}
                        onChange={(e) =>
                          setEditingPO({ ...editingPO!, supplier: e.target.value })
                        }
                      />
                    ) : (
                      order.supplier
                    )}
                  </td>

                  <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                    {editingPOId === order._id ? (
                      <input
                        type="number"
                        className="w-full p-1 bg-white border rounded dark:bg-gray-800 dark:border-gray-600"
                        value={editingPO?.items ?? ''}
                        onChange={(e) =>
                          setEditingPO({
                            ...editingPO!,
                            items: e.target.value === '' ? '' : Number(e.target.value),
                          })
                        }
                      />
                    ) : (
                      `${order.items} items`
                    )}
                  </td>

                  <td className="px-4 py-4 font-medium">
                    {editingPOId === order._id ? (
                      <input
                        type="number"
                        className="w-full p-1 bg-white border rounded dark:bg-gray-800 dark:border-gray-600"
                        value={editingPO?.totalAmount ?? ''}
                        onChange={(e) =>
                          setEditingPO({
                            ...editingPO!,
                            totalAmount: e.target.value === '' ? '' : Number(e.target.value),
                          })
                        }
                      />
                    ) : (
                      formatCurrency(order.totalAmount)
                    )}
                  </td>

                  <td className="px-4 py-4">
                    {editingPOId === order._id ? (
                      <select
                        className="w-full p-1 bg-white border rounded dark:bg-gray-800 dark:border-gray-600"
                        value={editingPO?.status || 'draft'}
                        onChange={(e) =>
                          setEditingPO({ ...editingPO!, status: e.target.value })
                        }
                      >
                        <option value="draft">Draft</option>
                        <option value="pending">Pending</option>
                        <option value="sent">Sent</option>
                        <option value="approved">Approved</option>
                        <option value="received">Received</option>
                      </select>
                    ) : (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                    {editingPOId === order._id ? (
                      <input
                        type="date"
                        className="w-full p-1 bg-white border rounded dark:bg-gray-800 dark:border-gray-600"
                        value={editingPO?.deliveryDate || ''}
                        onChange={(e) =>
                          setEditingPO({ ...editingPO!, deliveryDate: e.target.value })
                        }
                      />
                    ) : order.deliveryDate ? (
                      new Date(order.deliveryDate).toLocaleDateString()
                    ) : (
                      '-'
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      {editingPOId === order._id ? (
                        <>
                          <button
                            className="px-2 py-1 text-white bg-green-500 rounded"
                            onClick={handleSaveEdit}
                          >
                            Save
                          </button>
                          <button
                            className="px-2 py-1 text-white bg-gray-500 rounded"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="p-1 text-blue-600 transition-colors duration-200 rounded hover:bg-blue-100 dark:hover:bg-blue-900"
                            onClick={() => handleEditPO(order)}
                            title="Edit PO"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            className="p-1 text-green-600 transition-colors duration-200 rounded hover:bg-green-100 dark:hover:bg-green-900 disabled:opacity-50"
                            onClick={() => handleReceivePO(order._id)}
                            disabled={order.status === 'received' || receivingPOId === order._id}
                            title="Receive PO"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>

                          <button
                            className="p-1 text-red-600 transition-colors duration-200 rounded hover:bg-red-100 dark:hover:bg-red-900"
                            onClick={() => downloadPDF(order)}
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            className="p-1 text-orange-600 transition-colors duration-200 rounded hover:bg-orange-100 dark:hover:bg-orange-900"
                            onClick={() => alert('Email feature not connected yet')}
                            title="Email PO"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Total Orders: {purchaseOrders.length} | Total Value:{' '}
            {formatCurrency(
              purchaseOrders.reduce((sum, po) => sum + Number(po.totalAmount || 0), 0)
            )}
          </span>

          <div className="flex space-x-4">
            <button
              className="font-medium text-orange-500 hover:text-orange-600"
              onClick={() => purchaseOrders.forEach(downloadPDF)}
            >
              Export All (PDF)
            </button>

            <button
              className="font-medium text-orange-500 hover:text-orange-600"
              onClick={() => alert('Email Summary feature not connected yet')}
            >
              Email Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrders;