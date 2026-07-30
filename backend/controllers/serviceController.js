const { asc, eq } = require("drizzle-orm");
const { db } = require("../src/db/index.ts");
const { services } = require("../src/db/schema.ts");
const { formatService } = require("../src/db/serializers.ts");

// Add new service
exports.addService = async (req, res) => {
  try {
    const { name, category, price } = req.body;

    if (!name || price == null) {
      return res
        .status(400)
        .json({ message: "Name and price are required" });
    }

    const [existing] = await db
      .select()
      .from(services)
      .where(eq(services.name, name.trim()))
      .limit(1);

    if (existing) {
      return res
        .status(400)
        .json({ message: "Service with this name already exists" });
    }

    const [service] = await db.insert(services).values({
      name: name.trim(),
      category: category || "",
      price: Number(price),
    }).returning();

    res.status(201).json(formatService(service));
  } catch (error) {
    console.error("Error adding service:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all active services
exports.getServices = async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(services)
      .orderBy(asc(services.name));

    res.json(rows.map(formatService));
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update service (name / category / price)
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, isActive } = req.body;

    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, id))
      .limit(1);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const updates = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name.trim();
    if (category !== undefined) updates.category = category;
    if (price !== undefined) updates.price = Number(price);
    if (isActive !== undefined) updates.isActive = isActive;

    const [updated] = await db
      .update(services)
      .set(updates)
      .where(eq(services.id, id))
      .returning();

    res.json(formatService(updated));
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete service permanently
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const [service] = await db
      .delete(services)
      .where(eq(services.id, id))
      .returning();

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json({
      message: "Service deleted successfully",
      service: formatService(service),
    });

  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Toggle active/inactive status
exports.toggleServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, id))
      .limit(1);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const [updated] = await db
      .update(services)
      .set({ isActive: !service.isActive, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();

    res.json({
      message: `Service ${updated.isActive ? "activated" : "deactivated"} successfully`,
      service: formatService(updated),
    });
  } catch (error) {
    console.error("Error toggling service:", error);
    res.status(500).json({ message: "Server error" });
  }
};

