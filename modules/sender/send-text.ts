import axios from "axios";

interface SmsData {
  from: string;
  messaging_profile_id?: string;
  to: string;
  text?: string;
  subject?: string;
  media_urls?: string[];
  webhook_url?: string;
  webhook_failover_url?: string;
  use_profile_webhooks?: boolean;
  type?: string;
}

export async function sendText(smsData: SmsData): Promise<any> {
  try {
    console.log("smsData", smsData);
    // add powered by mylittlehelper.ai
    smsData.text += "\n\npowered by Mylittlehelper.ai";
    // Ensure media_urls is always an array
    if (smsData.media_urls && typeof smsData.media_urls === "string") {
      smsData.media_urls = [smsData.media_urls]; // If it's a string, make it an array
    }
    const response = await axios.post(
      "https://api.telnyx.com/v2/messages",
      smsData,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
        },
      },
    );
    console.log("SMS sent successfully");
    return response.data;
  } catch (error) {
    console.log("Error sending SMS:", error.message);
    return "error"; // FIX:
  }
}
