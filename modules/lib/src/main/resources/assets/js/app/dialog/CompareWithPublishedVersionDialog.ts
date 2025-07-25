import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {CheckboxBuilder} from '@enonic/lib-admin-ui/ui/Checkbox';
import {DefaultModalDialogHeader, ModalDialog, ModalDialogConfig, ModalDialogHeader} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Delta, DiffPatcher, formatters, HtmlFormatter} from 'jsondiffpatch';
import * as Q from 'q';
import {ActiveContentVersion} from '../ActiveContentVersion';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentVersion} from '../ContentVersion';
import {ContentVersionHelper} from '../ContentVersionHelper';
import {ContentServerChangeItem} from '../event/ContentServerChangeItem';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';
import {GetActiveContentVersionsRequest} from '../resource/GetActiveContentVersionsRequest';
import {GetContentVersionRequest} from '../resource/GetContentVersionRequest';
import {GetContentVersionsRequest} from '../resource/GetContentVersionsRequest';
import {GetContentVersionsResult} from '../resource/GetContentVersionsResult';
import {ContentVersionsLoader} from '../view/context/widget/version/ContentVersionsLoader';
import {VersionContext} from '../view/context/widget/version/VersionContext';

export class CompareWithPublishedVersionDialog
    extends ModalDialog {

    private static INSTANCE: CompareWithPublishedVersionDialog;

    private activeVersionId: string;

    private publishedVersionId: string;

    private versions: ContentVersion[];

    private content: ContentSummaryAndCompareStatus;

    private comparisonContainer: DivEl;

    private contentCache: Record<string, ContentJson>;

    private diffPatcher: DiffPatcher;

    private htmlFormatter: HtmlFormatter;

    private isLoading: boolean;

    private readonly versionsLoader: ContentVersionsLoader;

    protected constructor() {
        super({
            class: 'compare-content-versions-dialog grey-header',
            title: i18n('dialog.publishedChanges.header'),
            alwaysFullscreen: true
        } as ModalDialogConfig);

        this.versionsLoader = new ContentVersionsLoader();
        this.diffPatcher = new DiffPatcher();
        this.htmlFormatter = formatters.html;
    }

    protected initListeners() {
        super.initListeners();

        const serverEventsHandler: ContentServerEventsHandler = ContentServerEventsHandler.getInstance();

        const deletedHandler = (deletedItems: ContentServerChangeItem[]) => {
            if (this.content &&
                deletedItems.some((item: ContentServerChangeItem) => this.content.getContentId().equals(item.getContentId()))) {
                this.close();
            }
        };

        const updatedHandler = (updatedItems: ContentSummaryAndCompareStatus[]) => {
            const currentItem: ContentSummaryAndCompareStatus =
                updatedItems.find((item: ContentSummaryAndCompareStatus) => item.getContentId().equals(this.content?.getContentId()));

            if (currentItem) {
                (this.header as ShowPublishedVersionChangesDialogHeader).setSubTitle(currentItem.getPath().toString());

                this.loadVersionHistory();
            }
        };

        this.onShown(() => {
            serverEventsHandler.onContentDeleted(deletedHandler);
            serverEventsHandler.onContentUpdated(updatedHandler);
            serverEventsHandler.onContentPublished(updatedHandler);
            serverEventsHandler.onContentUnpublished(updatedHandler);
        });

        this.onHidden(() => {
            serverEventsHandler.unContentDeleted(deletedHandler);
            serverEventsHandler.unContentUpdated(updatedHandler);
            serverEventsHandler.unContentPublished(updatedHandler);
            serverEventsHandler.unContentUnpublished(updatedHandler);
        });

        VersionContext.onActiveVersionChanged((contentId: string, version: string) => {
            if (contentId === this.content?.getId()) {

                this.setActiveVersion(version);
            }
        });
    }

    protected createHeader(title: string): ShowPublishedVersionChangesDialogHeader {
        return new ShowPublishedVersionChangesDialogHeader(title);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then(rendered => {

            this.comparisonContainer = new DivEl('jsondiffpatch-delta');
            this.setLoading(this.isLoading);
            this.appendChildToContentPanel(this.comparisonContainer);

            const bottomContainer = new DivEl('container bottom');
            const changesCheckbox = new CheckboxBuilder().setLabelText(i18n('field.content.showEntire')).build();
            changesCheckbox.onValueChanged(event => {
                this.htmlFormatter.showUnchanged(event.getNewValue() === 'true', null, 0);
            });
            bottomContainer.appendChild(changesCheckbox);
            this.appendChildToFooter(bottomContainer);

            return rendered;
        });
    }

    public static get(): CompareWithPublishedVersionDialog {
        if (!CompareWithPublishedVersionDialog.INSTANCE) {
            CompareWithPublishedVersionDialog.INSTANCE = new CompareWithPublishedVersionDialog();
        }
        return CompareWithPublishedVersionDialog.INSTANCE;
    }

    setContent(content: ContentSummaryAndCompareStatus): CompareWithPublishedVersionDialog {
        this.content = content;
        (this.header as ShowPublishedVersionChangesDialogHeader).setSubTitle(content ? content.getPath().toString() : null);
        return this;
    }

    open() {
        super.open();
        this.contentCache = {};
        this.htmlFormatter.showUnchanged(false, null, 0);

        this.loadVersionHistory();
    }

    private loadVersionHistory(): Q.Promise<Content> {
        if (!this.content) {
            return;
        }

        this.setLoading(true);

        const versionsPromise = new GetContentVersionsRequest(this.content.getContentId()).sendAndParse();
        const activeVersionPromise = new GetActiveContentVersionsRequest(this.content.getContentId()).sendAndParse();

        Q.all([versionsPromise, activeVersionPromise]).spread(
            (versionsResult: GetContentVersionsResult, activeVersions: ActiveContentVersion[]) => {
                const versions = versionsResult.getContentVersions();
                const activeVersionId = activeVersions.shift()?.getContentVersion().getId();
                this.versions = versions;
                const publishedVersionId = ContentVersionHelper.findPublishedVersionId(versions);
                const pubIdChanged = publishedVersionId !== this.publishedVersionId;
                const actIdChanged = activeVersionId !== this.activeVersionId;
                if (pubIdChanged) {
                    this.setPublishedVersion(publishedVersionId, false);
                }
                if (actIdChanged) {
                    this.setActiveVersion(activeVersionId, false);
                }
                if (pubIdChanged || actIdChanged) {
                    this.displayDiff();
                }
            }).catch(DefaultErrorHandler.handle);
    }

    private setLoading(flag: boolean) {
        this.isLoading = flag;
        if (this.comparisonContainer) {
            if (flag) {
                this.comparisonContainer.addClass('loading');
            } else {
                this.comparisonContainer.removeClass('loading');
            }
        }
    }

    private setActiveVersion(version: string, updateDiff: boolean = true): Q.Promise<void> {
        this.activeVersionId = version;

        if (updateDiff) {
            return this.displayDiff();
        }

        return Q();
    }

    private setPublishedVersion(version: string, updateDiff: boolean = true): Q.Promise<void> {
        this.publishedVersionId = version;

        if (updateDiff) {
            return this.displayDiff();
    }

        return Q();
    }

    private displayDiff(): Q.Promise<void> {
        if (!this.activeVersionId) {
            return Q.reject('Can not compare without active version id');
        }
        const activeVersionId: string = this.extractId(this.activeVersionId);

        this.setLoading(true);

        const promises = [
            this.fetchVersionPromise(activeVersionId)
        ];
        if (this.publishedVersionId) {
            const publishedVersionId: string = this.extractId(this.publishedVersionId);
            promises.push(this.fetchVersionPromise(publishedVersionId));
        }

        return Q.all(promises).spread((activeJson: object, publishedJson: object) => {
            const delta: Delta = this.diffPatcher.diff(publishedJson || {}, activeJson,);
            let text;
            let isEmpty = false;
            if (delta) {
                text = formatters.html.format(delta, publishedJson || {});
            } else {
                isEmpty = true;
                text = `<h3>${i18n('dialog.publishedChanges.versionsIdentical')}</h3>`;
            }
            this.setLoading(false);

            this.whenRendered(() => {
                this.comparisonContainer.setHtml(text, false).toggleClass('empty', isEmpty);
            });
        });
    }

    private fetchVersionPromise(versionId: string): Q.Promise<ContentJson> {
        const cache = this.contentCache[versionId];

        if (cache) {
            return Q(cache);
        }

        return new GetContentVersionRequest(this.content.getContentId())
            .setVersion(versionId)
            .sendRequest().then(contentJson => {
                const processedContent = this.processContentJson(contentJson, versionId);
                this.contentCache[versionId] = processedContent;
                return processedContent;
            });
    }

    private extractId(versionId: string): string {
        return versionId.split(':')[0];
    }

    private processContentJson(contentJson: ContentJson, versionId: string): ContentJson {
        [
            '_id', 'creator', 'createdTime', 'hasChildren'
        ].forEach(e => delete contentJson[e]);

        const version: ContentVersion = ContentVersionHelper.getVersionById(this.versions, versionId);

        if (ObjectHelper.isDefined(version?.getPermissions())) {
            contentJson['permissions'] = version.getPermissions().toJson();
        }

        if (ObjectHelper.isDefined(version?.isInheritPermissions())) {
            contentJson['inheritPermissions'] = version.isInheritPermissions();
        }

        return contentJson;
    }
}

class ShowPublishedVersionChangesDialogHeader
    extends DefaultModalDialogHeader
    implements ModalDialogHeader {

    private readonly subTitleEl: H6El;

    constructor(title: string, subtitle?: string) {
        super(title);
        this.subTitleEl = new H6El('sub-title');
        this.appendChild(this.subTitleEl);
        if (subtitle) {
            this.setSubTitle(subtitle);
        }
    }

    getSubTitle(): string {
        return this.subTitleEl.getHtml();
    }

    setSubTitle(value: string, escapeHtml ?: boolean) {
        this.subTitleEl.setHtml(value, escapeHtml);
    }

}
