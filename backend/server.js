import express from "express";
import { fetchEmails } from "../integrations/gmail.js";
import { triageEmail } from "../ai/triageEngine.js";
import { sendPushNotification } from "../notifications/push.js";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Prometheus AI Assistant Running");
});

app.post("/check-email", async (req, res) => {
  try {

    const authClient = req.body.authClient;

    const emails = await fetchEmails(authClient);

    const results = emails.map(email => {

      const subject = email.subject || "No Subject";

      const triage = triageEmail({ subject });

      if (triage.priority === "HIGH") {
        sendPushNotification("user1", `Urgent email detected: ${subject}`);
      }

      return {
        subject,
        priority: triage.priority
      };

    });

    res.json({
      success: true,
      emails: results
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });

  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Prometheus server running on port ${PORT}`);
});
