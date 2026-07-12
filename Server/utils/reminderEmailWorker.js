import nodemailer from "nodemailer";
import Driver from "../models/Driver.js";
import EmailSetup from "../models/EmailSetup.js";
import EmailFor from "../models/EmailFor.js";
import EmailTemplate from "../models/EmailTemplate.js";

// Professional HTML template layout to seed
const DEFAULT_HTML_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Driver's License Expiry Notification</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #333333; }
    .email-container { max-width: 600px; background-color: #ffffff; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border-top: 5px solid #ef4444; }
    .email-header { background-color: #ffffff; padding: 25px; text-align: center; border-bottom: 1px solid #f0f0f0; }
    .email-body { padding: 30px 25px; line-height: 1.6; }
    .email-footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
    h2 { color: #1e293b; margin-top: 0; font-size: 20px; font-weight: 700; }
    .alert-box { background-color: #fef2f2; border: 1px solid #fee2e2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 6px; margin: 20px 0; color: #991b1b; font-size: 14px; }
    .details-table { width: 100%; border-collapse: collapse; margin: 25px 0; }
    .details-table th, .details-table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .details-table th { background-color: #f8fafc; font-weight: 600; color: #475569; width: 40%; }
    .details-table td { color: #1e293b; }
    .btn-action { display: inline-block; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 15px; text-align: center; }
    .notice { font-size: 13px; color: #64748b; margin-top: 25px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h2 style="margin: 0; color: #ef4444;">License Expiration Alert</h2>
    </div>
    <div class="email-body">
      <p>Hello <strong>{{DRIVER_NAME}}</strong>,</p>
      <p>This is an automated notification to inform you that your driver's license is expiring soon. To ensure compliance with transport operations policies and maintain uninterrupted trip schedules, please renew your license immediately.</p>
      
      <div class="alert-box">
        <strong>Warning:</strong> Your license expires in exactly <strong>{{DAYS_REMAINING}} days</strong>. Driving with an expired license is strictly prohibited.
      </div>
      
      <table class="details-table">
        <tr>
          <th>License Number</th>
          <td>{{LICENSE_NUMBER}}</td>
        </tr>
        <tr>
          <th>Category</th>
          <td>{{LICENSE_CATEGORY}}</td>
        </tr>
        <tr>
          <th>Expiry Date</th>
          <td>{{EXPIRY_DATE}}</td>
        </tr>
      </table>
      
      <div style="text-align: center;">
        <a href="#" class="btn-action">Submit Renewed License</a>
      </div>
      
      <p class="notice">If you have already submitted your updated license papers to the fleet operations office, please disregard this warning.</p>
    </div>
    <div class="email-footer">
      <p>TransitOps Smart Transport Operations Platform<br>This is a system generated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

/**
 * Automatically seeds the "License Expiry Reminder" purpose and template if missing.
 */
export const seedExpiryReminderTemplates = async () => {
  try {
    // 1. Seed EmailFor (Purpose)
    let emailForDoc = await EmailFor.findOne({ emailFor: "License Expiry Reminder" });
    if (!emailForDoc) {
      emailForDoc = await EmailFor.create({
        emailFor: "License Expiry Reminder",
        isActive: true,
      });
      console.log("🌱 [SEED] Created 'License Expiry Reminder' Email purpose");
    }

    // 2. Find or create template linked to this purpose
    const existingTemplate = await EmailTemplate.findOne({ emailFor: emailForDoc._id });
    if (!existingTemplate) {
      // Find an active email setup to bind to, or create a placeholder SMTP configuration
      let emailSetupDoc = await EmailSetup.findOne({ isActive: true });
      if (!emailSetupDoc) {
        emailSetupDoc = await EmailSetup.create({
          email: "operations@transitops.co",
          appPassword: "placeholder-secret",
          SSL: true,
          port: 465,
          host: "smtp.gmail.com",
          isActive: true,
        });
        console.log("🌱 [SEED] Created placeholder active Email Setup (SMTP)");
      }

      await EmailTemplate.create({
        templateName: "Driver License Expiry Reminder",
        emailFrom: emailSetupDoc._id,
        emailFor: emailForDoc._id,
        mailerName: "TransitOps Fleet Operations Manager",
        emailCC: "",
        emailBCC: "",
        emailSubject: "ALERT: Driver's License Expiring In 7 Days",
        emailSignature: DEFAULT_HTML_TEMPLATE, // Stores the rich HTML content template
        isActive: true,
      });
      console.log("🌱 [SEED] Created 'Driver License Expiry Reminder' email template");
    }
  } catch (err) {
    console.error("❌ [SEED] Error seeding license expiry reminder template:", err.message);
  }
};

/**
 * Queries drivers with licenses expiring in exactly 7 days and sends an alert.
 */
export const sendLicenseExpiryReminders = async () => {
  try {
    console.log("⏰ [REMINDER] Running daily Driver License Expiry checks...");

    // 1. Fetch active email configuration and template
    const emailForDoc = await EmailFor.findOne({ emailFor: "License Expiry Reminder" });
    if (!emailForDoc) {
      console.warn("⚠️ [REMINDER] Purpose 'License Expiry Reminder' not found in database. Skipping check.");
      return;
    }

    const emailTemplate = await EmailTemplate.findOne({ emailFor: emailForDoc._id, isActive: true }).populate("emailFrom");
    if (!emailTemplate || !emailTemplate.emailFrom) {
      console.warn("⚠️ [REMINDER] Active template 'Driver License Expiry Reminder' or SMTP setup not found. Skipping check.");
      return;
    }

    const emailSetup = emailTemplate.emailFrom;
    if (!emailSetup.isActive) {
      console.warn("⚠️ [REMINDER] Active SMTP configuration is disabled. Skipping check.");
      return;
    }

    // 2. Compute date range for exactly 7 days from now
    const targetDay = new Date();
    targetDay.setDate(targetDay.getDate() + 7);
    
    const dayStart = new Date(targetDay.setHours(0, 0, 0, 0));
    const dayEnd = new Date(targetDay.setHours(23, 59, 59, 999));

    // 3. Find drivers whose license expires on that day
    const expiringDrivers = await Driver.find({
      licenseExpiryDate: { $gte: dayStart, $lte: dayEnd },
      isActive: true,
    }).lean();

    if (expiringDrivers.length === 0) {
      console.log(`✅ [REMINDER] No drivers found with licenses expiring on: ${dayStart.toDateString()}`);
      return;
    }

    console.log(`🔍 [REMINDER] Found ${expiringDrivers.length} driver(s) with licenses expiring in 7 days.`);

    // 4. Setup Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      host: emailSetup.host,
      port: emailSetup.port,
      secure: emailSetup.SSL, // true for port 465, false for other ports
      auth: {
        user: emailSetup.email,
        pass: emailSetup.appPassword,
      },
    });

    // 5. Send emails
    for (const driver of expiringDrivers) {
      if (!driver.email) {
        console.warn(`⚠️ [REMINDER] Driver ${driver.name} is missing an email address. Skipping.`);
        continue;
      }

      // Compile placeholders
      const formattedExpiry = new Date(driver.licenseExpiryDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      let htmlContent = emailTemplate.emailSignature; // HTML template body
      htmlContent = htmlContent.replace(/\{\{DRIVER_NAME\}\}/g, driver.name);
      htmlContent = htmlContent.replace(/\{\{LICENSE_NUMBER\}\}/g, driver.licenseNumber);
      htmlContent = htmlContent.replace(/\{\{LICENSE_CATEGORY\}\}/g, driver.licenseCategory);
      htmlContent = htmlContent.replace(/\{\{EXPIRY_DATE\}\}/g, formattedExpiry);
      htmlContent = htmlContent.replace(/\{\{DAYS_REMAINING\}\}/g, "7");

      const mailOptions = {
        from: `"${emailTemplate.mailerName}" <${emailSetup.email}>`,
        to: driver.email,
        cc: emailTemplate.emailCC || undefined,
        bcc: emailTemplate.emailBCC || undefined,
        subject: emailTemplate.emailSubject,
        html: htmlContent,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`✉️ [REMINDER] Expiration warning email sent successfully to ${driver.name} (${driver.email})`);
      } catch (sendErr) {
        console.error(`❌ [REMINDER] Failed to send email to driver ${driver.name}:`, sendErr.message);
      }
    }
  } catch (err) {
    console.error("❌ [REMINDER] Error occurred inside sendLicenseExpiryReminders worker:", err.message);
  }
};

/**
 * Initializes the reminder cron/interval worker (run once per day).
 */
export const initializeReminderWorker = () => {
  // Run on startup (after Mongoose establishes connections)
  setTimeout(() => {
    sendLicenseExpiryReminders();
  }, 10000); // 10 seconds post-boot

  // Run daily check (every 24 hours)
  const DAILY_INTERVAL = 24 * 60 * 60 * 1000;
  setInterval(() => {
    sendLicenseExpiryReminders();
  }, DAILY_INTERVAL);

  console.log("⏰ [REMINDER] Driver Expiry Reminder service initialized (runs every 24 hours).");
};
