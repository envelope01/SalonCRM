import { formatService } from "../db/serializers";
import { badRequest, notFound } from "../lib/httpErrors";
import { optionalText, requireMoney, requireText, requireUuid } from "../lib/validation";
import { serviceRepository } from "../repositories/serviceRepository";

export const serviceService = {
  async addService(body: any) {
    const { name, category, price } = body;

    if (!name || price == null) throw badRequest("Name and price are required");

    const trimmedName = requireText(name, "Name", { max: 120 });
    const [existing] = await serviceRepository.findByName(trimmedName);
    if (existing) throw badRequest("Service with this name already exists");

    const [service] = await serviceRepository.create({
      name: trimmedName,
      category: optionalText(category, { max: 80 }),
      price: requireMoney(price, "Price"),
    });

    return formatService(service);
  },

  async getServices() {
    const rows = await serviceRepository.findAll();
    return rows.map(formatService);
  },

  async updateService(id: string, body: any) {
    const serviceId = requireUuid(id);
    const [service] = await serviceRepository.findById(serviceId);
    if (!service) throw notFound("Service not found");

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = requireText(body.name, "Name", { max: 120 });
    if (body.category !== undefined) updates.category = optionalText(body.category, { max: 80 });
    if (body.price !== undefined) updates.price = requireMoney(body.price, "Price");
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    const [updated] = await serviceRepository.updateById(serviceId, updates);
    return formatService(updated);
  },

  async deleteService(id: string) {
    const [service] = await serviceRepository.deleteById(requireUuid(id));
    if (!service) throw notFound("Service not found");

    return {
      message: "Service deleted successfully",
      service: formatService(service),
    };
  },

  async toggleServiceStatus(id: string) {
    const serviceId = requireUuid(id);
    const [service] = await serviceRepository.findById(serviceId);
    if (!service) throw notFound("Service not found");

    const [updated] = await serviceRepository.updateById(serviceId, {
      isActive: !service.isActive,
    });

    return {
      message: `Service ${updated.isActive ? "activated" : "deactivated"} successfully`,
      service: formatService(updated),
    };
  },
};
