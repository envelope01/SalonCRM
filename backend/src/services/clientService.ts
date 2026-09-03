import { formatClient } from "../db/serializers";
import { badRequest, notFound } from "../lib/httpErrors";
import {
  optionalPhone,
  optionalText,
  requireText,
  requireUuid,
} from "../lib/validation";
import { clientRepository } from "../repositories/clientRepository";
import { requireSalonId } from "./tenantContext";

const allowedUpdateFields = ["name", "phone", "notes", "isActive"];

type VisitSummary = {
  clientId: string;
  lastVisit: Date | null;
  totalSpent: number | string | null;
};

async function addVisitSummaries(clients: any[]) {
  const summaries: VisitSummary[] = await clientRepository.findVisitSummariesForClientIds(
    clients.map((client) => client.id),
  );
  const summaryByClientId = new Map(
    summaries.map((summary) => [summary.clientId, summary]),
  );

  return clients.map((client) => ({
    ...client,
    lastVisit: summaryByClientId.get(client.id)?.lastVisit ?? null,
    totalSpent: Number(summaryByClientId.get(client.id)?.totalSpent || 0),
  }));
}

export const clientService = {
  async createClient(body: any, user?: any) {
    const salonId = requireSalonId(user);
    const { name, phone, notes = "" } = body;

    if (!name) throw badRequest("Name is required");

    const normalizedPhone = optionalPhone(phone);
    if (typeof normalizedPhone === "string") {
      const [existing] = await clientRepository.findActiveByPhone(normalizedPhone, salonId);
      if (existing) throw badRequest("Client with this phone number already exists");
    }

    const [client] = await clientRepository.create({
      name: requireText(name, "Name", { max: 120 }),
      phone: normalizedPhone,
      notes: optionalText(notes, { max: 1000 }),
      salonId,
    });

    return formatClient(client);
  },

  async getClients(user?: any) {
    const rows = await clientRepository.findActive(requireSalonId(user));
    const clientsWithSummaries = await addVisitSummaries(rows);
    return clientsWithSummaries.map(formatClient);
  },

  async getClientById(id: string, user?: any) {
    const clientId = requireUuid(id);
    const [client] = await clientRepository.findById(clientId, requireSalonId(user));
    if (!client) throw notFound("Client not found");

    const [clientWithSummary] = await addVisitSummaries([client]);
    return formatClient(clientWithSummary);
  },

  async searchClients(query: unknown, user?: any) {
    if (!query) return [];

    const rows = await clientRepository.searchActive(String(query).trim(), requireSalonId(user));
    return rows.map(formatClient);
  },

  async updateClient(id: string, body: any, user?: any) {
    const salonId = requireSalonId(user);
    const clientId = requireUuid(id);
    const updates: Record<string, unknown> = {};

    allowedUpdateFields.forEach((field) => {
      if (body[field] !== undefined) {
        if (field === "name") updates.name = requireText(body.name, "Name", { max: 120 });
        else if (field === "phone") updates.phone = optionalPhone(body.phone);
        else if (field === "notes") updates.notes = optionalText(body.notes, { max: 1000 });
        else if (field === "isActive") updates.isActive = Boolean(body.isActive);
      }
    });

    if (typeof updates.phone === "string") {
      const [existing] = await clientRepository.findActiveByPhoneExceptId(updates.phone, clientId, salonId);
      if (existing) throw badRequest("Client with this phone number already exists");
    }

    const [client] = await clientRepository.updateById(clientId, updates, salonId);
    if (!client) throw notFound("Client not found");

    return formatClient(client);
  },

  async deactivateClient(id: string, user?: any) {
    const [client] = await clientRepository.deactivateById(requireUuid(id), requireSalonId(user));
    if (!client) throw notFound("Client not found");

    return { message: "Client deactivated successfully" };
  },
};
