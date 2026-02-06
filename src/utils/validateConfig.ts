import type { CdnAutomateConfig, CdnItem, ResourceType, PreloadType } from "@/types";
import { Preload, Resource } from "@/types";

export const validateCdnItem = (item: CdnItem, index: number) => {
  // collect error info
  const errors: string[] = [];
  // validate name
  if (!item.name) {
    errors.push(`cdn item ${index} name is required`);
  }
  // validate main
  if (!item.main) {
    errors.push(`cdn item ${index} main is required`);
  }
  // validate fallback
  if (!item.fallback) {
    errors.push(`cdn item ${index} fallback is required`);
  }
  // resource type
  if (item.type !== Resource.SCRIPT && item.type !== Resource.STYLE) {
    errors.push(`cdn item ${index} type must be script or style`);
  }
  // validate preload
  if (item.preload && !Object.values(Preload).includes(item.preload)) {
    errors.push(`cdn item ${index} preload must be ${Object.values(Preload).join(', ')}`);
  }
  if (errors.length) {
    throw new Error("cdn item errors: " + errors.join('\n'));
  }
}

export const validateConfig = (config: CdnAutomateConfig) => {
  if (!Array.isArray(config.cdnList)) {
    throw new Error("cdnList must be an array");
  }
  config.cdnList.forEach((item, index) => {
    validateCdnItem(item, index);
  });
  if (!['head', 'body', 'head-prepend'].includes(config.injectPosition as string)) {
    throw new Error("injectPosition must be head, body, or head-prepend");
  }
  return true;
}
