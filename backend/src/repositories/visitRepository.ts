import { asc, desc, eq, inArray } from "drizzle-orm";
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
  findClientById(id: string) {
    return db.select({ id: clients.id }).from(clients).where(eq(clients.id, id)).limit(1);
  },

  findServicesByIds(ids: string[]) {
    return db.select().from(services).where(inArray(services.id, ids));
  },

  async createVisitWithServices(values: {
    clientId: string;
    visitDate: Date;
    totalAmount: number;
    notes: string;
    lineItems: VisitLineInput[];
  }) {
    return db.transaction(async (tx) => {
      const [visit] = await tx.insert(visits).values({
        clientId: values.clientId,
        visitDate: values.visitDate,
        totalAmount: values.totalAmount,
        notes: values.notes,
      }).returning();

      const lineItems = await tx.insert(visitServices).values(
        values.lineItems.map((service, index) => ({
          visitId: visit.id,
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

  findByClientId(clientId: string) {
    return db
      .select()
      .from(visits)
      .where(eq(visits.clientId, clientId))
      .orderBy(desc(visits.visitDate));
  },

  findLineItemsForVisitIds(visitIds: string[]) {
    return db
      .select()
      .from(visitServices)
      .where(inArray(visitServices.visitId, visitIds))
      .orderBy(asc(visitServices.position));
  },

  deleteById(id: string) {
    return db.delete(visits).where(eq(visits.id, id)).returning();
  },
};
