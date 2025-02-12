//! This file exists for compatibility with XP 7.16, while there is no types for it in @enonic-types
// TODO: Remove this file when we upgrade to XP 7.16

/**
 * Functions to access portal functionality.
 *
 * @example
 * var portalLib = require('/lib/xp/portal');
 *
 * @module portal
 */
declare global {
    interface XpLibraries {
        '/lib/xp/portal': typeof import('./portal');
    }
}
import type {ByteSource, Component, Content} from '@enonic-types/core';
export type {Attachment, ByteSource, Component, Content, Region} from '@enonic-types/core';
export declare type Site<Config> = Content<{
    description?: string;
    siteConfig: SiteConfig<Config> | SiteConfig<Config>[];
}, 'portal:site'>;
export interface SiteConfig<Config> {
    applicationKey: string;
    config: Config;
}
export declare type Without<T, U> = {
    [P in Exclude<keyof T, keyof U>]?: never;
};
export declare type XOR<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;
export declare type IdXorPath = XOR<{
    id: string;
}, {
    path: string;
}>;
export interface AssetUrlParams {
    path: string;
    application?: string;
    type?: 'server' | 'absolute';
    params?: object;
}
/**
 * This function generates a URL pointing to a static file.
 *
 * @example-ref examples/portal/assetUrl.js
 *
 * @param {object} params Input parameters as JSON.
 * @param {string} params.path Path to the asset.
 * @param {string} [params.application] Other application to reference to. Defaults to current application.
 * @param {string} [params.type=server] URL type. Either `server` (server-relative URL) or `absolute`.
 * @param {object} [params.params] Custom parameters to append to the url.
 *
 * @returns {string} The generated URL.
 */
export declare function assetUrl(params: AssetUrlParams): string;
export declare type ImageUrlParams = IdXorPath & {
    quality?: number;
    background?: string;
    format?: string;
    filter?: string;
    server?: string;
    params?: object;
    type?: 'server' | 'absolute';
    scale: `block(${number},${number})` | `height(${number})` | `max(${number})` | `square(${number})` | `wide(${number},${number})` | `width(${number})` | 'full';
};
/**
 * This function generates a URL pointing to an image.
 *
 * @example-ref examples/portal/imageUrl.js
 *
 * @param {object} params Input parameters as JSON.
 * @param {string} params.id ID of the image content.
 * @param {string} params.path Path to the image. If `id` is specified, this parameter is not used.
 * @param {string} params.scale Required. Options are width(px), height(px), block(width,height) and square(px).
 * @param {number} [params.quality=85] Quality for JPEG images, ranges from 0 (max compression) to 100 (min compression).
 * @param {string} [params.background] Background color.
 * @param {string} [params.format] Format of the image.
 * @param {string} [params.filter] A number of filters are available to alter the image appearance, for example, blur(3), grayscale(), rounded(5), etc.
 * @param {string} [params.type=server] URL type. Either `server` (server-relative URL) or `absolute`.
 * @param {object} [params.params] Custom parameters to append to the url.
 *
 * @returns {string} The generated URL.
 */
export declare function imageUrl(params: ImageUrlParams): string;
export interface ComponentUrlParams {
    id?: string;
    path?: string;
    component?: string;
    type?: 'server' | 'absolute';
    params?: object;
}
/**
 * This function generates a URL pointing to a component.
 *
 * @example-ref examples/portal/componentUrl.js
 *
 * @param {object} params Input parameters as JSON.
 * @param {string} [params.id] Id to the page.
 * @param {string} [params.path] Path to the page.
 * @param {string} [params.component] Path to the component. If not set, the current path is set.
 * @param {string} [params.type=server] URL type. Either `server` (server-relative URL) or `absolute`.
 * @param {object} [params.params] Custom parameters to append to the url.
 *
 * @returns {string} The generated URL.
 */
export declare function componentUrl(params: ComponentUrlParams): string;
export interface AttachmentUrlParams {
    id?: string;
    path?: string;
    name?: string;
    label?: string;
    download?: boolean;
    type?: 'server' | 'absolute';
    params?: object;
}
/**
 * This function generates a URL pointing to an attachment.
 *
 * @example-ref examples/portal/attachmentUrl.js
 *
 * @param {object} params Input parameters as JSON.
 * @param {string} [params.id] Id to the content holding the attachment.
 * @param {string} [params.path] Path to the content holding the attachment.
 * @param {string} [params.name] Name of the attachment.
 * @param {string} [params.label=source] Label of the attachment.
 * @param {boolean} [params.download=false] Set to true if the disposition header should be set to attachment.
 * @param {string} [params.type=server] URL type. Either `server` (server-relative URL) or `absolute`.
 * @param {object} [params.params] Custom parameters to append to the url.
 *
 * @returns {string} The generated URL.
 */
export declare function attachmentUrl(params: AttachmentUrlParams): string;
export declare type PageUrlParams = IdXorPath & {
    type?: 'server' | 'absolute';
    params?: object;
};
/**
 * This function generates a URL pointing to a page.
 *
 * @example-ref examples/portal/pageUrl.js
 *
 * @param {object} params Input parameters as JSON.
 * @param {string} [params.id] Id to the page. If id is set, then path is not used.
 * @param {string} [params.path] Path to the page. Relative paths is resolved using the context page.
 * @param {string} [params.type=server] URL type. Either `server` (server-relative URL) or `absolute`.
 * @param {object} [params.params] Custom parameters to append to the url.
 *
 * @returns {string} The generated URL.
 */
export declare function pageUrl(params: PageUrlParams): string;
export interface ServiceUrlParams {
    service: string;
    application?: string;
    type?: 'server' | 'absolute' | 'websocket';
    params?: object;
}
/**
 * This function generates a URL pointing to a service.
 *
 * @example-ref examples/portal/serviceUrl.js
 *
 * @param {object} params Input parameters as JSON.
 * @param {string} params.service Name of the service.
 * @param {string} [params.application] Other application to reference to. Default is current application.
 * @param {string} [params.type=server] URL type. Either `server` (server-relative URL) or `absolute` or `websocket`.
 * @param {object} [params.params] Custom parameters to append to the url.
 *
 * @returns {string} The generated URL.
 */
export declare function serviceUrl(params: ServiceUrlParams): string;
export interface IdProviderUrlParams {
    idProvider?: string;
    contextPath?: string;
    type?: 'server' | 'absolute';
    params?: object;
}
/**
 * This function generates a URL pointing to an ID provider.
 *
 *
 * @param {object} [params] Input parameters as JSON.
 * @param {string} [params.idProvider] Key of an ID provider.
 * If idProvider is not set, then the id provider corresponding to the current execution context will be used.
 * @param {string} [params.contextPath=vhost] Context path. Either `vhost` (using vhost target path) or `relative` to the current path.
 * @param {string} [params.type=server] URL type. Either `server` (server-relative URL) or `absolute`.
 * @param {object} [params.params] Custom parameters to append to the url.
 *
 * @returns {string} The generated URL.
 */
export declare function idProviderUrl(params: IdProviderUrlParams): string;
export interface LoginUrlParams {
    idProvider?: string;
    redirect?: string;
    contextPath?: string;
    type?: 'server' | 'absolute';
    params?: object;
}
/**
 * This function generates a URL pointing to the login function of an ID provider.
 *
 *
 * @param {object} [params] Input parameters as JSON.
 * @param {string} [params.idProvider] Key of the id provider using an application.
 * If idProvider is not set, then the id provider corresponding to the current execution context will be used.
 * @param {string} [params.redirect] The URL to redirect to after the login.
 * @param {string} [params.contextPath=vhost] Context path. Either `vhost` (using vhost target path) or `relative` to the current path.
 * @param {string} [params.type=server] URL type. Either `server` (server-relative URL) or `absolute`.
 * @param {object} [params.params] Custom parameters to append to the url.
 *
 * @returns {string} The generated URL.
 */
export declare function loginUrl(params: LoginUrlParams): string;
export interface LogoutUrlParams {
    redirect?: string;
    contextPath?: string;
    type?: 'server' | 'absolute';
    params?: object;
}
/**
 * This function generates a URL pointing to the logout function of the application corresponding to the current user.
 *
 *
 * @param {object} [params] Input parameters as JSON.
 * @param {string} [params.redirect] The URL to redirect to after the logout.
 * @param {string} [params.contextPath=vhost] Context path. Either `vhost` (using vhost target path) or `relative` to the current path.
 * @param {string} [params.type=server] URL type. Either `server` (server-relative URL) or `absolute`.
 * @param {object} [params.params] Custom parameters to append to the url.
 *
 * @returns {string} The generated URL.
 */
export declare function logoutUrl(params: LogoutUrlParams): string;
export interface UrlParams {
    path: string;
    type?: 'server' | 'absolute' | 'websocket';
    params?: object;
}
/**
 * This function generates a URL.
 *
 * @example-ref examples/portal/url.js
 *
 * @param {object} params Input parameters as JSON.
 * @param {string} params.path Path of the resource.
 * @param {string} [params.type=server] URL type. Either `server` (server-relative URL) or `absolute` or `websocket`.
 * @param {object} [params.params] Custom parameters to append to the url.
 *
 * @returns {string} The generated URL.
 */
export declare function url(params: UrlParams): string;
export interface ProcessHtmlParams {
    value: string;
    type?: 'server' | 'absolute';
    imageWidths?: number[];
    imageSizes?: string;
}
/**
 * This function replaces abstract internal links contained in an HTML text by generated URLs.
 *
 * When outputting processed HTML in Thymeleaf, use attribute `data-th-utext="${processedHtml}"`.
 *
 * @example-ref examples/portal/processHtml.js
 *
 * @param {object} params Input parameters as JSON.
 * @param {string} params.value Html value string to process.
 * @param {string} [params.type=server] URL type. Either `server` (server-relative URL) or `absolute`.
 * @param {number[]} [params.imageWidths] List of image width. Allows to generate image URLs for given image widths and use them in the `srcset` attribute of a `img` tag.
 * @param {string} [params.imageSizes] Specifies the width for an image depending on browser dimensions. The value has the following format: (media-condition) width. Multiple sizes are comma-separated.
 *
 * @returns {string} The processed HTML.
 */
export declare function processHtml(params: ProcessHtmlParams): string;
/**
 * This function sanitizes an HTML string by stripping all potentially unsafe tags and attributes.
 *
 * HTML sanitization can be used to protect against cross-site scripting (XSS) attacks by sanitizing any HTML code submitted by a user.
 *
 * @example-ref examples/portal/sanitizeHtml.js
 *
 * @param {string} html Html string value to process.
 *
 * @returns {string} The sanitized HTML.
 */
export declare function sanitizeHtml(html: string): string;
/**
 * This function returns the parent site of the content corresponding to the current execution context. It is meant to be
 * called from a page, layout or part controller.
 *
 * @example-ref examples/portal/getSite.js
 *
 * @returns {object|null} The current site as JSON.
 */
export declare function getSite<Config = Record<string, unknown>>(): Site<Config> | null;
/**
 * This function returns the site configuration for this app in the parent site of the content corresponding to the current
 * execution context. It is meant to be called from a page, layout or part controller.
 *
 * @example-ref examples/portal/getSiteConfig.js
 *
 * @returns {object|null} The site configuration for current application as JSON.
 */
export declare function getSiteConfig<Config = Record<string, unknown>>(): Config | null;
/**
 * This function returns the content corresponding to the current execution context. It is meant to be called from a page, layout or
 * part controller
 *
 * @example-ref examples/portal/getContent.js
 *
 * @returns {object|null} The current content as JSON.
 */
export declare function getContent<Hit extends Content<unknown> = Content>(): Hit | null;
/**
 * This function returns the component corresponding to the current execution context. It is meant to be called
 * from a layout or part controller.
 *
 * @example-ref examples/portal/getComponent.js
 *
 * @returns {object|null} The current component as JSON.
 */
export declare function getComponent<_Component extends Component = Component>(): _Component | null;
/**
 * This function returns the id provider key corresponding to the current execution context.
 *
 * @example-ref examples/portal/getIdProviderKey.js
 *
 * @returns {string|null} The current id provider as JSON.
 */
export declare function getIdProviderKey(): string | null;
export interface MultipartItem {
    name: string;
    fileName: string;
    contentType: string;
    size: number;
}
export interface MultipartForm {
    [key: string]: MultipartItem | MultipartItem[];
}
/**
 * This function returns a JSON containing multipart items. If not a multipart request, then this function returns `undefined`.
 *
 * @example-ref examples/portal/getMultipartForm.js
 *
 * @returns {object} The multipart form items.
 */
export declare function getMultipartForm(): MultipartForm;
/**
 * This function returns a JSON containing a named multipart item. If the item does not exists, it returns `undefined`.
 *
 * @example-ref examples/portal/getMultipartItem.js
 *
 * @param {string} name Name of the multipart item.
 * @param {number} [index] Optional zero-based index. It should be specified if there are multiple items with the same name.
 *
 * @returns {object|null} The named multipart form item.
 */
export declare function getMultipartItem(name: string, index?: number): MultipartItem | null;
/**
 * This function returns a data-stream for a named multipart item.
 *
 * @example-ref examples/portal/getMultipartStream.js
 *
 * @param {string} name Name of the multipart item.
 * @param {number} [index] Optional zero-based index. It should be specified if there are multiple items with the same name.
 *
 * @returns {*} Stream of multipart item data.
 */
export declare function getMultipartStream(name: string, index?: number): ByteSource | null;
/**
 * This function returns the multipart item data as text.
 *
 * @example-ref examples/portal/getMultipartText.js
 *
 * @param {string} name Name of the multipart item.
 * @param {number} [index] Optional zero-based index. It should be specified if there are multiple items with the same name.
 *
 * @returns {string|null} Text for multipart item data.
 */
export declare function getMultipartText(name: string, index?: number): string | null;
export interface ImagePlaceholderParams {
    width?: number;
    height?: number;
}
/**
 * This function generates a URL to an image placeholder.
 *
 * @example-ref examples/portal/imagePlaceholder.js
 *
 * @param {object} params Image parameters as JSON.
 * @param {number} params.width Width of the image in pixels.
 * @param {number} params.height Height of the image in pixels.
 *
 * @returns {string} Placeholder image URL.
 */
export declare function imagePlaceholder(params: ImagePlaceholderParams): string;
export interface ApiUrlParams {
    application?: string;
    api: string;
    type?: 'server' | 'absolute' | 'websocket';
    params?: object;
    path?: string | string[];
}
/**
 * This function generates a URL pointing to a Universal API.
 *
 * @example-ref examples/portal/apiUrl.js
 *
 * @param {object} urlParams Input parameters as JSON.
 * @param {string} urlParams.application Application to reference to the API.
 * @param {string} [urlParams.api] Name of the API
 * @param {string} [urlParams.type=server] URL type. Either `server` (server-relative URL) or `absolute` or `websocket`.
 * @param {string|string[]} [urlParams.path] Path(s) to be appended to the base URL following the api segment to complete request URL.
 * @param {object} [urlParams.params] Custom parameters to append to the URL.
 *
 * @returns {string} The generated URL.
 */
export declare function apiUrl(urlParams: ApiUrlParams): string;
