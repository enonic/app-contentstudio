//! This file exists for compatibility with XP 7.16, while there is no types for it in @enonic-types
// TODO: Remove this file when we upgrade to XP 7.16

declare global {
    interface XpLibraries {
        '/lib/xp/admin': typeof import('./admin');
    }
}
/**
 * Returns the admin base uri.
 *
 * @returns {string} Admin base uri.
 */
export declare function getBaseUri(): string;
/**
 * Returns the admin assets uri.
 *
 * @returns {string} Assets uri.
 */
export declare function getAssetsUri(): string;
/**
 * Returns the preferred locale based on the current HTTP request, or the server default locale if none is specified.
 *
 * @returns {string} Current locale.
 */
export declare function getLocale(): string;
/**
 * Returns the list of preferred locales based on the current HTTP request, or the server default locale if none is specified.
 *
 * @returns {string[]} Current locales in order of preference.
 */
export declare function getLocales(): string[];
/**
 * Returns all i18n phrases.
 *
 * @returns {object} JSON object with phrases.
 */
export declare function getPhrases(): string;
/**
 * Returns the URL for launcher panel.
 *
 * @returns {string} URL.
 */
export declare function getLauncherUrl(): string;
/**
 * Returns the URL for launcher javascript.
 *
 * @returns {string} Path.
 */
export declare function getLauncherPath(): string;
/**
 * Returns the URL for an admin tool of specific application.
 * @param {string} application Full application name (f.ex, 'com.enonic.app')
 * @param {string} tool Name of the tool inside an app (f.ex, 'main')
 *
 * @returns {string} URL.
 */
export declare function getToolUrl(application: string, tool: string): string;
/**
 * Returns the URL for the Home admin tool.
 * @param {object} [params] Parameter object
 * @param {string} [params.type=server] URL type. Either `server` (server-relative URL) or `absolute`.
 *
 * @returns {string} URL.
 */
export declare function getHomeToolUrl(params?: GetHomeToolUrlParams): string;
export interface GetHomeToolUrlParams {
    type: HomeToolUrlType;
}
export declare type HomeToolUrlType = 'server' | 'absolute';
/**
 * Returns installation name.
 *
 * @returns {string} Installation name.
 */
export declare function getInstallation(): string;
/**
 * Returns version of XP installation.
 *
 * @returns {string} Version.
 */
export declare function getVersion(): string;
export interface WidgetUrlParams {
    application: string;
    widget: string;
    type?: 'server' | 'absolute';
    params?: object;
}
/**
 * Returns the URL for a widget.
 *
 * @param {object} [params] Parameter object
 * @param {string} params.application Application to reference to a widget.
 * @param {string} params.widget Name of the widget.
 * @param {string} [params.type=server] URL type. Either `server` (server-relative URL) or `absolute`.
 * @param {object} [params.params] Custom parameters to append to the url.
 *
 * @returns {string} URL.
 */
export declare function widgetUrl(params: WidgetUrlParams): string;
