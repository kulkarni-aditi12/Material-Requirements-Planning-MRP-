import mongoose from "mongoose";
import dotenv from "dotenv";
import Material from "./models/Material.js";
import connectDB from "./config/db.js";

dotenv.config();

connectDB();

const seedMaterials = async () => {
  try {
    await Material.deleteMany();

    const materials = [
      {
        name: "Steel Rods (10mm)",
        unit: "pcs",
        supplier: "MetalCorp Ltd",
        minStock: 100,
        currentStock: 500,
        unitPrice: 12.0
      },
      {
        name: "Aluminum Sheets",
        unit: "kg",
        supplier: "AlumTech Inc",
        minStock: 50,
        currentStock: 45,
        unitPrice: 36.0
      },
      {
        name: "Copper Wire",
        unit: "m",
        supplier: "WireTech Co",
        minStock: 25,
        currentStock: 15,
        unitPrice: 9.5
      },
      {
        name: "Plastic Pellets",
        unit: "kg",
        supplier: "PolySupply",
        minStock: 75,
        currentStock: 200,
        unitPrice: 8.67
      },
    ];

    await Material.insertMany(materials);
    console.log("Materials Seeded!");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedMaterials();
