/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as crypto from 'crypto';
import * as cheerio from 'cheerio';

/** Module for enabling a hash-based strict Content Security Policy. */
export class StrictCsp {
  private static readonly HASH_FUNCTION = 'sha256';
  private static readonly INLINE_SCRIPT_SELECTOR = 'script:not([src])';
  private static readonly SOURCED_SCRIPT_SELECTOR = 'script[src]';
  private $: any;

  constructor(html: string) {
    this.$ = cheerio.load(html, {
      decodeEntities: false,
      xmlMode: false,
    });
  }

  serializeDom(): string {
    return this.$.html();
  }

  /**
   * Returns a strict Content Security Policy for mitigating XSS.
   * For more details read csp.withgoogle.com.
   * If you modify this CSP, make sure it has not become trivially bypassable by
   * checking the policy using csp-evaluator.withgoogle.com.
   *
   * @param hashes A list of sha-256 hashes of trusted inline scripts.
   * @param enableTrustedTypes If Trusted Types should be enabled for scripts.
   * @param enableBrowserFallbacks If fallbacks for older browsers should be
   *   added. This is will not weaken the policy as modern browsers will ignore
   *   the fallbacks.
   */
  static getStrictCsp(
    hashes?: string[],
    enableTrustedTypes?: boolean,
    enableBrowserFallbacks?: boolean,
  ): string {
    hashes = hashes || [];
    let strictCspTemplate = {
      // 'strict-dynamic' allows hashed scripts to create new scripts.
      'script-src': [`'strict-dynamic'`, ...hashes],
      // Restricts `object-src` to disable dangerous plugins like Flash.
      'object-src': [`'none'`],
      // Restricts `base-uri` to block the injection of `<base>` tags. This
      // prevents attackers from changing the locations of scripts loaded from
      // relative URLs.
      'base-uri': [`'self'`],
    };

    // Adds fallbacks for browsers not compatible to CSP3 and CSP2.
    // These fallbacks are ignored by modern browsers in presence of hashes,
    // and 'strict-dynamic'.
    if (enableBrowserFallbacks) {
      // Fallback for Safari. All modern browsers supporting strict-dynamic will
      // ignore the 'https:' fallback.
      strictCspTemplate['script-src'].push('https:');
      // 'unsafe-inline' is only ignored in presence of a hash or nonce.
      if (hashes.length > 0) {
        strictCspTemplate['script-src'].push(`'unsafe-inline'`);
      }
    }

    // If enabled, dangerous DOM sinks will only accept typed objects instead of
    // strings.
    if (enableTrustedTypes) {
      strictCspTemplate = {
        ...strictCspTemplate,
        ...{ 'require-trusted-types-for': [`'script'`] },
      };
    }

    return Object.entries(strictCspTemplate)
      .map(([directive, values]) => {
        return `${directive} ${values.join(' ')};`;
      })
      .join('');
  }

  /**
   * Enables a CSP via a meta tag at the beginning of the document.
   * Warning: It's recommended to set CSP as HTTP response header instead of
   * using a meta tag. Injections before the meta tag will not be covered by CSP
   * and meta tags don't support CSP in report-only mode.
   *
   * @param csp A Content Security Policy string.
   */
  addMetaTag(csp: string): void {
    let metaTag = this.$('meta[http-equiv="Content-Security-Policy"]');
    if (!metaTag.length) {
      metaTag = cheerio.load('<meta http-equiv="Content-Security-Policy">')(
        'meta',
      );
      metaTag.prependTo(this.$('head'));
    }
    metaTag.attr('content', csp);
  }

  /**
   * Replaces all sourced scripts with a single inline script that can be hashed
   */
  refactorSourcedScriptsForHashBasedCsp(): void {
    const srcList = this.$(StrictCsp.SOURCED_SCRIPT_SELECTOR)
      .map((i: any, script: any) => {
        const src = this.$(script).attr('src');
        this.$(script).remove();
        return src;
      })
      .filter((src: any) => src !== null)
      .get();

    const loaderScript = StrictCsp.createLoaderScript(srcList);
    if (!loaderScript) {
      return;
    }

    // const hash = StrictCsp.hashInlineScript(loaderScript);
    // const comment = cheerio.load(`<!-- CSP hash: ${hash} -->`).root();
    // comment.appendTo(this.$('body'));
    const newScript = cheerio.load('<script>')('script');
    newScript.text(loaderScript);
    newScript.appendTo(this.$('body'));
  }

  /**
   * Returns a list of hashes of all inline scripts found in the HTML document.
   */
  hashAllInlineScripts(): string[] {
    return this.$(StrictCsp.INLINE_SCRIPT_SELECTOR)
      .map((i: any, elem: any) =>
        StrictCsp.hashInlineScript(this.$(elem).html() || ''),
      )
      .get();
  }

  /**
   * Returns a list of all inline scripts found in the HTML document.
   */
  getAllInlineScripts(): string[] {
    return this.$(StrictCsp.INLINE_SCRIPT_SELECTOR);
  }

  /**
   * Returns JS code for dynamically loading sourced (external) scripts.
   * @param srcList A list of paths for scripts that should be loaded.
   */
  static createLoaderScript(srcList: string[]): string | undefined {
    if (!srcList.length) {
      return undefined;
    }
    const srcListFormatted = srcList.map((s) => `'${s}'`).join();
    return `
      var scripts = [${srcListFormatted}];
      scripts.forEach(function(scriptUrl) {
        var s = document.createElement('script');
        s.src = scriptUrl;
        s.async = false; // preserve execution order.
        document.body.appendChild(s);
      });\n    `;
  }

  /**
   * Calculates a CSP compatible hash of an inline script.
   * @param scriptText Text between opening and closing script tag. Has to
   *     include whitespaces and newlines!
   */
  static hashInlineScript(scriptText: string): string {
    const hash = crypto
      .createHash(StrictCsp.HASH_FUNCTION)
      // EDITED
      .update(scriptText)
      .digest('base64');
    console.log(hash);
    return `'${StrictCsp.HASH_FUNCTION}-${hash}'`;
  }
}
