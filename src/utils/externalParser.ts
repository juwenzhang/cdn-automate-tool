import type { CdnItem } from "@/types";

export const parseWebpackExternal = (external: unknown): string[] => {
  if (!external) {
    return [];
  }
  if (Array.isArray(external)) {
    return external.filter(Boolean) as string[];
  }
  if (typeof external === 'object' && external !== null) {
    return Object.keys(external).filter(Boolean) as string[];
  }
  return [];
}

export const parseViteExternal = (external: unknown): string[] => {
  return parseWebpackExternal(external);
}

export const matchExternalCdn = (
  externalList: string[],
  cdnList: CdnItem[]
): CdnItem[] => {
  return cdnList.filter(item => externalList.includes(item.main));
}
