import type { Plugin } from 'vite';
import type { CdnAutomatePluginOptions } from '@/types';
import { mergeConfig } from '@/utils/mergeConfig';
import { validateConfig } from '@/utils/validateConfig';
import { parseViteExternal, matchExternalCdn } from '@/utils/externalParser';
import { injectCdnTags, injectPreloadTags, injectGlobalConfig } from '@/utils/htmlParser';
import { getLocalResourceList, matchPreloadRules } from '@/core/preloadHandler';
import { defaultConfig } from '@/config/defaultConfig';

export const cdnAutomateVite = (options: CdnAutomatePluginOptions = {}): Plugin => {
  let finalConfig = mergeConfig(options);
  const isProd = finalConfig.isProd ?? defaultConfig.isProd;

  return {
    name: 'vite-plugin-cdn-automate',
    enforce: 'post',
    configResolved(config) {
      finalConfig = mergeConfig(options);
      validateConfig(finalConfig);
      finalConfig.viteExternal = parseViteExternal(
        config.build.rollupOptions.external
      );
    },
    transformIndexHtml(html) {
      if (!isProd) return html;

      try {
        const externalList = finalConfig.viteExternal as string[];
        const matchedCdn = matchExternalCdn(externalList, finalConfig.cdnList);
        if (matchedCdn.length === 0) return html;

        const localResources = getLocalResourceList(html);
        const preloadLinks = matchPreloadRules(localResources, finalConfig.localPreloadRules!);

        let processedHtml = injectCdnTags(html, matchedCdn, finalConfig.injectPosition!);
        processedHtml = injectPreloadTags(processedHtml, matchedCdn, preloadLinks);
        processedHtml = injectGlobalConfig(processedHtml, finalConfig);

        processedHtml += `<script type="module" src="/node_modules/cdn-automate-ts/src/core/cdnLoader.ts"></script>`;
        processedHtml += `<script type="module">import { initCdnLoader } from '/node_modules/cdn-automate-ts/src/core/cdnLoader.ts'; initCdnLoader();</script>`;

        return processedHtml;
      } catch (err) {
        this.error(err as Error);
      }
    }
  };
};
