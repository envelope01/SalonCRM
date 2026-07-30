const { asc, and, eq, ilike, or } = require("drizzle-orm");
const { db } = require("../src/db/index.ts");
const { clients } = require("../src/db/schema.ts");
const { formatClient } = require("../src/db/serializers.ts");

// CREATE
exports.createClient = async (req, res) => {
  try {
    const { name, phone, notes = "" } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }

    const [client] = await db.insert(clients).values({
      name: name.trim(),
      phone: phone.trim(),
      notes,
    }).returning();

    res.status(201).json(formatClient(client));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// READ – all clients
exports.getClients = async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(clients)
      .where(eq(clients.isActive, true))
      .orderBy(asc(clients.name));

    res.json(rows.map(formatClient));
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// READ – single client
exports.getClientById = async (req, res) => {
  try {
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, req.params.id))
      .limit(1);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json(formatClient(client));
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// SEARCH
exports.searchClients = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const term = `%${q}%`;
    const rows = await db
      .select()
      .from(clients)
      .where(and(
        eq(clients.isActive, true),
        or(ilike(clients.name, term), ilike(clients.phone, term))
      ))
      .limit(10);

    res.json(rows.map(formatClient));
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE
exports.updateClient = async (req, res) => {
  try {
    const updates = {};
    const allowedFields = ["name", "phone", "notes", "isActive"];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] =
          typeof req.body[field] === "string"
            ? req.body[field].trim()
            : req.body[field];
      }
    });

    const [client] = await db
      .update(clients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clients.id, req.params.id))
      .returning();

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json(formatClient(client));
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE (soft delete)
exports.deleteClient = async (req, res) => {
  try {
    const [client] = await db
      .update(clients)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(clients.id, req.params.id))
      .returning();

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json({ message: "Client deactivated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
