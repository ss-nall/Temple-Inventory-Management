import nodemailer from "nodemailer";
import { getAdminEmails } from "./admins.js";

/**
 * Sends a stock receipt confirmation email to all registered admin accounts.
 * If SMTP environment variables are not set, it logs the email to the console.
 * 
 * @param {Object} transaction - The confirmed Transaction document
 * @param {Object} confirmingAdmin - The admin User who confirmed the receipt
 */
export const sendStockConfirmationEmail = async (transaction, confirmingAdmin) => {
  const recipients = transaction.recipientEmail
    ? [transaction.recipientEmail.trim().toLowerCase()]
    : getAdminEmails();

  if (recipients.length === 0) {
    console.log("[EMAIL] No recipient admin emails found.");
    return;
  }

  const subject = `[Vastram Temple Inventory] Stock Receipt Confirmed`;
  const text = `
Hello Admin,

A stock receipt has been confirmed in the Temple Inventory Management system.

Transaction Details:
--------------------
Date: ${new Date(transaction.date).toLocaleDateString()}
Type: Stock Receipt (ADD)
Sarees: ${transaction.sarees}
Panchas: ${transaction.panchas}
Donor/Source: ${transaction.donorName || "N/A"}
Notes: ${transaction.notes || "None"}

Confirmation Details:
--------------------
Confirmed By: ${confirmingAdmin?.username || "N/A"} (${confirmingAdmin?.email || "N/A"})
Confirmed At: ${new Date().toLocaleString()}

You can view the full inventory and history by logging into the dashboard.

Best regards,
Vastram Temple Inventory Management Team
  `;

  // Create transporter configuration from environment variables
  const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const smtpFrom = process.env.SMTP_FROM || process.env.EMAIL_FROM || smtpUser;

  // If no SMTP host or user is provided, fall back to console logging
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log("=== [EMAIL LOG FALLBACK] ===");
    console.log(`To: ${recipients.join(", ")}`);
    console.log(`Subject: ${subject}`);
    console.log(text);
    console.log("=============================");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const info = await transporter.sendMail({
      from: smtpFrom,
      to: recipients.join(", "),
      subject,
      text
    });
    console.log(`[EMAIL] Stock confirmation email sent successfully: ${info.messageId}`);
  } catch (error) {
    console.error("[EMAIL] Error sending stock confirmation email:", error);
  }
};
