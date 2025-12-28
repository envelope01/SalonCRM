const Client = require("../models/Client");

// CREATE
exports.createClient = async (req, res) => {
  try {
    const { name, phone, notes = "" } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }

    const client = await Client.create({
      name: name.trim(),
      phone: phone.trim(),
      notes,
    });

    res.status(201).json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// READ – all clients
exports.getClients = async (req, res) => {
  try {
    const clients = await Client.find({ isActive: true })
      .sort({ name: 1 });

    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// READ – single client
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json(client);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// SEARCH
exports.searchClients = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const regex = new RegExp(q, "i");

    const clients = await Client.find({
      isActive: true,
      $or: [{ name: regex }, { phone: regex }],
    }).limit(10);

    res.json(clients);
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

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json(client);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE (soft delete)
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json({ message: "Client deactivated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
