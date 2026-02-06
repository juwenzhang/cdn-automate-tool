'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var webpack = require('webpack');
var cheerio = require('cheerio');

function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var cheerio__namespace = /*#__PURE__*/_interopNamespaceDefault(cheerio);

/**
 * ts dynamic type tools:
 * Omit<T, k> from type T except key k
 * Pick<T, K>
 * Partial<T>
 * Required<T>
 * Readonly<T>
 */
const Resource = {
    SCRIPT: 'script',
    STYLE: 'style',
    ASSET: 'asset', // 静态资源
};
const Preload = {
    PRELOAD: "preload",
    PREFETCH: "prefetch",
    DNS_PREFETCH: "dns-prefetch",
};

const defaultConfig = {
    cdnList: [],
    isProd: process.env.NODE_ENV === 'production',
    localPreloadRules: [
        {
            // JS/CSS preload configs, 针对于首屏资源
            include: [
                /^\/js\/main\./, // js main file
                /^\/css\/main\./, // css main file
            ],
            exclude: [],
            preload: Preload.PRELOAD,
        },
        {
            // JS/CSS prefetch configs, 针对于非首屏资源
            include: [/^\/js\/async\./, /^\/css\/async\./],
            exclude: [/\.map$/],
            preload: Preload.PREFETCH,
        }
    ],
    defaultAsync: false,
    defaultDefer: true,
    injectPosition: 'head-prepend',
};

const loadedCdn = new Set();
const loadCdnResource = (options) => {
    return new Promise((resolve, reject) => {
        const { main, fallback, type, async = false, defer = true, onLoad, onError } = options;
        if (loadedCdn.has(main)) {
            const el = document.querySelector(`[data-cdn-main="${main}"]`);
            el && resolve(el);
            return;
        }
        let el;
        if (type === Resource.SCRIPT) {
            el = document.createElement('script');
            el.src = main;
            el.async = async;
            el.defer = defer;
        }
        else {
            el = document.createElement('link');
            el.rel = 'stylesheet';
            el.href = main;
        }
        el.dataset.cdnMain = main;
        el.dataset.cdnFallback = fallback;
        let isFallbackUsed = false;
        const handleError = (err) => {
            if (!fallback || isFallbackUsed) {
                onError?.(err, isFallbackUsed);
                reject(err);
                return;
            }
            isFallbackUsed = true;
            type === Resource.SCRIPT ? (el.src = fallback) : (el.href = fallback);
            el.dataset.cdnCurrent = fallback;
        };
        const handleLoad = () => {
            loadedCdn.add(main);
            onLoad?.(el);
            resolve(el);
        };
        el.addEventListener('error', (e) => handleError(new Error(`CDN加载失败：${isFallbackUsed ? fallback : main}`)));
        el.addEventListener('load', handleLoad);
        el.addEventListener('abort', (e) => handleError(new Error(`CDN加载中断：${main}`)));
        document.head.appendChild(el);
    });
};
const loadCdnBatch = (cdnList) => {
    return Promise.all(cdnList.map(loadCdnResource));
};
const initCdnLoader = () => {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        const cdnItems = [];
        document.querySelectorAll('[data-cdn-main]').forEach(el => {
            const main = el.dataset.cdnMain;
            const fallback = el.dataset.cdnFallback;
            const type = el.tagName === 'SCRIPT' ? Resource.SCRIPT : Resource.STYLE;
            const async = el.tagName === 'SCRIPT' ? el.async : false;
            const defer = el.tagName === 'SCRIPT' ? el.defer : true;
            cdnItems.push({ main: main || '', fallback: fallback || '', type, async, defer });
        });
        // realize load cdn batch
        loadCdnBatch(cdnItems).catch(err => console.error('CDN批量加载失败：', err));
    }
    else {
        document.addEventListener('DOMContentLoaded', initCdnLoader);
    }
};

const getLocalResourceList = (html) => {
    const linkReg = /<link[^>]+href="([^"]+)"/g;
    const scriptReg = /<script[^>]+src="([^"]+)"/g;
    const resources = [];
    let match;
    while ((match = linkReg.exec(html)))
        resources.push(match[1] || '');
    while ((match = scriptReg.exec(html)))
        resources.push(match[1] || '');
    return resources.filter(res => !res.startsWith('http') && !res.startsWith('//'));
};
const matchPreloadRules = (resourceList, preloadRules) => {
    const preloadLinks = [];
    resourceList.forEach(res => {
        preloadRules.forEach(rule => {
            const isIncluded = rule.include.some(reg => reg.test(res));
            const isExcluded = rule.exclude.some(reg => reg.test(res));
            if (isIncluded && !isExcluded) {
                preloadLinks.push({ href: res, type: rule.preload });
            }
        });
    });
    return preloadLinks.filter((item, index, arr) => arr.findIndex(i => i.href === item.href && i.type === item.type) === index);
};

const deepMerge = (target, ...sources) => {
    let options = {};
    const sourceObjects = [];
    for (const source of sources) {
        if (source && typeof source === 'object' && !Array.isArray(source) && 'arrayMerge' in source) {
            options = source;
        }
        else {
            sourceObjects.push(source);
        }
    }
    const arrayMerge = options.arrayMerge || ((target, source) => [...target, ...source]);
    for (const source of sourceObjects) {
        if (!source || typeof source !== 'object')
            continue;
        for (const key in source) {
            if (!source.hasOwnProperty(key))
                continue;
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
const mergeConfig = (userConfig) => {
    return deepMerge({}, defaultConfig, userConfig, {
        arrayMerge: (target, source) => [...new Set([...target, ...source])]
    });
};

const validateCdnItem = (item, index) => {
    // collect error info
    const errors = [];
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
};
const validateConfig = (config) => {
    if (!Array.isArray(config.cdnList)) {
        throw new Error("cdnList must be an array");
    }
    config.cdnList.forEach((item, index) => {
        validateCdnItem(item, index);
    });
    if (!['head', 'body', 'head-prepend'].includes(config.injectPosition)) {
        throw new Error("injectPosition must be head, body, or head-prepend");
    }
    return true;
};

const parseWebpackExternal = (external) => {
    if (!external) {
        return [];
    }
    if (Array.isArray(external)) {
        return external.filter(Boolean);
    }
    if (typeof external === 'object' && external !== null) {
        return Object.keys(external).filter(Boolean);
    }
    return [];
};
const parseViteExternal = (external) => {
    return parseWebpackExternal(external);
};
const matchExternalCdn = (externalList, cdnList) => {
    return cdnList.filter(item => externalList.includes(item.main));
};

const injectCdnTags = (html, cdnItems, injectPosition) => {
    // get html document
    const $ = cheerio__namespace.load(html);
    // get container
    const $container = injectPosition === 'body'
        ? $('body')
        : $('head');
    cdnItems.forEach(item => {
        const tagAttrs = {
            'data-cdn-name': item.name,
            'data-cdn-main': item.main,
            'data-cdn-fallback': item.fallback,
        };
        // create tag to inject cdn link and script
        let $tag;
        if (item.type === 'script') {
            tagAttrs.src = item.main;
            if (item.async !== undefined)
                tagAttrs.async = 'async';
            if (item.defer !== undefined)
                tagAttrs.defer = 'defer';
            $tag = $('<script></script>').attr(tagAttrs);
        }
        else {
            tagAttrs.href = item.main;
            tagAttrs.rel = 'stylesheet';
            $tag = $('<link></link>').attr(tagAttrs);
        }
        injectPosition === 'head-prepend'
            ? $container.prepend($tag)
            : $container.append($tag);
    });
    return $.html();
};
const injectPreloadTags = (html, cdnItems, localPreloadLinks) => {
    const $ = cheerio__namespace.load(html);
    const $head = $('head');
    const cdnDomains = new Set(cdnItems
        .filter(item => item.dnsPrefetch !== false)
        .map(item => new URL(item.main).hostname)
        .map(domain => `//${domain}`));
    cdnDomains.forEach(domain => {
        $head.append(`<link rel="${Preload.DNS_PREFETCH}" href="${domain}">`);
    });
    cdnItems.forEach(item => {
        if (item.preload) {
            const rel = item.preload;
            const attrs = item.type === 'script'
                ? `href="${item.main}" as="script"`
                : `href="${item.main}" as="style"`;
            $head.append(`<link rel="${rel}" ${attrs}>`);
        }
    });
    localPreloadLinks.forEach(link => {
        $head.append(`<link rel="${link.type}" href="${link.href}">`);
    });
    return $.html();
};
const injectGlobalConfig = (html, config) => {
    const $ = cheerio__namespace.load(html);
    const configStr = `window.__CDN_AUTOMATE_CONFIG__ = ${JSON.stringify(config)}`;
    $('head').prepend(`<script>${configStr}</script>`);
    return $.html();
};

class CdnAutomateWebpackPlugin {
    options;
    constructor(options = {}) {
        this.options = options;
    }
    apply(compiler) {
        const isProd = this.options.isProd ?? defaultConfig.isProd;
        if (!isProd)
            return;
        compiler.hooks.compilation.tap('CdnAutomateWebpackPlugin', (compilation) => {
            // htmlWebpackPluginAfterHtmlProcessing 依赖于插件 html-webpack-plugin 的钩子 htmlWebpackPluginAfterHtmlProcessing
            const hasHtmlWebpackPlugin = compilation.hooks.htmlWebpackPluginAfterHtmlProcessing;
            if (hasHtmlWebpackPlugin) {
                hasHtmlWebpackPlugin.tapAsync('CdnAutomateWebpackPlugin', (htmlPluginData, callback) => {
                    try {
                        const finalConfig = mergeConfig(this.options);
                        validateConfig(finalConfig);
                        const externalList = parseWebpackExternal(compiler.options.externals);
                        const matchedCdn = matchExternalCdn(externalList, finalConfig.cdnList);
                        if (matchedCdn.length === 0) {
                            callback(null, htmlPluginData);
                            return;
                        }
                        const localResources = getLocalResourceList(htmlPluginData.html);
                        const preloadLinks = matchPreloadRules(localResources, finalConfig.localPreloadRules);
                        let html = htmlPluginData.html;
                        html = injectCdnTags(html, matchedCdn, finalConfig.injectPosition);
                        html = injectPreloadTags(html, matchedCdn, preloadLinks);
                        html = injectGlobalConfig(html, finalConfig);
                        html += `<script src="/cdn-loader.js"></script>`;
                        html += `<script>window.__CDN_AUTOMATE_CONFIG__.initCdnLoader();</script>`;
                        htmlPluginData.html = html;
                        callback(null, htmlPluginData);
                    }
                    catch (err) {
                        callback(err, htmlPluginData);
                    }
                });
            }
            else {
                compilation.hooks.processAssets.tapAsync({
                    name: 'CdnAutomateWebpackPlugin',
                    stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE
                }, (assets, callback) => {
                    try {
                        const finalConfig = mergeConfig(this.options);
                        validateConfig(finalConfig);
                        const externalList = parseWebpackExternal(compiler.options.externals);
                        const matchedCdn = matchExternalCdn(externalList, finalConfig.cdnList);
                        if (matchedCdn.length === 0) {
                            callback();
                            return;
                        }
                        for (const [filename, asset] of Object.entries(assets)) {
                            if (filename.endsWith('.html')) {
                                const htmlAsset = asset;
                                const html = htmlAsset.source().toString();
                                const localResources = getLocalResourceList(html);
                                const preloadLinks = matchPreloadRules(localResources, finalConfig.localPreloadRules);
                                let modifiedHtml = html;
                                modifiedHtml = injectCdnTags(modifiedHtml, matchedCdn, finalConfig.injectPosition);
                                modifiedHtml = injectPreloadTags(modifiedHtml, matchedCdn, preloadLinks);
                                modifiedHtml = injectGlobalConfig(modifiedHtml, finalConfig);
                                modifiedHtml += `<script src="/cdn-loader.js"></script>`;
                                modifiedHtml += `<script>window.__CDN_AUTOMATE_CONFIG__.initCdnLoader();</script>`;
                                compilation.updateAsset(filename, new webpack.sources.RawSource(modifiedHtml));
                            }
                        }
                        callback();
                    }
                    catch (err) {
                        callback(err);
                    }
                });
            }
        });
    }
}
const cdnAutomateWebpack = (options) => new CdnAutomateWebpackPlugin(options);

const cdnAutomateVite = (options = {}) => {
    let finalConfig = mergeConfig(options);
    const isProd = finalConfig.isProd ?? defaultConfig.isProd;
    return {
        name: 'vite-plugin-cdn-automate',
        enforce: 'post',
        configResolved(config) {
            finalConfig = mergeConfig(options);
            validateConfig(finalConfig);
            finalConfig.viteExternal = parseViteExternal(config.build.rollupOptions.external);
        },
        transformIndexHtml(html) {
            if (!isProd)
                return html;
            try {
                const externalList = finalConfig.viteExternal;
                const matchedCdn = matchExternalCdn(externalList, finalConfig.cdnList);
                if (matchedCdn.length === 0)
                    return html;
                const localResources = getLocalResourceList(html);
                const preloadLinks = matchPreloadRules(localResources, finalConfig.localPreloadRules);
                let processedHtml = injectCdnTags(html, matchedCdn, finalConfig.injectPosition);
                processedHtml = injectPreloadTags(processedHtml, matchedCdn, preloadLinks);
                processedHtml = injectGlobalConfig(processedHtml, finalConfig);
                processedHtml += `<script type="module" src="/node_modules/cdn-automate-ts/src/core/cdnLoader.ts"></script>`;
                processedHtml += `<script type="module">import { initCdnLoader } from '/node_modules/cdn-automate-ts/src/core/cdnLoader.ts'; initCdnLoader();</script>`;
                return processedHtml;
            }
            catch (err) {
                this.error(err);
            }
        }
    };
};

var index = {
    webpack: cdnAutomateWebpack,
    vite: cdnAutomateVite
};

exports.CdnAutomateWebpackPlugin = CdnAutomateWebpackPlugin;
exports.Preload = Preload;
exports.Resource = Resource;
exports.cdnAutomateVite = cdnAutomateVite;
exports.cdnAutomateWebpack = cdnAutomateWebpack;
exports.default = index;
exports.defaultConfig = defaultConfig;
exports.getLocalResourceList = getLocalResourceList;
exports.initCdnLoader = initCdnLoader;
exports.loadCdnBatch = loadCdnBatch;
exports.loadCdnResource = loadCdnResource;
exports.matchExternalCdn = matchExternalCdn;
exports.matchPreloadRules = matchPreloadRules;
exports.mergeConfig = mergeConfig;
exports.parseViteExternal = parseViteExternal;
exports.parseWebpackExternal = parseWebpackExternal;
exports.validateConfig = validateConfig;
//# sourceMappingURL=index.js.map
