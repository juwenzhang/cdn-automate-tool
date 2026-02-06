export * from '@/types';

export { defaultConfig } from '@/config/defaultConfig';

// 暴露运行时核心函数
export { loadCdnResource, loadCdnBatch, initCdnLoader } from '@/core/cdnLoader';
export { getLocalResourceList, matchPreloadRules } from '@/core/preloadHandler';

// 暴露工具函数
export { mergeConfig } from '@/utils/mergeConfig';
export { validateConfig } from '@/utils/validateConfig';
export { parseWebpackExternal, parseViteExternal, matchExternalCdn } from '@/utils/externalParser';

// 暴露构建插件
export { CdnAutomateWebpackPlugin, cdnAutomateWebpack } from '@/plugins/webpack';
export { cdnAutomateVite } from '@/plugins/vite';

import { cdnAutomateWebpack } from '@/plugins/webpack';
import { cdnAutomateVite } from '@/plugins/vite';

export default {
  webpack: cdnAutomateWebpack,
  vite: cdnAutomateVite
};