const { asyncHandler } = require("../src/lib/asyncHandler.ts");
const { appointmentService } = require("../src/services/appointmentService.ts");

exports.createAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.createAppointment(req.body, req.user);
  res.status(201).json(appointment);
});

exports.getAppointments = asyncHandler(async (req, res) => {
  const appointments = await appointmentService.getAppointments(req.query, req.user);
  res.json(appointments);
});

exports.updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.updateAppointment(req.params.id, req.body, req.user);
  res.json(appointment);
});

exports.deleteAppointment = asyncHandler(async (req, res) => {
  const result = await appointmentService.deleteAppointment(req.params.id, req.user);
  res.json(result);
});
