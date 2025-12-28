const Service = require("../models/Service");

// Add new service
exports.addService = async (req, res) => {
  try {
    const { name, category, price } = req.body;

    if (!name || price == null) {
      return res
        .status(400)
        .json({ message: "Name and price are required" });
    }

    const existing = await Service.findOne({ name: name.trim() });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Service with this name already exists" });
    }

    const service = new Service({
      name: name.trim(),
      category,
      price,
    });

    await service.save();
    res.status(201).json(service);
  } catch (error) {
    console.error("Error adding service:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all active services
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ name: 1 });
    res.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update service (name / category / price)
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, isActive } = req.body;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (name !== undefined) service.name = name.trim();
    if (category !== undefined) service.category = category;
    if (price !== undefined) service.price = price;
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();
    res.json(service);
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Soft delete (deactivate) service
// exports.deleteService = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const service = await Service.findById(id);
//     if (!service) {
//       return res.status(404).json({ message: "Service not found" });
//     }

//     service.isActive = false;
//     await service.save();

//     res.json({ message: "Service deactivated" });
//   } catch (error) {
//     console.error("Error deleting service:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// Toggle active/inactive status
exports.toggleServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    service.isActive = !service.isActive; // toggle
    await service.save();

    res.json({
      message: `Service ${service.isActive ? "activated" : "deactivated"} successfully`,
      service,
    });
  } catch (error) {
    console.error("Error toggling service:", error);
    res.status(500).json({ message: "Server error" });
  }
};

