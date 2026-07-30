import { formatVisit } from "../db/serializers";
import { badRequest, notFound } from "../lib/httpErrors";
import { optionalDate, optionalMoney, optionalText, requireUuid } from "../lib/validation";
import { visitRepository } from "../repositories/visitRepository";

export const visitService = {
  async createVisit(body: any) {
    const { clientId, visitDate, services = [], notes = "" } = body;

    if (!clientId) throw badRequest("clientId is required");
    if (!Array.isArray(services) || services.length === 0) {
      throw badRequest("At least one service is required");
    }

    const validatedClientId = requireUuid(clientId, "clientId");
    const [clientExists] = await visitRepository.findClientById(validatedClientId);
    if (!clientExists) throw notFound("Client not found");

    const serviceIds = services.map((service: any) => requireUuid(service.serviceId, "serviceId"));
    const uniqueServiceIds = Array.from(new Set(serviceIds));
    const dbServices = await visitRepository.findServicesByIds(uniqueServiceIds);
    const activeDbServices = dbServices.filter((service) => service.isActive);

    if (activeDbServices.length !== uniqueServiceIds.length) {
      throw badRequest("Invalid or inactive service");
    }

    const serviceMap: Record<string, any> = {};
    activeDbServices.forEach((service) => {
      serviceMap[service.id] = service;
    });

    let totalAmount = 0;

    const lineItems = services.map((service: any, index: number) => {
      const svc = serviceMap[serviceIds[index]];
      const basePrice = svc.price;
      const chargedPrice = optionalMoney(service.chargedPrice, "Charged price") ?? basePrice;

      totalAmount += chargedPrice;

      return {
        serviceId: svc.id,
        name: svc.name,
        basePrice,
        chargedPrice,
        lineTotal: chargedPrice,
      };
    });

    const result = await visitRepository.createVisitWithServices({
      clientId: validatedClientId,
      visitDate: optionalDate(visitDate, "Visit date") || new Date(),
      totalAmount,
      notes: optionalText(notes, { max: 1000 }),
      lineItems,
    });

    return formatVisit(result.visit, result.lineItems);
  },

  async getClientVisits(clientId: string) {
    const rows = await visitRepository.findByClientId(requireUuid(clientId, "clientId"));
    if (rows.length === 0) return [];

    const lineItems = await visitRepository.findLineItemsForVisitIds(rows.map((visit) => visit.id));
    const servicesByVisitId = lineItems.reduce<Record<string, typeof lineItems>>((acc, lineItem) => {
      if (!acc[lineItem.visitId]) acc[lineItem.visitId] = [];
      acc[lineItem.visitId].push(lineItem);
      return acc;
    }, {});

    return rows.map((visit) => formatVisit(visit, servicesByVisitId[visit.id] || []));
  },

  async deleteVisit(visitId: string) {
    const [visit] = await visitRepository.deleteById(requireUuid(visitId, "visitId"));
    if (!visit) throw notFound("Visit not found");

    return { message: "Visit deleted" };
  },
};
