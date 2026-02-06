import type { PreloadRule, PreloadType } from '@/types';

export const getLocalResourceList = (html: string): string[] => {
  const linkReg = /<link[^>]+href="([^"]+)"/g;
  const scriptReg = /<script[^>]+src="([^"]+)"/g;
  const resources: string[] = [];
  let match;
  while ((match = linkReg.exec(html))) resources.push(match[1] || '');
  while ((match = scriptReg.exec(html))) resources.push(match[1] || '');
  return resources.filter(res => !res.startsWith('http') && !res.startsWith('//'));
};

export const matchPreloadRules = (
  resourceList: string[],
  preloadRules: PreloadRule[]
): Array<{ href: string; type: PreloadType }> => {
  const preloadLinks: Array<{ href: string; type: PreloadType }> = [];
  resourceList.forEach(res => {
    preloadRules.forEach(rule => {
      const isIncluded = rule.include.some(reg => reg.test(res));
      const isExcluded = rule.exclude.some(reg => reg.test(res));
      if (isIncluded && !isExcluded) {
        preloadLinks.push({ href: res, type: rule.preload as PreloadType });
      }
    });
  });
  return preloadLinks.filter((item, index, arr) => 
    arr.findIndex(i => i.href === item.href && i.type === item.type) === index
  );
};
