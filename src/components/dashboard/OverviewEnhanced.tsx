import React, { useEffect, useState } from "react";

type OverviewData = {
  totalMaterials: number;
  lowStockCount: number;
  pendingPOs: number;
  receivedPOs: number;
  stockInCount: number;
  stockOutCount: number;
  lastMRPRun: null | {
    productName: string;
    demandQuantity: number;
    shortageCount: number;
    totalShortageQty: number;
    canProduceFully: boolean;
    createdAt: string;
  };
};

const API = "http://localhost:5000/api";

export default function OverviewEnhanced() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/insights/overview`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Overview fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const cardStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 180,
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
  };

  if (loading) return <div style={{ padding: 24 }}>Loading overview...</div>;
  if (!data) return <div style={{ padding: 24 }}>No overview data found.</div>;

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 34, marginBottom: 20 }}>Overview</h1>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ ...cardStyle, background: "#eef6ff" }}>
          <div>Total Materials</div>
          <h2>{data.totalMaterials}</h2>
        </div>
        <div style={{ ...cardStyle, background: "#fff1f1" }}>
          <div>Low Stock Count</div>
          <h2>{data.lowStockCount}</h2>
        </div>
        <div style={{ ...cardStyle, background: "#fff8e6" }}>
          <div>Pending POs</div>
          <h2>{data.pendingPOs}</h2>
        </div>
        <div style={{ ...cardStyle, background: "#eefaf0" }}>
          <div>Received POs</div>
          <h2>{data.receivedPOs}</h2>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ ...cardStyle, background: "#f8f5ff" }}>
          <div>Stock In</div>
          <h2>{data.stockInCount}</h2>
        </div>
        <div style={{ ...cardStyle, background: "#fff5f5" }}>
          <div>Stock Out</div>
          <h2>{data.stockOutCount}</h2>
        </div>
      </div>

      <div style={{ ...cardStyle }}>
        <h3 style={{ marginTop: 0 }}>Last MRP Run Summary</h3>
        {data.lastMRPRun ? (
          <div style={{ lineHeight: 1.9 }}>
            <div><b>Product:</b> {data.lastMRPRun.productName}</div>
            <div><b>Demand Quantity:</b> {data.lastMRPRun.demandQuantity}</div>
            <div><b>Shortage Count:</b> {data.lastMRPRun.shortageCount}</div>
            <div><b>Total Shortage Qty:</b> {data.lastMRPRun.totalShortageQty}</div>
            <div>
              <b>Status:</b>{" "}
              {data.lastMRPRun.canProduceFully ? "Can Produce Fully" : "Need Purchase"}
            </div>
            <div>
              <b>Run Time:</b>{" "}
              {new Date(data.lastMRPRun.createdAt).toLocaleString()}
            </div>
          </div>
        ) : (
          <div>No MRP run found.</div>
        )}
      </div>
    </div>
  );
}