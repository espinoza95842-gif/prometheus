import express from "express";
import { google } from "googleapis";
import { getAuthUrl, getTokensFromCode, setOAuthCredentials } from "../googleAuth.js";
import { triageEmail } from "../../ai/triageEngine.js";
import { sendPushNotification } from "../../notifications/push.js";

const router = express.Router();

let savedTokens = null;

router.get("/auth-url", (req, res) => {
  try {
    const url = getAuthUrl();
    res.json({ success: true, url });
  } catch (error) {
    console.error("Error generating auth URL:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get("/oauth/callback", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Missing OAuth code"
      });
    }

    const { oauth2Client, tokens } = await getTokensFromCode(code);
    savedTokens = tokens;

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2"
    });

    const profile = await oauth2.userinfo.get();

    res.json({
      success: true,
      message: "Google account connected successfully",
      email: profile.data.email
    });
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get("/messages", async (req, res) => {
  try {
    if (!savedTokens) {
      return res.status(401).json({
        success: false,
        error: "Google account not connected yet"
      });
    }

    const auth = setOAuthCredentials(savedTokens);
    const gmail = google.gmail({ version: "v1", auth });

    const listResponse = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10
    });

    const messages = listResponse.data.messages || [];

    const detailedMessages = await Promise.all(
      messages.map(async (message) => {
        const fullMessage = await gmail.users.messages.get({
          userId: "me",
          id: message.id
        });

        const headers = fullMessage.data.payload?.headers || [];

        const subjectHeader = headers.find(
          (header) => header.name.toLowerCase() === "subject"
        );

        const fromHeader = headers.find(
          (header) => header.name.toLowerCase() === "from"
        );

        const subject = subjectHeader?.value || "No Subject";
        const from = fromHeader?.value || "Unknown Sender";

        const triage = triageEmail({ subject });

        if (triage.priority === "HIGH") {
          sendPushNotification("user1", `Urgent email detected: ${subject}`);
        }

        return {
          id: message.id,
          subject,
          from,
          triage
        };
      })
    );

    res.json({
      success: true,
      count: detailedMessages.length,
      messages: detailedMessages
    });
  } catch (error) {
    console.error("Error fetching Gmail messages:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
