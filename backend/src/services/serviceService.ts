import { formatService } from "../db/serializers";
import { badRequest, notFound } from "../lib/httpErrors";
import { optionalText, requireMoney, requireText, requireUuid } from "../lib/validation";
import { serviceRepository } from "../repositories/serviceRepository";
import { requireSalonId } from "./tenantContext";

export const serviceService = {
  async addService(body: any, user?: any) {
    const salonId = requireSalonId(user);
    const { name, category, price } = body;

    if (!name || price == null) throw badRequest("Name and price are required");

    const trimmedName = requireText(name, "Name", { max: 120 });
    const [existing] = await serviceRepository.findByName(trimmedName, salonId);
    if (existing) throw badRequest("Service with this name already exists");

    const [service] = await serviceRepository.create({
      name: trimmedName,
      category: optionalText(category, { max: 80 }),
      price: requireMoney(price, "Price"),
      salonId,
    });

    return formatService(service);
  },

  async getServices(user?: any) {
    const rows = await serviceRepository.findAll(requireSalonId(user));
    return rows.map(formatService);
  },

  async updateService(id: string, body: any, user?: any) {
    const salonId = requireSalonId(user);
    const serviceId = requireUuid(id);
    const [service] = await serviceRepository.findById(serviceId, salonId);
    if (!service) throw notFound("Service not found");

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = requireText(body.name, "Name", { max: 120 });
    if (body.category !== undefined) updates.category = optionalText(body.category, { max: 80 });
    if (body.price !== undefined) updates.price = requireMoney(body.price, "Price");
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    const [updated] = await serviceRepository.updateById(serviceId, updates, salonId);
    return formatService(updated);
  },

  async deleteService(id: string, user?: any) {
    const [service] = await serviceRepository.deleteById(requireUuid(id), requireSalonId(user));
    if (!service) throw notFound("Service not found");

    return {
      message: "Service deleted successfully",
      service: formatService(service),
    };
  },

  async toggleServiceStatus(id: string, user?: any) {
    const salonId = requireSalonId(user);
    const serviceId = requireUuid(id);
    const [service] = await serviceRepository.findById(serviceId, salonId);
    if (!service) throw notFound("Service not found");

    const [updated] = await serviceRepository.updateById(serviceId, {
      isActive: !service.isActive,
    }, salonId);

    return {
      message: `Service ${updated.isActive ? "activated" : "deactivated"} successfully`,
      service: formatService(updated),
    };
  },
};
