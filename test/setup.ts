import { config } from "dotenv";
config({ path: ".env.test" });

// Global test timeout
jest.setTimeout(30000);
