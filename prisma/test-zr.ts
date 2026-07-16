import { saveZRSettings, zrTestConnection } from "../src/lib/zrexpress";

async function run() {
  const credentials = {
    secretKey: "czvRyoz4DGt1ZTWA7jUSLdzfNm6bwLCoCwWW1YiVQ7RYeECbeoAFQ0mwmOBovAkX",
    tenantId: "ceb3efb2-31af-417f-a505-c3235ed9c875"
  };

  console.log("Saving ZR Express credentials to production database...");
  await saveZRSettings(credentials);
  console.log("Credentials saved successfully.");

  console.log("Testing ZR Express connection...");
  const success = await zrTestConnection(credentials);
  if (success) {
    console.log("SUCCESS: Connection to ZR Express API is active and working!");
  } else {
    console.error("ERROR: Failed to connect to ZR Express API. Please verify the credentials.");
  }
}

run()
  .catch((err) => {
    console.error("Unhandled error in test-zr.ts:", err);
    process.exit(1);
  })
  .finally(() => {
    console.log("Test execution completed.");
  });
