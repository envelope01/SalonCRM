const { asc, desc, eq, inArray } = require("drizzle-orm");
const { db } = require("../src/db/index.ts");
const { clients, services: servicesTable, visits, visitServices } = require("../src/db/schema.ts");
const { formatVisit } = require("../src/db/serializers.ts");

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

    const [clientExists] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (!clientExists) {
      return res.status(404).json({ message: "Client not found" });
    }

    const serviceIds = services.map(s => s.serviceId);

    const dbServices = await db
      .select()
      .from(servicesTable)
      .where(inArray(servicesTable.id, serviceIds));

    const activeDbServices = dbServices.filter(service => service.isActive);

    if (activeDbServices.length !== serviceIds.length) {
      return res.status(400).json({ message: "Invalid or inactive service" });
    }

    const serviceMap = {};
    activeDbServices.forEach(s => {
      serviceMap[s.id] = s;
    });

    let totalAmount = 0;

    const visitLineItems = services.map(s => {
      const svc = serviceMap[s.serviceId];

      const basePrice = svc.price;
      const chargedPrice =
        typeof s.chargedPrice === "number" ? s.chargedPrice : basePrice;

      totalAmount += chargedPrice;

      return {
        serviceId: svc.id,
        name: svc.name,
        basePrice,
        chargedPrice,
        lineTotal: chargedPrice
      };
    });

    const { visit, lineItems } = await db.transaction(async (tx) => {
      const [visit] = await tx.insert(visits).values({
        clientId,
        visitDate: visitDate ? new Date(visitDate) : new Date(),
        totalAmount,
        notes
      }).returning();

      const lineItems = await tx.insert(visitServices).values(
        visitLineItems.map((service, index) => ({
          visitId: visit.id,
          serviceId: service.serviceId,
          position: index,
          name: service.name,
          basePrice: service.basePrice,
          chargedPrice: service.chargedPrice,
          lineTotal: service.lineTotal
        }))
      ).returning();

      return { visit, lineItems };
    });

    res.status(201).json(formatVisit(visit, lineItems));
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
    const rows = await db
      .select()
      .from(visits)
      .where(eq(visits.clientId, req.params.clientId))
      .orderBy(desc(visits.visitDate));

    if (rows.length === 0) {
      return res.json([]);
    }

    const lineItems = await db
      .select()
      .from(visitServices)
      .where(inArray(visitServices.visitId, rows.map(visit => visit.id)))
      .orderBy(asc(visitServices.position));

    const servicesByVisitId = lineItems.reduce((acc, lineItem) => {
      if (!acc[lineItem.visitId]) acc[lineItem.visitId] = [];
      acc[lineItem.visitId].push(lineItem);
      return acc;
    }, {});

    res.json(rows.map(visit => formatVisit(visit, servicesByVisitId[visit.id] || [])));
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   DELETE VISIT
========================= */
exports.deleteVisit = async (req, res) => {
  try {
    const [visit] = await db
      .delete(visits)
      .where(eq(visits.id, req.params.visitId))
      .returning();
    if (!visit) {
      return res.status(404).json({ message: "Visit not found" });
    }
    res.json({ message: "Visit deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};
