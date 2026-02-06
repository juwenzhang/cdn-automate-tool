import type { CdnLoaderOptions } from '@/types';
import { Resource } from '@/types';

const loadedCdn = new Set<string>();

export const loadCdnResource = (options: CdnLoaderOptions): Promise<HTMLElement> => {
  return new Promise((resolve, reject) => {
    const { main, fallback, type, async = false, defer = true, onLoad, onError } = options;

    if (loadedCdn.has(main)) {
      const el = document.querySelector(`[data-cdn-main="${main}"]`) as HTMLElement;
      el && resolve(el);
      return;
    }

    let el: HTMLScriptElement | HTMLLinkElement;
    if (type === Resource.SCRIPT) {
      el = document.createElement('script');
      el.src = main;
      el.async = async;
      el.defer = defer;
    } else {
      el = document.createElement('link');
      el.rel = 'stylesheet';
      el.href = main;
    }

    el.dataset.cdnMain = main;
    el.dataset.cdnFallback = fallback;

    let isFallbackUsed = false;
    const handleError = (err: Error) => {
      if (!fallback || isFallbackUsed) {
        onError?.(err, isFallbackUsed);
        reject(err);
        return;
      }
      isFallbackUsed = true;
      type === Resource.SCRIPT ? ((el as HTMLScriptElement).src = fallback) : ((el as HTMLLinkElement).href = fallback);
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

export const loadCdnBatch = (cdnList: CdnLoaderOptions[]): Promise<HTMLElement[]> => {
  return Promise.all(cdnList.map(loadCdnResource));
};

export const initCdnLoader = () => {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    const cdnItems: CdnLoaderOptions[] = [];
    document.querySelectorAll('[data-cdn-main]').forEach(el => {
      const main = (el as HTMLElement).dataset.cdnMain;
      const fallback = (el as HTMLElement).dataset.cdnFallback;
      const type = el.tagName === 'SCRIPT' ? Resource.SCRIPT : Resource.STYLE;
      const async = el.tagName === 'SCRIPT' ? (el as HTMLScriptElement).async : false;
      const defer = el.tagName === 'SCRIPT' ? (el as HTMLScriptElement).defer : true;
      cdnItems.push({ main: main || '', fallback: fallback || '', type, async, defer });
    });
    // realize load cdn batch
    loadCdnBatch(cdnItems).catch(err => console.error('CDN批量加载失败：', err));
  } else {
    document.addEventListener('DOMContentLoaded', initCdnLoader);
  }
};