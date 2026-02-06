import type { CdnAutomateConfig, CdnAutomatePluginOptions } from '@/types';
import { defaultConfig } from '@/config/defaultConfig';

interface DeepMergeOptions {
  arrayMerge?: (target: any[], source: any[]) => any[];
}

export const deepMerge = (
  target: any,
  ...sources: (any | DeepMergeOptions)[]
): any => {
  let options: DeepMergeOptions = {};
  const sourceObjects: any[] = [];
  
  for (const source of sources) {
    if (source && typeof source === 'object' && !Array.isArray(source) && 'arrayMerge' in source) {
      options = source;
    } else {
      sourceObjects.push(source);
    }
  }
  
  const arrayMerge = options.arrayMerge || ((target, source) => [...target, ...source]);
  
  for (const source of sourceObjects) {
    if (!source || typeof source !== 'object') continue;
    
    for (const key in source) {
      if (!source.hasOwnProperty(key)) continue;
      
      const sourceValue = source[key];
      const targetValue = target[key];

      if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
        target[key] = arrayMerge(targetValue, sourceValue);
      }
      else if (targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue) &&
               sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
        target[key] = deepMerge({}, targetValue, sourceValue, options);
      }
      else if (sourceValue !== undefined) {
        target[key] = sourceValue;
      }
    }
  }
  
  return target;
};

export const mergeConfig = (
  userConfig: CdnAutomatePluginOptions
): CdnAutomateConfig => {
  return deepMerge({}, defaultConfig, userConfig, {
    arrayMerge: (target: any[], source: any[]) => [...new Set([...target, ...source])]
  });
};
