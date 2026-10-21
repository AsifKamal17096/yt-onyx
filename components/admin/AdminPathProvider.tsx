"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Makes the admin base path (/<ADMIN_PATH>) available to client components.
 *
 * It is passed down from the server layout rather than read from the
 * environment, because a NEXT_PUBLIC_ variable would be inlined into the
 * public JavaScript bundle and give the admin location away.
 */
const AdminPathContext = createContext<string>("/admin");

export function AdminPathProvider({
  base,
  children,
}: {
  base: string;
  children: ReactNode;
}) {
  return (
    <AdminPathContext.Provider value={base}>
      {children}
    </AdminPathContext.Provider>
  );
}

export function useAdminPath(): (path?: string) => string {
  const base = useContext(AdminPathContext);
  return (path = "") => {
    const suffix = path.startsWith("/") ? path : path ? `/${path}` : "";
    return `${base}${suffix}`;
  };
}

export function useAdminBase(): string {
  return useContext(AdminPathContext);
}
