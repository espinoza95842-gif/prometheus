import { google } from "googleapis";

export async function fetchEmails(authClient) {

  const gmail = google.gmail({ version: "v1", auth: authClient });

  const res = await gmail.users.messages.list({
    userId: "me",
    maxResults: 10
  });

  return res.data.messages || [];

}
