import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const getServerSession = async () => {
  return auth.api.getSession({
    headers: headers(),
  });
};

export const requireServerSession = async () => {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return null;
  }
  return session;
};
