import * as cheerio from 'cheerio';
import type { CdnItem, PreloadType } from "@/types";
import { Preload } from "@/types";

export const injectCdnTags = (
  html: string,
  cdnItems: CdnItem[],
  injectPosition: 'head' | 'body' | 'head-prepend'
): string => {
  // get html document
  const $ = cheerio.load(html);
  // get container
  const $container = injectPosition === 'body'
    ? $('body')
    : $('head');
  
  cdnItems.forEach(item => {
    const tagAttrs: Record<string, string> = {
      'data-cdn-name': item.name,
      'data-cdn-main': item.main,
      'data-cdn-fallback': item.fallback,
    };

    // create tag to inject cdn link and script
    let $tag: cheerio.Cheerio<any>;
    if (item.type === 'script') {
      tagAttrs.src = item.main;
      if (item.async !== undefined) tagAttrs.async = 'async';
      if (item.defer !== undefined) tagAttrs.defer = 'defer';
      $tag = $('<script></script>').attr(tagAttrs);
    } else {
      tagAttrs.href = item.main;
      tagAttrs.rel = 'stylesheet';
      $tag = $('<link></link>').attr(tagAttrs);
    }

    injectPosition === 'head-prepend'
      ? $container.prepend($tag)
      : $container.append($tag);
  })

  return $.html();
}

export const injectPreloadTags = (
  html: string,
  cdnItems: CdnItem[],
  localPreloadLinks: Array<{ href: string; type: PreloadType }>
): string => {
  const $ = cheerio.load(html);
  const $head = $('head');

  const cdnDomains = new Set(
    cdnItems
      .filter(item => item.dnsPrefetch !== false)
      .map(item => new URL(item.main).hostname)
      .map(domain => `//${domain}`)
  );
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

export const injectGlobalConfig = (html: string, config: any): string => {
  const $ = cheerio.load(html);
  const configStr = `window.__CDN_AUTOMATE_CONFIG__ = ${JSON.stringify(config)}`;
  $('head').prepend(`<script>${configStr}</script>`);
  return $.html();
};
