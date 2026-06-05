import nodemailer from "nodemailer";
import QRCode from "qrcode";
import { EmailLog } from "../models/EmailLog.js";

export function buildRegistrationEmail({ delegate, event, qrDataUrl }) {
  const subject = `Your QR Code for ${event.name}`;
  const body = `Hello ${delegate.fullName},\n\nThank you for registering for ${event.name}.\n\nYour registration is confirmed.\n\nPlease present this QR code at the event entrance for check-in and badge printing.\n\nDelegate ID: ${delegate.delegateId}\n\nThank you,\nAfterglow Register Team`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#222;max-width:560px;margin:auto;border:1px solid #eee;border-radius:12px;padding:24px">
      <h2 style="margin:0 0 8px;color:#CF6B11">Afterglow Register</h2>
      <p>Hello <strong>${delegate.fullName}</strong>,</p>
      <p>Thank you for registering for <strong>${event.name}</strong>.</p>
      <p>Your registration is confirmed.</p>
      <p>Please present this QR code at the event entrance for check-in and badge printing.</p>
      <div style="text-align:center;margin:22px 0">
        <img src="${qrDataUrl}" alt="QR Code" width="180" height="180" style="border:1px solid #ddd;border-radius:8px;padding:8px" />
        <div style="font-size:12px;color:#555;margin-top:8px">Delegate ID: <strong>${delegate.delegateId}</strong></div>
      </div>
      <p>Thank you,<br/>Afterglow Register Team</p>
    </div>
  `;

  return { subject, body, html };
}

export async function sendRegistrationEmail({ delegate, event }) {
  const qrPayload = JSON.stringify({ eventId: event._id.toString(), delegateId: delegate.delegateId, qrToken: delegate.qrToken });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 360, margin: 2 });
  const { subject, body, html } = buildRegistrationEmail({ delegate, event, qrDataUrl });

  const emailEnabled = String(process.env.ENABLE_EMAIL).toLowerCase() === "true";

  if (!emailEnabled) {
    await EmailLog.create({
      delegate: delegate._id,
      event: event._id,
      to: delegate.email,
      subject,
      body,
      qrDataUrl,
      status: "simulated",
    });
    return { status: "simulated", subject, body, qrDataUrl };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: delegate.email,
      subject,
      text: body,
      html,
    });

    await EmailLog.create({
      delegate: delegate._id,
      event: event._id,
      to: delegate.email,
      subject,
      body,
      qrDataUrl,
      status: "sent",
    });
    return { status: "sent", subject, body, qrDataUrl };
  } catch (error) {
    await EmailLog.create({
      delegate: delegate._id,
      event: event._id,
      to: delegate.email,
      subject,
      body,
      qrDataUrl,
      status: "failed",
      error: error.message,
    });
    return { status: "failed", error: error.message, subject, body, qrDataUrl };
  }
}
