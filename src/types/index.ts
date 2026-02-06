/**
 * ts dynamic type tools:
 * Omit<T, k> from type T except key k
 * Pick<T, K> 
 * Partial<T> 
 * Required<T>
 * Readonly<T>
 */

declare global {
  interface Window {
    __CDN_AUTOMATE_CONFIG__: CdnAutomateConfig;
  }
}


export const Resource = {
  SCRIPT: 'script',
  STYLE: 'style',
  ASSET: 'asset', // 静态资源
} as const;
export type ResourceType = (typeof Resource)[keyof typeof Resource];


export const Preload = {
  PRELOAD: "preload",
  PREFETCH: "prefetch",
  DNS_PREFETCH: "dns-prefetch",
} as const;
export type PreloadType = (typeof Preload)[keyof typeof Preload];

export interface CdnItem {
  name: string;  // <external_package_name>
  main: string;  // <main_cdn_link>
  fallback: string;  // <fallback_function>
  type: Omit<ResourceType, 'ASSET'>;  // script and style type
  async?: boolean;  // is not begin async mode to load js script to execute
  defer?: boolean;  // is not begin defer mode to load js script to execute after page load
  preload?: PreloadType;  // <preload_type>
  dnsPrefetch?: boolean;  // is not begin dns prefetch mode to load dns prefetch type
}

export interface PreloadRule {
  include: RegExp[];  // include file path regex
  exclude: RegExp[];  // exclude file path regex
  preload: Omit<PreloadType, 'DNS_PREFETCH'>;  // <preload_type>
}

export interface CdnAutomateConfig {
  cdnList: CdnItem[];
  isProd?: boolean;
  localPreloadRules?: PreloadRule[];
  defaultAsync?: boolean;
  defaultDefer?: boolean;
  injectPosition?: 'head' | 'body' | 'head-prepend';
  viteExternal?: string[];
}

export interface CdnLoaderOptions extends Omit<CdnItem, 'name'> {
  onLoad?: (el: HTMLElement) => void;
  onError?: (err: Error, isFallback: boolean) => void;
}

export type CdnAutomatePluginOptions = Partial<CdnAutomateConfig>;

export {}
