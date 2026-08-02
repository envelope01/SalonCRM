import { formatClient } from "../db/serializers";
import { badRequest, notFound } from "../lib/httpErrors";
import {
  optionalPhone,
  optionalText,
  requireText,
  requireUuid,
} from "../lib/validation";
import { clientRepository } from "../repositories/clientRepository";

const allowedUpdateFields = ["name", "phone", "notes", "isActive"];

async function addVisitSummaries(clients: any[]) {
  const summaries = await clientRepository.findVisitSummariesForClientIds(
    clients.map((client) => client.id),
  );
  const summaryByClientId = new Map(
    summaries.map((summary: any) => [summary.clientId, summary]),
  );

  return clients.map((client) => ({
    ...client,
    lastVisit: summaryByClientId.get(client.id)?.lastVisit ?? null,
    totalSpent: Number(summaryByClientId.get(client.id)?.totalSpent || 0),
  }));
}

export const clientService = {
  async createClient(body: any) {
    const { name, phone, notes = "" } = body;

    if (!name) throw badRequest("Name is required");

    const normalizedPhone = optionalPhone(phone);
    if (typeof normalizedPhone === "string") {
      const [existing] = await clientRepository.findActiveByPhone(normalizedPhone);
      if (existing) throw badRequest("Client with this phone number already exists");
    }

    const [client] = await clientRepository.create({
      name: requireText(name, "Name", { max: 120 }),
      phone: normalizedPhone,
      notes: optionalText(notes, { max: 1000 }),
    });

    return formatClient(client);
  },

  async getClients() {
    const rows = await clientRepository.findActive();
    const clientsWithSummaries = await addVisitSummaries(rows);
    return clientsWithSummaries.map(formatClient);
  },

  async getClientById(id: string) {
    const clientId = requireUuid(id);
    const [client] = await clientRepository.findById(clientId);
    if (!client) throw notFound("Client not found");

    const [clientWithSummary] = await addVisitSummaries([client]);
    return formatClient(clientWithSummary);
  },

  async searchClients(query: unknown) {
    if (!query) return [];

    const rows = await clientRepository.searchActive(String(query).trim());
    return rows.map(formatClient);
  },

  async updateClient(id: string, body: any) {
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
      const [existing] = await clientRepository.findActiveByPhoneExceptId(updates.phone, clientId);
      if (existing) throw badRequest("Client with this phone number already exists");
    }

    const [client] = await clientRepository.updateById(clientId, updates);
    if (!client) throw notFound("Client not found");

    return formatClient(client);
  },

  async deactivateClient(id: string) {
    const [client] = await clientRepository.deactivateById(requireUuid(id));
    if (!client) throw notFound("Client not found");

    return { message: "Client deactivated successfully" };
  },
};
