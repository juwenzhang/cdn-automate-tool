import type { CdnAutomateConfig } from "@/types";
import { Preload } from "@/types";

export const defaultConfig: CdnAutomateConfig = {
  cdnList: [],
  isProd: process.env.NODE_ENV === 'production',
  localPreloadRules: [
    {
      // JS/CSS preload configs, 针对于首屏资源
      include: [
        /^\/js\/main\./,  // js main file
        /^\/css\/main\./,  // css main file
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
}
