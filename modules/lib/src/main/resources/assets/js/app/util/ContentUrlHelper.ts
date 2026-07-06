import { UrlAction } from '../UrlAction';
import { UrlHelper } from './UrlHelper';
import { ContentAppHelper } from '../wizard/ContentAppHelper';
import { showWarning } from '@enonic/lib-admin-ui/notify/MessageBus';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { type ContentId } from '../content/ContentId';
import { type DependencyParams } from '../browse/DependencyParams';
import { ContentEditParams } from '../wizard/ContentEditParams';
import { type ContentCreateParams } from '../wizard/ContentCreateParams';
import { openNewTab, openTabOrFocusExisting } from '../../v6/shared/lib/url/navigation';

export class ContentUrlHelper {
    private static popupBlocked(win: Window) {
        return !win || win.closed || typeof win.closed === 'undefined';
    }

    // Tab tracking is delegated to the v6 registry so legacy and v6 paths
    // dedupe each other's wizard tabs.
    static openTabOrFocusExisting(url: string, name: string): Window {
        return openTabOrFocusExisting(url, name);
    }

    static openNewTab(url: string): Window {
        return openNewTab(url);
    }

    private static makeUrlParamsString(paramsList: string[]): string {
        if (paramsList?.length > 0) {
            let result: string = '?';

            paramsList.forEach((param: string, index: number) => {
                result = result + (index === 0 ? '' : '&') + param;
            });

            return result;
        }

        return '';
    }

    static openDependenciesTab(params: DependencyParams): void {
        const url: string = ContentUrlHelper.generateDependenciesURL(params);
        ContentUrlHelper.openNewTab(url);
    }

    static generateDependenciesURL(params: DependencyParams): string {
        const typePostfix: string = params.getContentType() ? `/${params.getContentType().toString()}` : '';
        const relativeUrl: string = `${params.getProjectName()}/${params.getDependencyType()}/${params.getBranch()}/${params.getContentId().toString()}${typePostfix}`;

        return UrlHelper.getPrefixedUrl(relativeUrl);
    }

    static openEditContentTab(data: ContentId | ContentEditParams): void {
        const params: ContentEditParams =
            data instanceof ContentEditParams ? data : ContentEditParams.create(data).build();
        const url: string = ContentUrlHelper.generateEditContentUrl(params);
        const tabName: string = `${UrlAction.EDIT}:${params.getProjectName()}:${params.getContentId().toString()}`;

        const win: Window = ContentUrlHelper.openTabOrFocusExisting(url, tabName);

        if (ContentUrlHelper.popupBlocked(win)) {
            showWarning(i18n('notify.popupBlocker.admin'), false);
        }
    }

    static generateEditContentUrl(data: ContentId | ContentEditParams): string {
        const params: ContentEditParams =
            data instanceof ContentEditParams ? data : ContentEditParams.create(data).build();
        const urlParams: string = this.makeUrlParamsString(this.makeEditParams(params));
        const relativeUrl: string = `${params.getProjectName()}/${UrlAction.EDIT}/${params.getContentId().toString()}${urlParams}`;

        return UrlHelper.getPrefixedUrl(relativeUrl, '');
    }

    private static makeEditParams(params: ContentEditParams): string[] {
        const paramsList: string[] = [];

        if (params.getDisplayAsNew()) {
            paramsList.push(ContentAppHelper.DISPLAY_AS_NEW);
        }

        if (params.getLocalized()) {
            paramsList.push(ContentAppHelper.LOCALIZED);
        }

        return paramsList;
    }

    static openNewContentTab(params: ContentCreateParams): void {
        const url: string = ContentUrlHelper.generateCreateContentUrl(params);

        const win: Window = ContentUrlHelper.openNewTab(url);

        if (ContentUrlHelper.popupBlocked(win)) {
            showWarning(i18n('notify.popupBlocker.admin'), false);
        }
    }

    static generateCreateContentUrl(params: ContentCreateParams): string {
        const parentPostfix: string = params.getParentContentId() ? `/${params.getParentContentId().toString()}` : '';
        const relativeUrl: string = `${params.getProjectName()}/${UrlAction.NEW}/${params.getContentTypeName().toString()}${parentPostfix}`;

        return UrlHelper.getPrefixedUrl(relativeUrl, '');
    }
}
