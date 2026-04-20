import crypto from "node:crypto";
import type { Request, Response } from "express";
import { HttpError } from "../middleware/errorHandler.js";
import * as orderModel from "../models/orderModel.js";
import * as qrService from "../services/qrService.js";
import * as smsService from "../services/smsService.js";
import { parseTenDigitPhone } from "../util/phone.js";

/** Prefix + base36 timestamp (fits VARCHAR(20), stable & sortable). */
function generateOrderId(): string {
  return `SP-${Date.now().toString(36).toUpperCase()}`;
}

export async function listOrders(_req: Request, res: Response): Promise<void> {
  const rows = await orderModel.listOrders();
  res.json(rows);
}

export async function getByOrderId(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params;
  if (!orderId) {
    throw new HttpError(400, "orderId is required");
  }
  const row = await orderModel.findByPublicOrderId(orderId);
  if (!row) {
    throw new HttpError(404, "order not found");
  }
  res.json(row);
}

export async function getPublicOrderDetails(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params;
  if (!orderId) {
    throw new HttpError(400, "orderId is required");
  }
  const row = await orderModel.findByPublicOrderId(orderId);
  if (!row) {
    throw new HttpError(404, "order not found");
  }
  
  res.json({
    order_id: row.order_id,
    created_at: row.created_at,
    rack_number: row.rack_number,
    qr_code_base64: row.qr_code_base64,
  });
}

export async function createOrder(req: Request, res: Response): Promise<void> {
  const uid = req.user?.id;
  if (!uid) {
    throw new HttpError(401, "unauthorized");
  }
  const body = req.body as {
    receiver_name?: string;
    phone_number?: string;
    description?: string;
    location?: string;
    rack_number?: string;
  };
  const receiver_name = body.receiver_name?.trim();
  if (!receiver_name) {
    throw new HttpError(400, "receiver_name is required");
  }
  const rawPhone =
    typeof body.phone_number === "number" ? String(body.phone_number) : (body.phone_number ?? "").trim();
  if (!rawPhone) {
    throw new HttpError(400, "phone_number is required");
  }
  const phone_number = parseTenDigitPhone(rawPhone);

  let order_id = generateOrderId();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const clash = await orderModel.findByPublicOrderId(order_id);
    if (!clash) break;
    order_id = generateOrderId();
  }

  const baseUrl = process.env.PUBLIC_APP_URL || "http://localhost:9002";
  const qr = await qrService.generateQrDataUrl(`${baseUrl}/p/${order_id}`);

  const row = await orderModel.insertOrder({
    order_id,
    receiver_name,
    phone_number,
    description: body.description ?? null,
    location: body.location ?? null,
    rack_number: body.rack_number ?? null,
    qr_code_base64: qr,
    created_by: uid,
  });

  await smsService.sendOrderIntakeNotification(String(phone_number), order_id);

  res.status(201).json(row);
}

export async function sendOtp(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params;
  if (!orderId) {
    throw new HttpError(400, "orderId is required");
  }
  const row = await orderModel.findByPublicOrderId(orderId);
  if (!row) {
    throw new HttpError(404, "order not found");
  }
  if (row.status === "collected") {
    throw new HttpError(400, "order already collected");
  }

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const updated = await orderModel.setOtpForOrder(orderId, code, expiresAt);
  if (!updated) {
    throw new HttpError(500, "failed to save OTP");
  }

  await smsService.sendOtpSms(String(row.phone_number), code);

  res.json({
    order_id: orderId,
    otp_expires_at: expiresAt.toISOString(),
  });
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params;
  const body = req.body as { code?: string };
  const raw = body.code?.trim() ?? "";
  if (!orderId) {
    throw new HttpError(400, "orderId is required");
  }
  if (!/^\d{6}$/.test(raw)) {
    throw new HttpError(400, "code must be a 6-digit string");
  }

  const row = await orderModel.findByPublicOrderId(orderId);
  if (!row) {
    throw new HttpError(404, "order not found");
  }
  if (!row.otp_code || !row.otp_expires_at) {
    throw new HttpError(400, "no OTP sent for this order");
  }
  if (new Date() > new Date(row.otp_expires_at)) {
    throw new HttpError(400, "OTP expired");
  }
  if (row.otp_code !== raw) {
    throw new HttpError(403, "invalid code");
  }

  const updated = await orderModel.setOtpVerified(orderId);
  if (!updated) {
    throw new HttpError(500, "failed to verify OTP");
  }

  res.json({ order_id: orderId, otp_verified: true });
}

export async function collect(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params;
  if (!orderId) {
    throw new HttpError(400, "orderId is required");
  }
  const row = await orderModel.findByPublicOrderId(orderId);
  if (!row) {
    throw new HttpError(404, "order not found");
  }
  if (!row.otp_verified) {
    throw new HttpError(400, "OTP must be verified before collection");
  }

  const updated = await orderModel.collectOrder(orderId);
  if (!updated) {
    throw new HttpError(400, "cannot collect — check status or OTP");
  }

  // Send security notification after successful collect
  await smsService.sendOrderCollectedNotification(String(row.phone_number), orderId);

  res.json(updated);
}

export async function remind(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params;
  if (!orderId) throw new HttpError(400, "orderId is required");
  const row = await orderModel.findByPublicOrderId(orderId);
  if (!row) throw new HttpError(404, "order not found");
  
  await smsService.sendReminderSms(String(row.phone_number), orderId);
  await orderModel.updateLastReminded(orderId);
  res.json({ success: true, message: "Reminder sent" });
}

export async function updateRack(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params;
  const { rack } = req.body as { rack?: string };
  if (!orderId) throw new HttpError(400, "orderId is required");
  if (!rack) throw new HttpError(400, "rack is required");
  
  const updated = await orderModel.updateOrderRack(orderId, rack);
  if (!updated) throw new HttpError(404, "order not found");
  res.json({ success: true, rack: updated.rack_number });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params;
  if (!orderId) throw new HttpError(400, "orderId is required");
  
  const deleted = await orderModel.deleteOrder(orderId);
  if (!deleted) throw new HttpError(404, "order not found");
  res.json({ success: true });
}
