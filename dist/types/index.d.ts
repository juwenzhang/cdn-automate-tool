import * as vite from 'vite';
import { Plugin } from 'vite';

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
declare const Resource: {
    readonly SCRIPT: "script";
    readonly STYLE: "style";
    readonly ASSET: "asset";
};
type ResourceType = (typeof Resource)[keyof typeof Resource];
declare const Preload: {
    readonly PRELOAD: "preload";
    readonly PREFETCH: "prefetch";
    readonly DNS_PREFETCH: "dns-prefetch";
};
type PreloadType = (typeof Preload)[keyof typeof Preload];
interface CdnItem {
    name: string;
    main: string;
    fallback: string;
    type: Omit<ResourceType, 'ASSET'>;
    async?: boolean;
    defer?: boolean;
    preload?: PreloadType;
    dnsPrefetch?: boolean;
}
interface PreloadRule {
    include: RegExp[];
    exclude: RegExp[];
    preload: Omit<PreloadType, 'DNS_PREFETCH'>;
}
interface CdnAutomateConfig {
    cdnList: CdnItem[];
    isProd?: boolean;
    localPreloadRules?: PreloadRule[];
    defaultAsync?: boolean;
    defaultDefer?: boolean;
    injectPosition?: 'head' | 'body' | 'head-prepend';
    viteExternal?: string[];
}
interface CdnLoaderOptions extends Omit<CdnItem, 'name'> {
    onLoad?: (el: HTMLElement) => void;
    onError?: (err: Error, isFallback: boolean) => void;
}
type CdnAutomatePluginOptions = Partial<CdnAutomateConfig>;

declare class CdnAutomateWebpackPlugin {
    private options;
    constructor(options?: CdnAutomatePluginOptions);
    apply(compiler: any): Promise<void>;
}
declare const cdnAutomateWebpack: (options: CdnAutomatePluginOptions) => CdnAutomateWebpackPlugin;

declare const defaultConfig: CdnAutomateConfig;

declare const loadCdnResource: (options: CdnLoaderOptions) => Promise<HTMLElement>;
declare const loadCdnBatch: (cdnList: CdnLoaderOptions[]) => Promise<HTMLElement[]>;
declare const initCdnLoader: () => void;

declare const getLocalResourceList: (html: string) => string[];
declare const matchPreloadRules: (resourceList: string[], preloadRules: PreloadRule[]) => Array<{
    href: string;
    type: PreloadType;
}>;

declare const mergeConfig: (userConfig: CdnAutomatePluginOptions) => CdnAutomateConfig;

declare const validateConfig: (config: CdnAutomateConfig) => boolean;

declare const parseWebpackExternal: (external: unknown) => string[];
declare const parseViteExternal: (external: unknown) => string[];
declare const matchExternalCdn: (externalList: string[], cdnList: CdnItem[]) => CdnItem[];

declare const cdnAutomateVite: (options?: CdnAutomatePluginOptions) => Plugin;

declare const _default: {
    webpack: (options: CdnAutomatePluginOptions) => CdnAutomateWebpackPlugin;
    vite: (options?: CdnAutomatePluginOptions) => vite.Plugin;
};

export { CdnAutomateWebpackPlugin, Preload, Resource, cdnAutomateVite, cdnAutomateWebpack, _default as default, defaultConfig, getLocalResourceList, initCdnLoader, loadCdnBatch, loadCdnResource, matchExternalCdn, matchPreloadRules, mergeConfig, parseViteExternal, parseWebpackExternal, validateConfig };
export type { CdnAutomateConfig, CdnAutomatePluginOptions, CdnItem, CdnLoaderOptions, PreloadRule, PreloadType, ResourceType };
