import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import { clients, services, visits, visitServices } from "../db/schema";

type VisitLineInput = {
  serviceId: string;
  name: string;
  basePrice: number;
  chargedPrice: number;
  lineTotal: number;
};

export const visitRepository = {
  findClientById(id: string, salonId: string) {
    return db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.salonId, salonId)))
      .limit(1);
  },

  findServicesByIds(ids: string[], salonId: string) {
    return db.select().from(services).where(and(inArray(services.id, ids), eq(services.salonId, salonId)));
  },

  async createVisitWithServices(values: {
    clientId: string;
    salonId: string;
    visitDate: Date;
    totalAmount: number;
    notes: string;
    lineItems: VisitLineInput[];
  }) {
    return db.transaction(async (tx) => {
      const [visit] = await tx.insert(visits).values({
          clientId: values.clientId,
          salonId: values.salonId,
          visitDate: values.visitDate,
        totalAmount: values.totalAmount,
        notes: values.notes,
      }).returning();

      const lineItems = await tx.insert(visitServices).values(
        values.lineItems.map((service, index) => ({
          visitId: visit.id,
          salonId: values.salonId,
          serviceId: service.serviceId,
          position: index,
          name: service.name,
          basePrice: service.basePrice,
          chargedPrice: service.chargedPrice,
          lineTotal: service.lineTotal,
        })),
      ).returning();

      return { visit, lineItems };
    });
  },

  findByClientId(clientId: string, salonId: string) {
    return db
      .select()
      .from(visits)
      .where(and(eq(visits.clientId, clientId), eq(visits.salonId, salonId)))
      .orderBy(desc(visits.visitDate));
  },

  findLineItemsForVisitIds(visitIds: string[]) {
    return db
      .select()
      .from(visitServices)
      .where(inArray(visitServices.visitId, visitIds))
      .orderBy(asc(visitServices.position));
  },

  deleteById(id: string, salonId: string) {
    return db.delete(visits).where(and(eq(visits.id, id), eq(visits.salonId, salonId))).returning();
  },
};
