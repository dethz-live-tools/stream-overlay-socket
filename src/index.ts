import { runCLI } from "./modules/cli";
import { server, startServer } from "./server";

export { server, startServer };
export { runCLI };

if (import.meta.main) {
  runCLI().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
