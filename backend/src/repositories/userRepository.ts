import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export const userRepository = {
  findByEmail(email: string) {
    return db.select().from(users).where(eq(users.email, email)).limit(1);
  },

  findAuthUserById(id: string) {
    return db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
  },

  create(values: { email: string; name: string; passwordHash: string; role: "owner" | "staff" | "admin" | "dev" }) {
    return db.insert(users).values(values).returning();
  },
};
