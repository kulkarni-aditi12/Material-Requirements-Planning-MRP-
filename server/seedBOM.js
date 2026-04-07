// server/seedBOM.js
import connectDB from "./config/db.js";
import BOM from "./models/BOM.js";

async function seed() {
  await connectDB();
  await BOM.deleteMany({});
  const r = await BOM.create({
    productName: "Refrigerator Compressor Unit",
    version: "2.1",
    materials: [
      { name: "Steel Housing", quantity: 1, unit: "pcs", unitCost: 45, supplier: "MetalCorp Ltd", leadTimeDays: 5 },
      { name: "Copper Tubing", quantity: 2.5, unit: "m", unitCost: 12, supplier: "WireTech Co", leadTimeDays: 3 }
    ]
  });
  console.log("Seeded:", r._id);
  process.exit(0);
}
seed();
