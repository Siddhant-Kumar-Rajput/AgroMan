import { openDB } from "idb";
import type { Thread } from "../../shared/domain";
const db = openDB(
  import.meta.env.VITE_API_MODE === "live" ? "agroman-live" : "agroman-demo",
  1,
  {
    upgrade(db) {
      db.createObjectStore("local");
    },
  },
);
export async function readThreads(): Promise<Thread[]> {
  return (await (await db).get("local", "threads")) ?? [];
}
export async function saveThreads(threads: Thread[]) {
  await (await db).put("local", threads, "threads");
}
