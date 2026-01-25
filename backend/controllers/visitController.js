const mongoose = require("mongoose");
const Visit = require("../models/Visit");
const Client = require("../models/Client");
const Service = require("../models/Service");

/* =========================
   CREATE VISIT
========================= */
exports.createVisit = async (req, res) => {
  try {
    const { clientId, visitDate, services = [], notes = "" } = req.body;

    if (!clientId) {
      return res.status(400).json({ message: "clientId is required" });
    }

    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ message: "At least one service is required" });
    }

    const clientExists = await Client.exists({ _id: clientId });
    if (!clientExists) {
      return res.status(404).json({ message: "Client not found" });
    }

    const serviceIds = services.map(s => new mongoose.Types.ObjectId(s.serviceId));

    const dbServices = await Service.find({
      _id: { $in: serviceIds },
      isActive: true
    });

    if (dbServices.length !== serviceIds.length) {
      return res.status(400).json({ message: "Invalid or inactive service" });
    }

    const serviceMap = {};
    dbServices.forEach(s => {
      serviceMap[s._id.toString()] = s;
    });

    let totalAmount = 0;

    const visitServices = services.map(s => {
      const svc = serviceMap[s.serviceId];

      const basePrice = svc.price;
      const chargedPrice =
        typeof s.chargedPrice === "number" ? s.chargedPrice : basePrice;

      totalAmount += chargedPrice;

      return {
        service: svc._id,
        name: svc.name,
        basePrice,
        chargedPrice,
        lineTotal: chargedPrice
      };
    });

    const visit = await Visit.create({
      client: clientId,
      visitDate: visitDate || new Date(),
      services: visitServices,
      totalAmount,
      notes
    });

    res.status(201).json(visit);
  } catch (err) {
    console.error("Create visit error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   READ – CLIENT VISITS
========================= */
exports.getClientVisits = async (req, res) => {
  try {
    const visits = await Visit.find({ client: req.params.clientId })
      .sort({ visitDate: -1 });

    res.json(visits);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   DELETE VISIT
========================= */
exports.deleteVisit = async (req, res) => {
  try {
    const visit = await Visit.findByIdAndDelete(req.params.visitId);
    if (!visit) {
      return res.status(404).json({ message: "Visit not found" });
    }
    res.json({ message: "Visit deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};
