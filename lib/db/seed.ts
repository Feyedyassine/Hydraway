import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { hashSync } from "bcryptjs";
import * as schema from "./schema";

async function seed() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const db = drizzle(client, { schema });

  // Seed admin user
  const existing = await db.select().from(schema.users).limit(1);
  if (existing.length === 0) {
    await db.insert(schema.users).values({
      email: "admin@hydraway.tn",
      passwordHash: hashSync("changeme123", 10),
      name: "Admin",
      role: "admin",
    });
    console.log("Admin user created (admin@hydraway.tn / changeme123)");
  } else {
    console.log("Users already exist, skipping admin seed.");
  }

  // Seed default product
  const existingProducts = await db.select().from(schema.products).limit(1);
  if (existingProducts.length === 0) {
    await db.insert(schema.products).values({
      name: "HydraWay Red Berries",
      nameFr: "HydraWay Fruits Rouges",
      description: "15 electrolyte sticks with red berries flavor.",
      descriptionFr: "15 sticks d'électrolytes au goût fruits rouges.",
      price: 29.9,
      stock: 100,
      image: "/images/hydraway_pack.png",
      active: true,
    });
    console.log("Default product seeded.");
  } else {
    console.log("Products already exist, skipping product seed.");
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
