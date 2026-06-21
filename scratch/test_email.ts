import { sendEmail } from "../src/app/utils/email.js";

async function main() {
  console.log("Sending test email...");
  await sendEmail({
    to: "fahimrahman0145@gmail.com",
    subject: "Test Email",
    templateName: "otp",
    templateData: {
      name: "Test User",
      otp: "123456"
    }
  });
  console.log("Email sent successfully!");
}

main().catch(err => {
  console.error("Failed to send email:", err);
});
