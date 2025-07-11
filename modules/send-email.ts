import * as sgMail from "@sendgrid/mail";
import * as fs from "fs";
import * as path from "path";
import OutgoingEmail, {
  OutgoingEmailModel,
} from "../models/outgoing-email.model";

export async function sendEmail(
  message: {
    from?: string;
    to: string; // email
    subject: string;
    text?: string;
    html?: string;
    attachments?: {
      content?: string;
      disposition?: string;
      filename: string;
      fileNameInPath: string;
      type: string;
    }[];
  },
  payload?: string // to indicate the payload of the email (e.g. unique hash, or short text); if not passed subject | text | html will be used
) {
  try {
    if (!message.from) {
      message.from = "info@mylittlehelper.com";
    }
    let attachments = message.attachments;
    if (attachments) {
      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];
        const pathToAttachment = path.join(
          __dirname,
          "../",
          `${attachment.fileNameInPath}`
        );
        const attachmentFile = fs
          .readFileSync(pathToAttachment)
          .toString("base64");
        attachment.content = attachmentFile;
        attachment.disposition = "attachment";
        // delete the path from final result
        delete attachment.fileNameInPath;
      }
    } else {
      attachments = null;
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    if (process.env.ENVIRONMENT === "dev") {
      message.subject = `DEV: ${message.subject}`;
    }
    await sgMail.send(<any>message);
    const emailOut = new OutgoingEmail(<any>{
      to: message.to,
      payload: payload || message.subject || message.text || message.html,
    });
    await emailOut.save();
  } catch (err) {
    throw err;
  }
}
