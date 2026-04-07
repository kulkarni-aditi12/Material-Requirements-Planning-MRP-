import React, { useEffect, useMemo, useState } from "react";

const API = "http://localhost:5000/api";

type AnalyticsData = {
  monthlyStockMovements: { month: string; stockIn: number; stockOut: number }[];
  poStatusData: { status: string; count: number }[];
  shortageMaterials: { materialName: string; shortage: number }[];
  topCostlyMaterials: { materialName: string; unitPrice: number }[];
};

const COLORS = ["#7c3aed", "#f59e0b", "#10b981", "#ef4444", "#3b82f6"];

export default function ReportsAnalyticsEnhanced() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch(`${API}/insights/analytics`)
      .then((r) => r.json())
      .then(setData)
      .catch((err) => console.error("Analytics fetch error:", err));
  }, []);

  const totalPO = useMemo(
    () => (data?.poStatusData || []).reduce((sum, item) => sum + item.count, 0),
    [data]
  );

  const totalStockIn = useMemo(
    () => (data?.monthlyStockMovements || []).reduce((sum, item) => sum + item.stockIn, 0),
    [data]
  );

  const totalStockOut = useMemo(
    () => (data?.monthlyStockMovements || []).reduce((sum, item) => sum + item.stockOut, 0),
    [data]
  );

  const totalShortage = useMemo(
    () => (data?.shortageMaterials || []).reduce((sum, item) => sum + item.shortage, 0),
    [data]
  );

  const highestCost = useMemo(
    () =>
      data?.topCostlyMaterials?.length
        ? Math.max(...data.topCostlyMaterials.map((m) => m.unitPrice))
        : 0,
    [data]
  );

  const pieGradient = useMemo(() => {
    if (!data || totalPO === 0) return "conic-gradient(#e5e7eb 0 100%)";

    let current = 0;
    const parts = data.poStatusData.map((item, index) => {
      const percent = (item.count / totalPO) * 100;
      const start = current;
      const end = current + percent;
      current = end;
      return `${COLORS[index % COLORS.length]} ${start}% ${end}%`;
    });

    return `conic-gradient(${parts.join(", ")})`;
  }, [data, totalPO]);

  if (!data) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: 28,
          background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            background: "rgba(255,255,255,0.75)",
            border: "1px solid rgba(255,255,255,0.7)",
            backdropFilter: "blur(18px)",
            borderRadius: 28,
            padding: 30,
            boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
          }}
        >
          <h1 style={{ fontSize: 34, margin: 0, color: "#111827" }}>Reports & Analytics</h1>
          <p style={{ color: "#6b7280", marginTop: 8 }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const maxMovement = Math.max(
    ...data.monthlyStockMovements.flatMap((m) => [m.stockIn, m.stockOut]),
    1
  );
  const maxShortage = Math.max(...data.shortageMaterials.map((m) => m.shortage), 1);
  const maxCost = Math.max(...data.topCostlyMaterials.map((m) => m.unitPrice), 1);

  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(255,255,255,0.7)",
    backdropFilter: "blur(18px)",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)",
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 18,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 28,
        background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 45%, #f5f3ff 100%)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            ...cardStyle,
            marginBottom: 24,
            padding: 30,
            background:
              "linear-gradient(135deg, rgba(124,58,237,0.95), rgba(59,130,246,0.9))",
            color: "#fff",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -40,
              top: -40,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 80,
              bottom: -50,
              width: 140,
              height: 140,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
            }}
          />
          <div style={{ position: "relative", zIndex: 2 }}>
            <div
              style={{
                display: "inline-block",
                padding: "6px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.18)",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 14,
              }}
            >
              Smart Manufacturing Insights
            </div>
            <h1 style={{ fontSize: 36, margin: 0, fontWeight: 800 }}>Reports & Analytics</h1>
            <p style={{ marginTop: 10, marginBottom: 0, fontSize: 15, opacity: 0.95 }}>
              Clean, modern analytics dashboard for stock, purchase orders, shortages and cost trends.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 18,
            marginBottom: 24,
          }}
        >
          {[
            {
              label: "Total Stock In",
              value: totalStockIn,
              color: "linear-gradient(135deg, #10b981, #34d399)",
            },
            {
              label: "Total Stock Out",
              value: totalStockOut,
              color: "linear-gradient(135deg, #ef4444, #f87171)",
            },
            {
              label: "Total PO Records",
              value: totalPO,
              color: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
            },
            {
              label: "Total Shortage",
              value: totalShortage,
              color: "linear-gradient(135deg, #f59e0b, #fbbf24)",
            },
            {
              label: "Highest Material Cost",
              value: `₹${highestCost}`,
              color: "linear-gradient(135deg, #2563eb, #60a5fa)",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                ...cardStyle,
                padding: 20,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 6,
                  background: item.color,
                }}
              />
              <div style={{ color: "#6b7280", fontSize: 14, fontWeight: 600 }}>{item.label}</div>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 24,
            marginBottom: 24,
          }}
        >
          {/* Monthly Stock Movement */}
          <div style={cardStyle}>
            <div style={sectionTitle}>Monthly Stock Movement</div>
            <div style={{ display: "flex", gap: 18, marginBottom: 18, flexWrap: "wrap" }}>
              <Legend color="#10b981" label="Stock In" />
              <Legend color="#ef4444" label="Stock Out" />
            </div>

            {data.monthlyStockMovements.map((row) => (
              <div
                key={row.month}
                style={{
                  padding: "14px 0",
                  borderBottom: "1px solid #eef2f7",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 10,
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#1f2937" }}>{row.month}</div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>
                    In: {row.stockIn} | Out: {row.stockOut}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <ProgressRow
                    label="Stock In"
                    value={row.stockIn}
                    max={maxMovement}
                    gradient="linear-gradient(90deg, #10b981, #34d399)"
                  />
                  <ProgressRow
                    label="Stock Out"
                    value={row.stockOut}
                    max={maxMovement}
                    gradient="linear-gradient(90deg, #ef4444, #f87171)"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* PO Status */}
          <div style={cardStyle}>
            <div style={sectionTitle}>PO Status Distribution</div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 20,
              }}
            >
              <div
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: "50%",
                  background: pieGradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset 0 0 0 18px rgba(255,255,255,0.92)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: 115,
                    height: 115,
                    borderRadius: "50%",
                    background: "#fff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                  }}
                >
                  <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Total PO</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#111827" }}>{totalPO}</div>
                </div>
              </div>

              <div style={{ width: "100%" }}>
                {data.poStatusData.map((item, index) => {
                  const percent = totalPO ? ((item.count / totalPO) * 100).toFixed(1) : "0.0";
                  return (
                    <div
                      key={item.status}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        borderRadius: 14,
                        background: "#f8fafc",
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            background: COLORS[index % COLORS.length],
                            display: "inline-block",
                          }}
                        />
                        <span style={{ fontWeight: 600, color: "#1f2937" }}>{item.status}</span>
                      </div>
                      <div style={{ fontSize: 14, color: "#6b7280", fontWeight: 700 }}>
                        {item.count} ({percent}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
        >
          {/* Shortage Materials */}
          <div style={cardStyle}>
            <div style={sectionTitle}>Shortage Materials</div>
            {data.shortageMaterials.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  borderRadius: 18,
                  textAlign: "center",
                  background: "#f8fafc",
                  color: "#6b7280",
                  fontWeight: 600,
                }}
              >
                No shortage materials 🎉
              </div>
            ) : (
              data.shortageMaterials.map((item, index) => (
                <div
                  key={item.materialName}
                  style={{
                    padding: "14px 0",
                    borderBottom:
                      index !== data.shortageMaterials.length - 1 ? "1px solid #eef2f7" : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 10,
                      fontWeight: 600,
                      color: "#1f2937",
                    }}
                  >
                    <span>{item.materialName}</span>
                    <span style={{ color: "#f59e0b" }}>{item.shortage}</span>
                  </div>
                  <div
                    style={{
                      height: 12,
                      background: "#f3f4f6",
                      borderRadius: 999,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(item.shortage / maxShortage) * 100}%`,
                        background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Top Costly Materials */}
          <div style={cardStyle}>
            <div style={sectionTitle}>Top Costly Materials</div>
            {data.topCostlyMaterials.map((item, index) => (
              <div
                key={item.materialName}
                style={{
                  padding: "14px 0",
                  borderBottom:
                    index !== data.topCostlyMaterials.length - 1 ? "1px solid #eef2f7" : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 10,
                    fontWeight: 600,
                    color: "#1f2937",
                  }}
                >
                  <span>{item.materialName}</span>
                  <span style={{ color: "#7c3aed" }}>₹{item.unitPrice}</span>
                </div>
                <div
                  style={{
                    height: 12,
                    background: "#f3f4f6",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(item.unitPrice / maxCost) * 100}%`,
                      background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
        }}
      />
      <span style={{ fontSize: 14, fontWeight: 600, color: "#4b5563" }}>{label}</span>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  max,
  gradient,
}: {
  label: string;
  value: number;
  max: number;
  gradient: string;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 50px", gap: 12, alignItems: "center" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>{label}</div>
      <div
        style={{
          height: 12,
          background: "#f3f4f6",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(value / max) * 100}%`,
            background: gradient,
            borderRadius: 999,
            boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
          }}
        />
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", textAlign: "right" }}>
        {value}
      </div>
    </div>
  );
}