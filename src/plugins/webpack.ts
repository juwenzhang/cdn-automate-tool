import type { CdnAutomatePluginOptions } from '@/types';
import { mergeConfig } from '@/utils/mergeConfig';
import { validateConfig } from '@/utils/validateConfig';
import { parseWebpackExternal, matchExternalCdn } from '@/utils/externalParser';
import { injectCdnTags, injectPreloadTags, injectGlobalConfig } from '@/utils/htmlParser';
import { getLocalResourceList, matchPreloadRules } from '@/core/preloadHandler';
import { defaultConfig } from '@/config/defaultConfig';

export class CdnAutomateWebpackPlugin {
  private options: CdnAutomatePluginOptions;
  constructor(options: CdnAutomatePluginOptions = {}) {
    this.options = options;
  }

  async apply(compiler: any) {
    const isProd = this.options.isProd ?? defaultConfig.isProd;
    if (!isProd) return;

    // 动态导入 webpack，避免在 Vite 项目中加载
    const { Compilation, sources } = await import('webpack');

    compiler.hooks.compilation.tap('CdnAutomateWebpackPlugin', (compilation: any) => {
      // htmlWebpackPluginAfterHtmlProcessing 依赖于插件 html-webpack-plugin 的钩子 htmlWebpackPluginAfterHtmlProcessing
      const hasHtmlWebpackPlugin = compilation.hooks.htmlWebpackPluginAfterHtmlProcessing;
      
      if (hasHtmlWebpackPlugin) {
        hasHtmlWebpackPlugin.tapAsync(
          'CdnAutomateWebpackPlugin',
          (htmlPluginData: any, callback: any) => {
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
              const preloadLinks = matchPreloadRules(localResources, finalConfig.localPreloadRules!);

              let html = htmlPluginData.html;
              html = injectCdnTags(html, matchedCdn, finalConfig.injectPosition!);
              html = injectPreloadTags(html, matchedCdn, preloadLinks);
              html = injectGlobalConfig(html, finalConfig);

              html += `<script src="/cdn-loader.js"></script>`;
              html += `<script>window.__CDN_AUTOMATE_CONFIG__.initCdnLoader();</script>`;

              htmlPluginData.html = html;
              callback(null, htmlPluginData);
            } catch (err) {
              callback(err as Error, htmlPluginData);
            }
          }
        );
      } else {
        compilation.hooks.processAssets.tapAsync(
          {
            name: 'CdnAutomateWebpackPlugin',
            stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE
          },
          (assets: any, callback: any) => {
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
                  const htmlAsset = asset as any;
                  const html = htmlAsset.source().toString();
                  const localResources = getLocalResourceList(html);
                  const preloadLinks = matchPreloadRules(localResources, finalConfig.localPreloadRules!);

                  let modifiedHtml = html;
                  modifiedHtml = injectCdnTags(modifiedHtml, matchedCdn, finalConfig.injectPosition!);
                  modifiedHtml = injectPreloadTags(modifiedHtml, matchedCdn, preloadLinks);
                  modifiedHtml = injectGlobalConfig(modifiedHtml, finalConfig);

                  modifiedHtml += `<script src="/cdn-loader.js"></script>`;
                  modifiedHtml += `<script>window.__CDN_AUTOMATE_CONFIG__.initCdnLoader();</script>`;

                  compilation.updateAsset(filename, new sources.RawSource(modifiedHtml));
                }
              }

              callback();
            } catch (err) {
              callback(err as Error);
            }
          }
        );
      }
    });
  }
}

export const cdnAutomateWebpack = (options: CdnAutomatePluginOptions) => 
  new CdnAutomateWebpackPlugin(options);
