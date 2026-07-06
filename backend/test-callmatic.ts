import { PrismaClient } from "@prisma/client";
import axios from "axios";
import crypto from "crypto";

const prisma = new PrismaClient();

function decryptJson(encryptedData: any): any {
  const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef", "hex"), Buffer.from(encryptedData.iv, "hex"));
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, "hex"));
  let decrypted = decipher.update(encryptedData.data, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return JSON.parse(decrypted);
}

async function main() {
  try {
    const row = await prisma.integrationConfig.findUnique({ where: { key: "CALLMATIC" } });
    if (!row || !row.encryptedCredentials) throw new Error("Credentials not found in DB");
    
    const creds = decryptJson(row.encryptedCredentials as any);
    
    console.log("Triggering test call with callee_name...");
    const payload = {
      campaignId: creds.campaignId,
      to: [{ phoneNumber: "8072825969", variables: { name: "JAMAL", callee_name: "JAMAL" } }]
    };
    
    const res = await axios.post(
      "https://api.callmatic.ai/v1/calls/batch",
      payload,
      { headers: { "Content-Type": "application/json", "api-key": creds.apiKey } }
    );
    console.log("\nSUCCESS! Callmatic accepted the call request.");
    console.log("Callmatic Response:", JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    console.error("\nERROR:", err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}
main();
