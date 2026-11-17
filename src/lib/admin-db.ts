import { prisma } from "@/lib/prisma";
import { resources } from "./admin-resources";
export type AdminRow = Record<string, unknown> & { id: string };
type Delegate = {
  findMany(args: object): Promise<AdminRow[]>;
  findFirst(args: object): Promise<AdminRow | null>;
  create(args: object): Promise<AdminRow>;
  update(args: object): Promise<AdminRow>;
  delete(args: object): Promise<AdminRow>;
};
export function resourceDb(resource: string) {
  const config = resources[resource];
  if (!config) throw new Error("Seção inexistente.");
  return (prisma as unknown as Record<string, Delegate>)[config.model];
}
export function resourceWhere(resource: string, id?: string) {
  const config = resources[resource];
  return { ...(id ? { id } : {}), ...(config?.kind ? { kind: config.kind } : {}) };
}
