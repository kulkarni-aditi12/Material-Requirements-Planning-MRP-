import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  LogOut,
  Bell,
  Search,
  TrendingUp,
  BarChart3,
  Layers,
  FileText,
  ShoppingCart,
  Factory,
  ChevronLeft,
  Calculator,
  History,
  Package,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Activity,
  Warehouse,
  RefreshCw,
  ShieldCheck,
  Clock3,
  ChevronRight,
} from "lucide-react";
import { io } from "socket.io-client";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

import MaterialMaster from "./dashboard/MaterialMaster";
import PurchaseOrders from "./dashboard/PurchaseOrders";
import BOMSection from "./dashboard/BOMSection";
import StockMovementHistory from "./dashboard/StockMovementHistory";
import SmartAlerts from "./dashboard/SmartAlerts";
import ReportsAnalyticsEnhanced from "./dashboard/ReportsAnalyticsEnhanced";
import MRPPlannerEnhanced from "./dashboard/MRPPlannerEnhanced";

type Section =
  | "overview"
  | "materials"
  | "bom"
  | "purchase"
  | "planner"
  | "movements"
  | "reports";

type DashboardStats = {
  totalMaterials: number;
  lowStockCount: number;
  pendingPOs: number;
  receivedPOs: number;
  stockIn: number;
  stockOut: number;
  lastMRP: {
    productName: string;
    demandQuantity: number;
    shortageCount: number;
    totalShortageQty: number;
    status: string;
  };
};

type MaterialItem = {
  _id: string;
  name: string;
  supplier: string;
  currentStock: number;
  minStock: number;
  unit: string;
};

const API = "http://localhost:5000/api";

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [overviewRefreshKey, setOverviewRefreshKey] = useState(0);

  const [notifications, setNotifications] = useState([
    { id: 1, message: "Low stock: Copper Wire", read: false },
    { id: 2, message: "Purchase Order PO-102 approved", read: false },
    { id: 3, message: "BOM updated for Refrigerator Model X", read: true },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const socket = io(socketUrl);

    socket.on("connect", () => {
      console.log("Connected to notification server:", socket.id);
    });

    socket.on("notification", (newNotification) => {
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          message: newNotification?.message || "New notification",
          read: false,
        },
      ]);
    });

    socket.on("stockUpdated", (payload) => {
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          message: `Stock updated: ${payload?.materialName || "Material"}`,
          read: false,
        },
      ]);
      setOverviewRefreshKey((prev) => prev + 1);
    });

    socket.on("poReceived", (payload) => {
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          message: `PO received: ${payload?.poNumber || "PO"}`,
          read: false,
        },
      ]);
      setOverviewRefreshKey((prev) => prev + 1);
    });

    socket.on("mrpRunCompleted", (payload) => {
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now() + 3,
          message: `MRP run completed for ${payload?.productName || "product"}`,
          read: false,
        },
      ]);
      setOverviewRefreshKey((prev) => prev + 1);
    });

    socket.on("productionStarted", (payload) => {
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now() + 4,
          message: `Production completed for ${payload?.productName || "product"}`,
          read: false,
        },
      ]);
      setOverviewRefreshKey((prev) => prev + 1);
    });

    return () => {
      clearInterval(timer);
      socket.disconnect();
    };
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;

    const allowedForStaff: Section[] = ["overview", "materials", "purchase", "movements"];

    if (isStaff && !allowedForStaff.includes(activeSection)) {
      setActiveSection("overview");
    }
  }, [user, isStaff, activeSection]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const menuItems = [
    { id: "overview", name: "Overview", icon: BarChart3, roles: ["admin", "staff"] },
    { id: "materials", name: "Material Master", icon: Layers, roles: ["admin", "staff"] },
    { id: "bom", name: "Bill of Materials", icon: FileText, roles: ["admin"] },
    { id: "purchase", name: "Purchase Orders", icon: ShoppingCart, roles: ["admin", "staff"] },
    { id: "planner", name: "MRP Planner", icon: Calculator, roles: ["admin"] },
    { id: "movements", name: "Stock Movements", icon: History, roles: ["admin", "staff"] },
    { id: "reports", name: "Reports & Analytics", icon: TrendingUp, roles: ["admin"] },
  ];

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(user.role));

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <OverviewSection
            isDark={isDark}
            refreshKey={overviewRefreshKey}
            canCreatePO={isAdmin}
            canRunMRP={isAdmin}
            onOpenPurchase={() => setActiveSection("purchase")}
            onOpenPlanner={() => setActiveSection("planner")}
            onOpenMaterials={() => setActiveSection("materials")}
          />
        );
      case "materials":
        return <MaterialMaster />;
      case "bom":
        return isAdmin ? <BOMSection /> : <OverviewSection isDark={isDark} refreshKey={overviewRefreshKey} canCreatePO={false} canRunMRP={false} onOpenPurchase={() => setActiveSection("purchase")} onOpenPlanner={() => setActiveSection("overview")} onOpenMaterials={() => setActiveSection("materials")} />;
      case "purchase":
        return <PurchaseOrders />;
      case "planner":
        return isAdmin ? <MRPPlannerEnhanced /> : <OverviewSection isDark={isDark} refreshKey={overviewRefreshKey} canCreatePO={false} canRunMRP={false} onOpenPurchase={() => setActiveSection("purchase")} onOpenPlanner={() => setActiveSection("overview")} onOpenMaterials={() => setActiveSection("materials")} />;
      case "movements":
        return <StockMovementHistory />;
      case "reports":
        return isAdmin ? <ReportsAnalyticsEnhanced /> : <OverviewSection isDark={isDark} refreshKey={overviewRefreshKey} canCreatePO={false} canRunMRP={false} onOpenPurchase={() => setActiveSection("purchase")} onOpenPlanner={() => setActiveSection("overview")} onOpenMaterials={() => setActiveSection("materials")} />;
      default:
        return null;
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case "overview":
        return "Dashboard Overview";
      case "materials":
        return "Material Master";
      case "bom":
        return "Bill of Materials";
      case "purchase":
        return "Purchase Orders";
      case "planner":
        return "MRP Planner";
      case "movements":
        return "Stock Movements";
      case "reports":
        return "Reports & Analytics";
      default:
        return "Dashboard";
    }
  };

  return (
    <div
      className={`flex min-h-screen transition-colors duration-300 ${
        isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <aside
        className={`${
          sidebarCollapsed ? "w-20" : "w-64"
        } h-screen flex flex-col border-r transition-all duration-300 ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between h-20 px-4 border-b border-gray-200 dark:border-gray-700">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <Factory className="w-8 h-8 text-orange-500" />
              <span className="text-lg font-bold">SmartMRP</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronLeft
              className={`w-5 h-5 transition-transform ${
                sidebarCollapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {filteredMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as Section)}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                activeSection === item.id
                  ? "bg-blue-100 text-blue-800 shadow-sm dark:bg-blue-900 dark:text-blue-200"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <item.icon className="w-5 h-5 min-w-5" />
              <span
                className={`ml-3 font-medium transition-opacity duration-200 ${
                  sidebarCollapsed
                    ? "opacity-0 pointer-events-none w-0 overflow-hidden"
                    : "opacity-100"
                }`}
              >
                {item.name}
              </span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                user.role === "admin" ? "bg-orange-500" : "bg-blue-500"
              }`}
            >
              <span className="font-bold text-white">{user.name.charAt(0)}</span>
            </div>

            <span
              className={`transition-opacity duration-200 ${
                sidebarCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
            >
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize dark:text-gray-400">
                {user.role}
              </p>
            </span>
          </div>

          {!sidebarCollapsed && (
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 mt-3 space-x-2 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      <main className="flex flex-col flex-1">
        <header className="sticky top-0 z-30 border-b backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-6">
            <div>
              <h1 className="text-xl font-bold">{getSectionTitle()}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentTime.toLocaleTimeString()} • {currentTime.toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="py-2 pl-10 pr-4 bg-gray-100 border border-gray-300 rounded-lg outline-none dark:bg-gray-700 dark:border-gray-600 focus:ring-2"
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setNotifications((prev) =>
                      prev.map((n) => ({ ...n, read: true }))
                    );
                  }}
                  className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute flex items-center justify-center w-4 h-4 text-xs text-white bg-red-500 rounded-full -top-1 -right-1">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 z-50 mt-3 overflow-hidden bg-white border shadow-xl w-80 dark:bg-gray-800 dark:border-gray-700 rounded-xl">
                    <div className="p-4 font-semibold border-b dark:border-gray-700">
                      Notifications
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">No notifications</div>
                    ) : (
                      notifications
                        .slice()
                        .reverse()
                        .map((n) => (
                          <div key={n.id} className="p-4 text-sm border-b dark:border-gray-700">
                            {n.message}
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 px-6 py-6">{renderContent()}</div>
      </main>
    </div>
  );
};

function OverviewSection({
  isDark,
  refreshKey,
  canCreatePO,
  canRunMRP,
  onOpenPurchase,
  onOpenPlanner,
  onOpenMaterials,
}: {
  isDark: boolean;
  refreshKey: number;
  canCreatePO: boolean;
  canRunMRP: boolean;
  onOpenPurchase: () => void;
  onOpenPlanner: () => void;
  onOpenMaterials: () => void;
}) {
  const [stats, setStats] = useState<DashboardStats>({
    totalMaterials: 0,
    lowStockCount: 0,
    pendingPOs: 0,
    receivedPOs: 0,
    stockIn: 0,
    stockOut: 0,
    lastMRP: {
      productName: "-",
      demandQuantity: 0,
      shortageCount: 0,
      totalShortageQty: 0,
      status: "No recent run",
    },
  });

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        const [statsResult, poResult, mrpResult] = await Promise.allSettled([
          fetch(`${API}/dashboard/stats`),
          fetch(`${API}/pos`),
          fetch(`${API}/mrp`),
        ]);

        let statsData: any = {};
        let poData: any[] = [];
        let mrpRuns: any[] = [];

        if (statsResult.status === "fulfilled") {
          const res = statsResult.value;
          if (res.ok) statsData = await res.json();
        }

        if (poResult.status === "fulfilled") {
          const res = poResult.value;
          if (res.ok) {
            const poDataRaw = await res.json();
            poData = Array.isArray(poDataRaw?.data)
              ? poDataRaw.data
              : Array.isArray(poDataRaw)
              ? poDataRaw
              : [];
          }
        }

        if (mrpResult.status === "fulfilled") {
          const res = mrpResult.value;
          if (res.ok) {
            const mrpDataRaw = await res.json();
            mrpRuns = Array.isArray(mrpDataRaw?.data)
              ? mrpDataRaw.data
              : Array.isArray(mrpDataRaw)
              ? mrpDataRaw
              : [];
          }
        }

        const pendingPOs = poData.filter((po: any) =>
          ["pending", "sent", "approved"].includes(String(po.status || "").toLowerCase())
        ).length;

        const receivedPOs = poData.filter(
          (po: any) => String(po.status || "").toLowerCase() === "received"
        ).length;

        const latestRun = mrpRuns.length > 0 ? mrpRuns[0] : null;
        const latestResults = Array.isArray(latestRun?.results) ? latestRun.results : [];

        const shortageCount = latestResults.filter(
          (item: any) => Number(item.shortage || 0) > 0
        ).length;

        const totalShortageQty = latestResults.reduce(
          (sum: number, item: any) => sum + Number(item.shortage || 0),
          0
        );

        const mappedStats: DashboardStats = {
          totalMaterials: Number(statsData.totalMaterials || 0),
          lowStockCount: Number(statsData.lowStockItems || 0),
          stockIn: Number(statsData.stockIn || 0),
          stockOut: Number(statsData.stockOut || 0),
          pendingPOs,
          receivedPOs,
          lastMRP: {
            productName: latestRun?.productName || "-",
            demandQuantity: Number(latestRun?.demandQuantity || 0),
            shortageCount,
            totalShortageQty,
            status: latestRun?.status || "No recent run",
          },
        };

        if (isMounted) {
          setStats(mappedStats);
          setLastUpdated(new Date());
          setLoading(false);
        }
      } catch (err) {
        console.error("Dashboard overview fetch error:", err);
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [refreshKey]);

  const cards = useMemo(
    () => [
      {
        title: "Total Materials",
        value: stats.totalMaterials,
        sub: "Items in material master",
        icon: Package,
        tone: "blue",
        trend: stats.totalMaterials > 0 ? "↑ master data loaded" : "— no records",
        glow: "shadow-blue-100/60 dark:shadow-blue-950/30",
      },
      {
        title: "Low Stock Count",
        value: stats.lowStockCount,
        sub: "Needs attention",
        icon: AlertTriangle,
        tone: "red",
        trend:
          stats.lowStockCount === 0
            ? "↓ zero critical alerts"
            : `↑ ${stats.lowStockCount} flagged`,
        glow: "shadow-red-100/60 dark:shadow-red-950/30",
        action:
          canCreatePO && stats.lowStockCount > 0
            ? { label: "Create PO", onClick: onOpenPurchase }
            : undefined,
      },
      {
        title: "Pending POs",
        value: stats.pendingPOs,
        sub: "Awaiting delivery",
        icon: ShoppingCart,
        tone: "amber",
        trend:
          stats.pendingPOs === 0
            ? "↓ backlog clear"
            : `↑ ${stats.pendingPOs} open orders`,
        glow: "shadow-yellow-100/60 dark:shadow-yellow-950/30",
      },
      {
        title: "Received POs",
        value: stats.receivedPOs,
        sub: "Completed receipts",
        icon: Warehouse,
        tone: "green",
        trend:
          stats.receivedPOs > 0
            ? `↑ ${stats.receivedPOs} closed successfully`
            : "— no receipts yet",
        glow: "shadow-green-100/60 dark:shadow-green-950/30",
      },
      {
        title: "Stock In",
        value: stats.stockIn,
        sub: "Inbound movement",
        icon: ArrowDownToLine,
        tone: "violet",
        trend:
          stats.stockIn >= stats.stockOut
            ? `↑ ${stats.stockIn - stats.stockOut} above outflow`
            : "↓ inbound behind outflow",
        glow: "shadow-violet-100/60 dark:shadow-violet-950/30",
      },
      {
        title: "Stock Out",
        value: stats.stockOut,
        sub: "Outbound usage",
        icon: ArrowUpFromLine,
        tone: "pink",
        trend:
          stats.stockOut > 0
            ? `↑ ${stats.stockOut} consumption recorded`
            : "— no outflow yet",
        glow: "shadow-pink-100/60 dark:shadow-pink-950/30",
      },
    ],
    [stats, canCreatePO, onOpenPurchase]
  );

  if (loading) {
    return (
      <div className="py-10 text-center text-gray-500 dark:text-gray-400">
        Loading dashboard overview...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className={`relative overflow-hidden rounded-3xl border p-6 md:p-8 ${
          isDark
            ? "border-gray-700 bg-gradient-to-r from-slate-900 via-gray-900 to-slate-800"
            : "border-gray-200 bg-gradient-to-r from-white via-orange-50 to-blue-50"
        } shadow-sm`}
      >
        <div className="absolute w-40 h-40 rounded-full -top-10 right-8 bg-orange-500/10 blur-3xl" />
        <div className="absolute w-32 h-32 rounded-full -bottom-8 left-8 bg-blue-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Overview</h2>
            <p className="max-w-2xl mt-2 text-sm text-gray-600 dark:text-gray-400">
              Real-time summary of materials, stock health, purchase flow, alerts, and
              latest planning activity.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <div
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                  isDark
                    ? "bg-emerald-900/30 text-emerald-300"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                Live socket updates enabled
              </div>

              <div
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                  isDark ? "bg-gray-800 text-gray-300" : "bg-white text-gray-700"
                }`}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Auto refresh every 15s
              </div>

              {lastUpdated && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Last sync: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

          <div
            className={`min-w-[280px] rounded-2xl border px-5 py-4 ${
              isDark
                ? "border-gray-700 bg-gray-800/70"
                : "border-white/80 bg-white/80"
            } backdrop-blur shadow-lg`}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 text-orange-600 bg-orange-100 rounded-xl dark:bg-orange-900/30 dark:text-orange-300">
                <Activity className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Last MRP Status
                </p>
                <p className="text-lg font-semibold">
                  {stats.lastMRP?.status || "No recent run"}
                </p>
              </div>
            </div>

            {canRunMRP && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={onOpenPlanner}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition bg-orange-500 rounded-xl hover:bg-orange-600"
                >
                  Run MRP Again
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <MetricCard key={card.title} card={card} isDark={isDark} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <EnhancedStockPanel
            isDark={isDark}
            refreshKey={refreshKey}
            onOpenMaterials={onOpenMaterials}
          />
        </div>

        <div className="space-y-6">
          <SmartAlerts />

          <div
            className={`rounded-2xl border p-5 shadow-sm ${
              isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Last MRP Run Summary</h3>
              {canRunMRP && (
                <button
                  onClick={onOpenPlanner}
                  className="inline-flex items-center gap-2 rounded-lg border border-orange-200 px-3 py-1.5 text-sm font-medium text-orange-600 transition hover:bg-orange-50 dark:border-orange-900/40 dark:text-orange-300 dark:hover:bg-orange-900/20"
                >
                  Run MRP Again
                </button>
              )}
            </div>

            <div className="space-y-3 text-sm">
              <SummaryRow label="Product" value={stats.lastMRP?.productName || "-"} />
              <SummaryRow
                label="Demand Quantity"
                value={String(stats.lastMRP?.demandQuantity ?? 0)}
              />
              <SummaryRow
                label="Shortage Count"
                value={String(stats.lastMRP?.shortageCount ?? 0)}
                danger={(stats.lastMRP?.shortageCount ?? 0) > 0}
              />
              <SummaryRow
                label="Total Shortage Qty"
                value={String(stats.lastMRP?.totalShortageQty ?? 0)}
                danger={(stats.lastMRP?.totalShortageQty ?? 0) > 0}
              />

              <div className="pt-3">
                <div className="flex items-center justify-between mb-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Planning Health</span>
                  <span>
                    {(stats.lowStockCount ?? 0) === 0 ? "Stable" : "Attention Needed"}
                  </span>
                </div>
                <div className="h-2 overflow-hidden bg-gray-200 rounded-full dark:bg-gray-700">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (stats.lowStockCount ?? 0) === 0 ? "bg-green-500" : "bg-orange-500"
                    }`}
                    style={{
                      width: `${(stats.lowStockCount ?? 0) === 0 ? 100 : 58}%`,
                    }}
                  />
                </div>
              </div>

              {canCreatePO && (stats.lastMRP?.shortageCount ?? 0) > 0 && (
                <div className="flex justify-start mt-4">
                  <button
                    onClick={onOpenPurchase}
                    className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                  >
                    Create PO
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`rounded-2xl border p-5 shadow-sm ${
          isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Operations Snapshot</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              A single view for inventory health, replenishment and planning readiness.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap">
            <SnapshotBadge label="Materials" value={stats.totalMaterials} tone="blue" />
            <SnapshotBadge label="Low Stock" value={stats.lowStockCount} tone="red" />
            <SnapshotBadge label="Pending PO" value={stats.pendingPOs} tone="amber" />
            <SnapshotBadge label="Received PO" value={stats.receivedPOs} tone="green" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  card,
  isDark,
}: {
  card: {
    title: string;
    value: number;
    sub: string;
    icon: React.ElementType;
    tone: string;
    trend: string;
    glow: string;
    action?: { label: string; onClick: () => void };
  };
  isDark: boolean;
}) {
  const Icon = card.icon;

  const cardMap: Record<string, string> = {
    blue: isDark
      ? "from-blue-950/70 to-slate-900 border-blue-900/50"
      : "from-blue-50 to-white border-blue-100",
    red: isDark
      ? "from-red-950/70 to-slate-900 border-red-900/50"
      : "from-red-50 to-white border-red-100",
    amber: isDark
      ? "from-yellow-950/70 to-slate-900 border-yellow-900/50"
      : "from-yellow-50 to-white border-yellow-100",
    green: isDark
      ? "from-green-950/70 to-slate-900 border-green-900/50"
      : "from-green-50 to-white border-green-100",
    violet: isDark
      ? "from-violet-950/70 to-slate-900 border-violet-900/50"
      : "from-violet-50 to-white border-violet-100",
    pink: isDark
      ? "from-pink-950/70 to-slate-900 border-pink-900/50"
      : "from-pink-50 to-white border-pink-100",
  };

  const iconMap: Record<string, string> = {
    blue: "text-blue-500 bg-blue-100 dark:bg-blue-900/40",
    red: "text-red-500 bg-red-100 dark:bg-red-900/40",
    amber: "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/40",
    green: "text-green-500 bg-green-100 dark:bg-green-900/40",
    violet: "text-violet-500 bg-violet-100 dark:bg-violet-900/40",
    pink: "text-pink-500 bg-pink-100 dark:bg-pink-900/40",
  };

  return (
    <div
      className={`group rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${cardMap[card.tone]} ${card.glow}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
          <div className="mt-3 text-4xl font-bold tracking-tight">
            <CountUpNumber value={card.value} />
          </div>
        </div>

        <div
          className={`rounded-2xl p-4 transition-transform duration-300 group-hover:scale-110 ${iconMap[card.tone]}`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{card.sub}</p>
          <p className="mt-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
            {card.trend}
          </p>
        </div>

        {card.action && (
          <button
            onClick={card.action.onClick}
            className="px-3 py-2 text-xs font-semibold text-white transition bg-orange-500 rounded-lg shrink-0 hover:bg-orange-600"
          >
            {card.action.label}
          </button>
        )}
      </div>
    </div>
  );
}

function EnhancedStockPanel({
  isDark,
  refreshKey,
  onOpenMaterials,
}: {
  isDark: boolean;
  refreshKey: number;
  onOpenMaterials: () => void;
}) {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchMaterials = async () => {
      try {
        const res = await fetch(`${API}/materials`);
        const raw = await res.json();
        const payload = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        if (active) {
          setMaterials(payload);
          setLoading(false);
        }
      } catch (err) {
        console.error("Smart stock panel fetch error:", err);
        if (active) setLoading(false);
      }
    };

    fetchMaterials();
    const interval = setInterval(fetchMaterials, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [refreshKey]);

  const rankedMaterials = useMemo(() => {
    const getSeverity = (item: MaterialItem) => {
      const current = Number(item.currentStock || 0);
      const min = Number(item.minStock || 0);

      if (current <= 0) return 0;
      if (min <= 0) return 3;

      const ratio = current / min;
      if (ratio <= 0.5) return 0;
      if (ratio <= 1) return 1;
      if (ratio <= 1.5) return 2;
      return 3;
    };

    return [...materials]
      .sort((a, b) => {
        const severityDiff = getSeverity(a) - getSeverity(b);
        if (severityDiff !== 0) return severityDiff;
        const aRatio = Number(a.currentStock || 0) / Math.max(Number(a.minStock || 0), 1);
        const bRatio = Number(b.currentStock || 0) / Math.max(Number(b.minStock || 0), 1);
        return aRatio - bRatio;
      })
      .slice(0, 6);
  }, [materials]);

  if (loading) {
    return (
      <div
        className={`rounded-2xl border p-5 ${
          isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
        }`}
      >
        <p className="text-gray-500 dark:text-gray-400">Loading smart stock panel...</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex flex-col gap-3 mb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-semibold">Smart Stock Panel</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sorted by urgency with live stock health visibility
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusMini label="Healthy" color="green" />
          <StatusMini label="Monitor" color="yellow" />
          <StatusMini label="Critical" color="red" />
          <button
            onClick={onOpenMaterials}
            className="px-3 py-2 ml-1 text-sm font-medium transition border border-gray-200 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            Open Materials
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {rankedMaterials.map((item) => {
          const current = Number(item.currentStock || 0);
          const min = Number(item.minStock || 0);
          const ratio = min > 0 ? current / min : current > 0 ? 2 : 0;
          const pct = Math.max(6, Math.min(ratio * 100, 100));
          const critical = current <= 0 || (min > 0 && ratio <= 0.5);
          const low = !critical && min > 0 && ratio <= 1;

          const coverageEstimate =
            current <= 0
              ? "0d left"
              : min <= 0
              ? "30+d est."
              : ratio <= 1
              ? `${Math.max(1, Math.ceil(ratio * 3))}d est.`
              : ratio <= 2
              ? `${Math.max(4, Math.ceil(ratio * 7))}d est.`
              : ratio <= 4
              ? `${Math.max(8, Math.ceil(ratio * 12))}d est.`
              : "30+d est.";

          const statusLabel = critical ? "Critical" : low ? "Monitor" : "Healthy";
          const barColor = critical
            ? "bg-red-500"
            : low
            ? "bg-yellow-500"
            : "bg-green-500";

          return (
            <div
              key={item._id}
              className={`rounded-2xl border p-4 transition-all ${
                critical
                  ? "border-red-200 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/20"
                  : low
                  ? "border-yellow-200 bg-yellow-50/40 dark:border-yellow-900/40 dark:bg-yellow-950/10"
                  : isDark
                  ? "border-gray-700 bg-gray-800/70"
                  : "border-gray-200 bg-white"
              } ${critical ? "shadow-[0_0_0_1px_rgba(239,68,68,0.12)]" : ""}`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-xl p-2 ${
                      critical
                        ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300"
                        : low
                        ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300"
                        : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300"
                    } ${critical ? "animate-pulse" : ""}`}
                  >
                    {critical ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : low ? (
                      <Clock3 className="w-4 h-4" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold">{item.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Supplier: {item.supplier || "Unknown"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold">
                    {current} {item.unit}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Min: {min} {item.unit}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    critical
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      : low
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  }`}
                >
                  {statusLabel}
                </span>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Coverage: {coverageEstimate}
                </span>
              </div>

              <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {critical
                    ? "Immediate attention needed"
                    : low
                    ? "Reorder soon"
                    : "Stock healthy"}
                </span>
                <span>
                  {min > 0 ? `${(ratio * 100).toFixed(1)}% of minimum` : "Min stock not set"}
                </span>
              </div>
            </div>
          );
        })}

        {rankedMaterials.length === 0 && (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            No materials found.
          </div>
        )}
      </div>
    </div>
  );
}

function StatusMini({
  label,
  color,
}: {
  label: string;
  color: "green" | "yellow" | "red";
}) {
  const map = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${map[color]}`} />
      <span>{label}</span>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`font-semibold ${danger ? "text-orange-600 dark:text-orange-300" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function CountUpNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Number(value || 0);
    const duration = 700;
    const stepTime = 16;
    const totalSteps = Math.max(1, Math.round(duration / stepTime));
    const increment = end / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
}

function SnapshotBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "blue" | "red" | "amber" | "green";
}) {
  const classes: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    red: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    amber: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    green: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  };

  return (
    <div className={`rounded-xl px-4 py-3 text-sm font-medium ${classes[tone]}`}>
      <span className="mr-2 opacity-80">{label}:</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

export default Dashboard;