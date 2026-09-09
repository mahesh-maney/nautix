import emailjs from "@emailjs/browser";

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  as string;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  as string;

function formatType(raw: string | null): string {
  if (!raw) return "Not specified";
  return raw.replace(/_/g, " ").toUpperCase();
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export interface SubmissionPayload {
  name: string;
  company: string;
  email: string;
  requirement: string;
  requirement_type: string | null;
  attachment: File | null;
}

export async function sendEnquiry(payload: SubmissionPayload): Promise<void> {
  const { name, company, email, requirement, requirement_type, attachment } = payload;

  const params: Record<string, string> = {
    from_name:        name,
    from_company:     company,
    reply_to:         email,
    requirement_type: formatType(requirement_type),
    requirement,
    attachment_name:  attachment?.name ?? "None",
  };

  // Include file as base64 if present and within EmailJS limits (~50 KB).
  // Larger files are noted by name in the email body only.
  if (attachment && attachment.size <= 50 * 1024) {
    params.attachment_content = await toBase64(attachment);
  }

  await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, { publicKey: PUBLIC_KEY });
}
