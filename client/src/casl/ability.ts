import { createMongoAbility, type MongoAbility } from "@casl/ability";
import { unpackRules } from "@casl/ability/extra";
import type { PackRule } from "@casl/ability/extra";
import { createContext } from "react";
import { createContextualCan } from "@casl/react";

export type AppActions = "manage" | "create" | "read" | "update" | "delete";

export type AppSubjects =
  | "Employee"
  | "Note"
  | "Team"
  | "Department"
  | "ManagedDepartment"
  | "all";

export type AppAbility = MongoAbility<[AppActions, AppSubjects]>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAppAbility(packedRules: PackRule<any>[]): AppAbility {
  return createMongoAbility<AppAbility>(unpackRules(packedRules));
}

export function createEmptyAbility(): AppAbility {
  return createMongoAbility<AppAbility>([]);
}

export const AbilityContext = createContext<AppAbility>(createEmptyAbility());

export const Can = createContextualCan(AbilityContext.Consumer);
