import nodemailer from "nodemailer";
import QRCode from "qrcode";
import { EmailLog } from "../models/EmailLog.js";

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailContent({ delegate, event }) {
  const subject = `Your QR Code for ${event.name}`;

  const body = `Hello ${delegate.fullName},

Thank you for registering for ${event.name}.

Your registration is confirmed.

Your QR code is attached to this email as a PNG file.

Please present this QR code at the event entrance for check-in and badge printing.

Delegate ID: ${delegate.delegateId}

Thank you,
Afterglow Register Team`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#222;max-width:560px;margin:auto;border:1px solid #eee;border-radius:12px;padding:24px">
      <h2 style="margin:0 0 8px;color:#CF6B11">Afterglow Register</h2>

      <p>Hello <strong>${escapeHtml(delegate.fullName)}</strong>,</p>

      <p>Thank you for registering for <strong>${escapeHtml(event.name)}</strong>.</p>

      <p>Your registration is confirmed.</p>

      <p>
        Your QR code is attached to this email as a PNG file.
        Please present it at the event entrance for check-in and badge printing.
      </p>

      <div style="text-align:center;margin:22px 0;padding:14px;border:1px dashed #ddd;border-radius:10px;background:#fafafa">
        <p style="margin:0 0 8px;font-size:13px;color:#555">QR Code attached</p>
        <p style="margin:0;font-size:14px">Delegate ID: <strong>${escapeHtml(delegate.delegateId)}</strong></p>
      </div>

      <p style="font-size:12px;color:#777">
        If you cannot open the QR attachment, present your Delegate ID at the entrance.
      </p>

      <p>Thank you,<br/>Afterglow Register Team</p>
    </div>
  `;

  return { subject, body, html };
}

async function sendWithBrevo({ delegate, subject, body, html, qrPngBuffer }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER;
  const senderName = process.env.BREVO_SENDER_NAME || "Afterglow Register";

  if (!apiKey) throw new Error("BREVO_API_KEY is missing.");
  if (!senderEmail) throw new Error("BREVO_SENDER_EMAIL is missing.");

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [
      {
        email: delegate.email,
        name: delegate.fullName,
      },
    ],
    subject,
    htmlContent: html,
    textContent: body,
    attachment: [
      {
        name: `${delegate.delegateId}-qr-code.png`,
        content: qrPngBuffer.toString("base64"),
      },
    ],
  };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  const resultText = await response.text();

  if (!response.ok) {
    throw new Error(`Brevo email failed: ${response.status} ${resultText}`);
  }

  return resultText;
}

async function sendWithSmtp({ delegate, subject, body, html, qrPngBuffer }) {
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
    attachments: [
      {
        filename: `${delegate.delegateId}-qr-code.png`,
        content: qrPngBuffer,
        contentType: "image/png",
      },
    ],
  });
}

export async function sendRegistrationEmail({ delegate, event }) {
  const qrPayload = JSON.stringify({
    eventId: event._id.toString(),
    delegateId: delegate.delegateId,
    qrToken: delegate.qrToken,
  });

  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: 360,
    margin: 2,
  });

  const qrPngBuffer = await QRCode.toBuffer(qrPayload, {
    type: "png",
    width: 360,
    margin: 2,
  });

  const { subject, body, html } = buildEmailContent({ delegate, event });

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
    const provider = String(process.env.EMAIL_PROVIDER || "smtp").toLowerCase();

    if (provider === "brevo") {
      await sendWithBrevo({ delegate, subject, body, html, qrPngBuffer });
    } else {
      await sendWithSmtp({ delegate, subject, body, html, qrPngBuffer });
    }

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

    return {
      status: "failed",
      error: error.message,
      subject,
      body,
      qrDataUrl,
    };
  }
}