import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {LabelEl} from '@enonic/lib-admin-ui/dom/LabelEl';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {CheckboxBuilder} from '@enonic/lib-admin-ui/ui/Checkbox';
import {DefaultModalDialogHeader, ModalDialog, ModalDialogConfig, ModalDialogHeader} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';
import {Menu} from '@enonic/lib-admin-ui/ui/menu/Menu';
import {FilterableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapper';
import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {Delta, DiffPatcher, formatters, HtmlFormatter} from 'jsondiffpatch';
import * as Q from 'q';
import {ContentJson} from '../content/ContentJson';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentVersion} from '../ContentVersion';
import {ContentVersionHelper} from '../ContentVersionHelper';
import {ContentServerChangeItem} from '../event/ContentServerChangeItem';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';
import {GetContentVersionRequest} from '../resource/GetContentVersionRequest';
import {GetContentVersionsRequest} from '../resource/GetContentVersionsRequest';
import {GetContentVersionsResult} from '../resource/GetContentVersionsResult';
import {ContentVersionsConverter} from '../view/context/widget/version/ContentVersionsConverter';
import {ContentVersionsLoader} from '../view/context/widget/version/ContentVersionsLoader';
import {ContentVersionViewer} from '../view/context/widget/version/ContentVersionViewer';
import {NonBatchedContentVersionsConverter} from '../view/context/widget/version/NonBatchedContentVersionsConverter';
import {VersionContext} from '../view/context/widget/version/VersionContext';
import {VersionHistoryHelper} from '../view/context/widget/version/VersionHistoryHelper';
import {AliasType, VersionHistoryItem} from '../view/context/widget/version/VersionHistoryItem';

export class CompareContentVersionsDialog
    extends ModalDialog {

    private static INSTANCE: CompareContentVersionsDialog;

    private leftVersionId: string;

    private rightVersionId: string;

    private versions: ContentVersion[];

    private content: ContentSummaryAndCompareStatus;

    private toolbar: DivEl;

    private leftDropdown: CompareDropdown;

    private rightDropdown: CompareDropdown;

    private leftLabel: LabelEl;

    private rightLabel: LabelEl;

    private comparisonContainer: DivEl;

    private revertLeftButton: Button;

    private revertRightButton: Button;

    private contentCache: Record<string, object>;

    private diffPatcher: DiffPatcher;

    private htmlFormatter: HtmlFormatter;

    private readonly versionsLoader: ContentVersionsLoader;

    private outsideClickListener: (event: MouseEvent) => void;

    private versionIdCounters: Record<string, number>;

    private revertVersionCallback: (versionId: string, versionDate: Date) => void;

    private readOnly: boolean;

    protected constructor() {
        super({
            class: 'compare-content-versions-dialog grey-header',
            title: i18n('dialog.compareVersions.comparingVersions'),
            alwaysFullscreen: true
        } as ModalDialogConfig);

        this.versionsLoader = new ContentVersionsLoader();
        this.diffPatcher = new DiffPatcher();
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
                (this.header as CompareContentVersionsDialogHeader).setSubTitle(currentItem.getPath().toString());
            }
        };

        this.onShown(() => {
            serverEventsHandler.onContentDeleted(deletedHandler);
            serverEventsHandler.onContentUpdated(updatedHandler);
        });

        this.onHidden(() => {
            serverEventsHandler.unContentDeleted(deletedHandler);
            serverEventsHandler.unContentUpdated(updatedHandler);
        });

        VersionContext.onActiveVersionChanged((contentId: string, version: string) => {
            if (contentId === this.content?.getId()) {
                this.rightVersionId = null;
                this.reloadVersions();
            }
        });
    }

    private createVersionDropdown(stylePrefix: string): CompareDropdown {
        const dropdown = new CompareDropdown();
        dropdown.addClass(`${stylePrefix}-version`);

        dropdown.onSelectionChanged((selectionChange: SelectionChange<VersionHistoryItem>) => {
            if (selectionChange.selected.length > 0) {
                if (!this.isRendered()) {
                    return;
                }

                this.handleVersionChanged(dropdown === this.leftDropdown);
            }

        });

        this.onClosed(() => dropdown.hideDropdown());

        return dropdown;
    }

    private getSelectedVersionId(isLeft: boolean): string {
        return (isLeft ? this.leftDropdown : this.rightDropdown).getSelectedItems()[0]?.getSecondaryId();
    }

    private handleVersionChanged(isLeft: boolean) {
        this.leftVersionId = this.getSelectedVersionId(true);
        this.rightVersionId = this.getSelectedVersionId(false);

        if (!this.leftVersionId || !this.rightVersionId) {
            return;
        }

        if (!isLeft && this.leftVersionRequiresForcedSelection()) {
            this.leftVersionId = this.rightVersionId;
            this.forceSelectVersion(this.leftDropdown, this.leftVersionId, true);
        }

        this.updateButtonsState();
        if (this.updateAliases(!isLeft) !== false) {
            this.displayDiff();
        }
    }

    private createVersionRevertButton(dropdown: CompareDropdown): Button {
        const revertAction: Action = new Action(i18n('field.version.revert')).onExecuted(() => {
            const version: VersionHistoryItem = dropdown.getSelectedItems()[0];
            this.revertVersionCallback(version.getId(), version.getContentVersion().getTimestamp());
        });
        revertAction.setTitle(i18n('field.version.makeCurrent'));

        const menu = new Menu([revertAction]);
        menu.onItemClicked(() => {
            this.setMenuVisible(false, menu, button);
        });

        const button = new Button();
        button.addClass('context-menu transparent icon-more_vert icon-large revert-button');
        button.onClicked((event: MouseEvent) => {
            event.stopImmediatePropagation();
            event.preventDefault();
            const flag = !menu.isVisible();
            this.setMenuVisible(flag, menu, button);
        });
        button.appendChild(menu);

        this.onClosed(() => this.setMenuVisible(false, menu, button));

        return button;
    }

    private bindOutsideClickListener(enableEdit: boolean, menu: Menu, button: Button) {
        const body = Body.get();
        if (!this.outsideClickListener) {
            this.outsideClickListener = (event: MouseEvent) => {
                if (!button.getEl().contains(event.target as HTMLElement)) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    this.setMenuVisible(false, menu, button);
                }
            };
        }
        if (enableEdit) {
            body.onClicked(this.outsideClickListener);
        } else {
            body.unClicked(this.outsideClickListener);
        }
    }

    private setMenuVisible(flag: boolean, menu: Menu, button: Button) {
        menu.setVisible(flag);
        button.toggleClass('expanded', flag);
        this.bindOutsideClickListener(flag, menu, button);
    }

    protected createHeader(title: string): CompareContentVersionsDialogHeader {
        return new CompareContentVersionsDialogHeader(title);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then(rendered => {
            this.toolbar = new DivEl('toolbar-container');
            this.comparisonContainer = new DivEl('jsondiffpatch-delta');

            this.leftDropdown = this.createVersionDropdown('left');
            this.leftDropdown.getList().onShown(() => this.disableLeftVersions());
            this.revertLeftButton = this.createVersionRevertButton(this.leftDropdown);

            this.leftLabel = new LabelEl(i18n('dialog.compareVersions.olderVersion'));
            const leftContainer = new DivEl('container left');
            leftContainer.appendChildren<Element>(this.leftLabel, this.leftDropdown, this.revertLeftButton);

            this.rightLabel = new LabelEl(i18n('dialog.compareVersions.newerVersion'));
            this.rightDropdown = this.createVersionDropdown('right');
            this.rightDropdown.getList().onShown(() => this.disableRightVersions());
            this.revertRightButton = this.createVersionRevertButton(this.rightDropdown);

            const rightContainer = new DivEl('container right');
            rightContainer.appendChildren<Element>(this.rightLabel, this.rightDropdown, this.revertRightButton);

            const bottomContainer = new DivEl('container bottom');
            this.htmlFormatter = formatters.html;
            this.htmlFormatter.showUnchanged(false, null, 0);
            const changesCheckbox = new CheckboxBuilder().setLabelText(i18n('field.content.showEntire')).build();
            changesCheckbox.onValueChanged(event => {
                this.htmlFormatter.showUnchanged(event.getNewValue() === 'true', null, 0);
            });
            bottomContainer.appendChild(changesCheckbox);
            this.appendChildToFooter(bottomContainer);

            return this.reloadVersions().then(() => {
                this.toolbar.appendChildren(leftContainer, rightContainer);

                const itemToSelectInLeft = this.leftDropdown.getList().getItem(this.leftVersionId);
                if (itemToSelectInLeft) {
                    this.leftDropdown.select(itemToSelectInLeft);
                }

                const itemToSelectInRight = this.rightDropdown.getList().getItem(this.rightVersionId);
                if (itemToSelectInRight) {
                    this.rightDropdown.select(itemToSelectInRight);
                }

                this.appendChildToHeader(this.toolbar);
                this.appendChildToContentPanel(this.comparisonContainer);

                this.updateButtonsState();
                this.displayDiff();

                return rendered;
            });
        });
    }

    public static get(): CompareContentVersionsDialog {
        if (!CompareContentVersionsDialog.INSTANCE) {
            CompareContentVersionsDialog.INSTANCE = new CompareContentVersionsDialog();
        }
        return CompareContentVersionsDialog.INSTANCE;
    }

    setRevertVersionCallback(callback: (versionId: string, versionDate: Date) => void): CompareContentVersionsDialog {
        this.revertVersionCallback = callback;
        return this;
    }

    setRightVersion(version: VersionHistoryItem): CompareContentVersionsDialog {
        this.rightVersionId = `${version.getId()}:${version.getStatus()}`;
        return this;
    }

    resetLeftVersion(): CompareContentVersionsDialog {
        this.leftVersionId = null;
        return this;
    }

    setContent(content: ContentSummaryAndCompareStatus): CompareContentVersionsDialog {
        this.content = content;
        (this.header as CompareContentVersionsDialogHeader).setSubTitle(content ? content.getPath().toString() : null);
        return this;
    }

    setReadOnly(value: boolean): CompareContentVersionsDialog {
        this.readOnly = value;
        return this;
    }

    open() {
        super.open();
        this.contentCache = {};

        if (!this.isRendered()) {
            return;
        }

        this.htmlFormatter.showUnchanged(false, null, 0);
        this.reloadVersions();
    }

    private reloadVersions(): Q.Promise<void> {
        if (!this.content) {
            return;
        }

        ContentVersionHelper.fetchAndSetActiveVersion(this.content.getContentId());

        return new GetContentVersionsRequest(this.content.getContentId()).sendAndParse().then((result: GetContentVersionsResult) => {
            this.versions = result.getContentVersions();
            this.versionIdCounters = {};

            const items: VersionHistoryItem[] = this.convertVersionsToHistoryItems();

            this.updateLeftDropdown(items);
            this.updateRightDropdown(items);

            this.updateButtonsState();
            this.displayDiff();
        });
    }

    private updateLeftDropdown(items: VersionHistoryItem[]): void {
        this.leftDropdown?.getList().clearItems();
        const newestVersionOption: VersionHistoryItem = this.getNewestVersionOption(items);
        const leftAliases: VersionHistoryItem[] =
            this.createLeftAliases(items, newestVersionOption.getContentVersion().getTimestamp().getTime());
        const itemsToSet: VersionHistoryItem[] =
            leftAliases.concat(items).sort(this.itemsSorter.bind(this));

        this.leftDropdown.getList().setItems(itemsToSet);

        if (!this.leftVersionId) {
            const prev: VersionHistoryItem =
                leftAliases.find((v: VersionHistoryItem) => v.getAliasType() === AliasType.PREV);
            this.leftVersionId = prev?.getSecondaryId() || newestVersionOption.getSecondaryId();
        }

        const leftOptionToSelect: VersionHistoryItem = this.getNewOptionToSelect(this.leftDropdown, this.leftVersionId);

        if (leftOptionToSelect) {
            this.leftDropdown.select(leftOptionToSelect, true);
        }
    }

    private updateRightDropdown(items: VersionHistoryItem[]): void {
        this.rightDropdown?.getList().clearItems();
        const rightAliases: VersionHistoryItem[] = this.createRightAliases(items);
        const itemsToSet: VersionHistoryItem[] =
            rightAliases.concat(items).sort(this.itemsSorter.bind(this));
        this.rightDropdown.getList().setItems(itemsToSet);

        const rightOptionToSelect: VersionHistoryItem = this.getNewOptionToSelect(this.rightDropdown, this.rightVersionId);

        if (rightOptionToSelect) {
            this.rightDropdown.select(rightOptionToSelect, true);
        }
    }

    private convertVersionsToHistoryItems(): VersionHistoryItem[] {
        return new NonBatchedContentVersionsConverter(this.content).convert(this.versions);
    }

    private getNewOptionToSelect(dropdown: CompareDropdown, versionId: string): VersionHistoryItem {
        const newOptionToSelect: VersionHistoryItem = dropdown.getList().getItem(versionId);
        const currentSelectedValue: string = dropdown.getSelectedItems()[0]?.getSecondaryId();
        return (!!newOptionToSelect && versionId !== currentSelectedValue) ? newOptionToSelect : null;
    }

    private updateAliases(isLeft: boolean): boolean {
        const dropdown: CompareDropdown = isLeft ? this.leftDropdown : this.rightDropdown;
        let selectedAliasType: AliasType;
        const selectedItem: VersionHistoryItem = dropdown.getSelectedItems()[0];

        if (selectedItem) {
            selectedAliasType = selectedItem.getAliasType();
        }

        let nextOption: VersionHistoryItem = dropdown.getList().getItems()[0];
        while (nextOption.isAlias()) {
            dropdown.getList().removeItems(nextOption);
            nextOption = dropdown.getList().getItems()[0];
        }

        let aliasFound: VersionHistoryItem;

        const items = dropdown.getList().getItems();
        const aliases: VersionHistoryItem[] = isLeft ? this.createLeftAliases(items,
            selectedItem?.getContentVersion().getTimestamp().getTime()) : this.createRightAliases(items);

        aliases.forEach((alias: VersionHistoryItem) => {
            if (alias.getAliasType() === selectedAliasType) {
                aliasFound = alias;
                // update version with new alias id
                if (isLeft) {
                    this.leftVersionId = alias.getSecondaryId();
                } else {
                    this.rightVersionId = alias.getSecondaryId();
                }
            }
        });

        // sort first to ensure correct order
        const itemsToSet = items.concat(aliases).sort(this.itemsSorter.bind(this));
        dropdown.getList().setItems(itemsToSet);

        if (aliasFound) {
            dropdown.select(aliasFound, true);
        }

        if (selectedAliasType && !aliasFound) {
            // set same value as in the other dropdown
            this.forceSelectVersion(dropdown, isLeft ? this.rightVersionId : this.leftVersionId);
            return false;
        }

        return true;
    }

    private getNewestVersionOption(items: VersionHistoryItem[]): VersionHistoryItem {
        let newest = items.find(item => item.getAliasType() === AliasType.NEWEST);
        if (!newest) {
            items.forEach(item => {
                if (!newest || item.getContentVersion().getTimestamp() >
                    newest.getContentVersion().getTimestamp()) {
                    newest = item;
                }
            });
        }

        return newest;
    }

    private getNewestPublishedVersion(items: VersionHistoryItem[], maxDateTime: number): VersionHistoryItem {
        return items
            .filter((version: VersionHistoryItem) => version.getContentVersion().isPublished() &&
                                                     (!maxDateTime || version.getContentVersion().getTimestamp().getTime() <= maxDateTime))
            .sort((v1, v2) => v2.getContentVersion().getPublishInfo().getTimestamp().getTime() -
                              v1.getContentVersion().getPublishInfo().getTimestamp().getTime())[0];
    }

    private getNewestVersion(items: VersionHistoryItem[]): VersionHistoryItem {
        return items
            .sort((v1, v2) => v2.getContentVersion().getTimestamp().getTime() - v1.getContentVersion().getTimestamp().getTime())[0];
    }

    private getVersionIndexInOptions(items: VersionHistoryItem[], versionId: string) {
        return items.findIndex((item: VersionHistoryItem) => item.getSecondaryId() === versionId);
    }

    private getPreviousVersionItem(items: VersionHistoryItem[]): VersionHistoryItem {
        const versionIndex: number = this.getVersionIndexInOptions(items, this.rightVersionId);

        if (versionIndex === -1 || versionIndex === items.length - 1) {
            return null;
        }

        return items[versionIndex + 1];
    }

    private getNextVersion(items: VersionHistoryItem[]): VersionHistoryItem {
        const versionIndex = this.getVersionIndexInOptions(items, this.leftVersionId);

        if (versionIndex <= 0) {
            return null;
        }

        return items[versionIndex - 1];
    }

    private createLeftAliases(items: VersionHistoryItem[], maxDateTime: number): VersionHistoryItem[] {
        const aliases: VersionHistoryItem[] = [];

        const newestPublishedVersion: VersionHistoryItem =
            this.getNewestPublishedVersion(items, maxDateTime);

        if (newestPublishedVersion) {
            aliases.push(
                this.createAliasVersionHistoryItem(newestPublishedVersion, i18n('dialog.compareVersions.publishedVersion'),
                    AliasType.PUBLISHED)
            );
        }

        const prevVersion: VersionHistoryItem = this.getPreviousVersionItem(items);
        if (prevVersion) {
            aliases.push(this.createAliasVersionHistoryItem(prevVersion, i18n('dialog.compareVersions.previousVersion'), AliasType.PREV));
        }

        return aliases;
    }

    private createRightAliases(items: VersionHistoryItem[]): VersionHistoryItem[] {
        const aliases: VersionHistoryItem[] = [];

        const newestPublishedVersion: VersionHistoryItem =
            this.getNewestPublishedVersion(items, Date.now());

        if (newestPublishedVersion) {
            aliases.push(
                this.createAliasVersionHistoryItem(newestPublishedVersion, i18n('dialog.compareVersions.publishedVersion'),
                    AliasType.PUBLISHED)
            );
        }

        const nextVersion: VersionHistoryItem = this.getNextVersion(items);

        if (nextVersion) {
            aliases.push(this.createAliasVersionHistoryItem(nextVersion, i18n('dialog.compareVersions.nextVersion'), AliasType.NEXT));
        }

        const newestVersion: VersionHistoryItem = this.getNewestVersion(items);

        if (newestVersion) {
            aliases.push(this.createAliasVersionHistoryItem(newestVersion, i18n('dialog.compareVersions.newestVersion'), AliasType.NEWEST));
        }

        return aliases;
    }

    private createAliasVersionHistoryItem(version: VersionHistoryItem, alias: string, type: AliasType): VersionHistoryItem {
        return version.createAlias(alias, type, this.createAliasId(version));
    }

    private createOption(version: VersionHistoryItem): Option<VersionHistoryItem> {
        return Option.create<VersionHistoryItem>()
            .setValue(version.getSecondaryId())
            .setDisplayValue(version)
            .build();
    }

    private itemsSorter(a: VersionHistoryItem, b: VersionHistoryItem): number {
        function isFirstValid(a: boolean, b: boolean) {
            return a && !b ? true : false;
        }

        function isSecondValid(a: boolean, b: boolean) {
            return !a && b ? true : false;
        }

        function areBothValid(a: boolean, b: boolean) {
            return a && b ? true : false;
        }

        const aAlias: boolean = a.isAlias();
        const bAlias: boolean = b.isAlias();

        if (isSecondValid(aAlias, bAlias)) {
            return 1;
        }

        if (isFirstValid(aAlias, bAlias)) {
            return -1;
        }

        if (areBothValid(aAlias, bAlias)) {
            // Bubble AliasType.Newest to the top
            return a.getAliasType() - b.getAliasType();
        }

        return b.getContentVersion().getTimestamp().getTime() - a.getContentVersion().getTimestamp().getTime();
    }

    private leftVersionRequiresForcedSelection() {
        const leftTime: Date = this.leftDropdown.getSelectedItems()[0].getContentVersion().getTimestamp();
        const rightTime: Date = this.rightDropdown.getSelectedItems()[0].getContentVersion().getTimestamp();

        return leftTime.getTime() > rightTime.getTime();
    }

    private forceSelectVersion(dropdown: CompareDropdown, versionId: string, silent?: boolean) {
        const newOption: VersionHistoryItem = dropdown.getList().getItem(versionId);
        const selectedValue: VersionHistoryItem = dropdown.getSelectedItems()[0];

        if (!!newOption && versionId !== selectedValue?.getSecondaryId()) {
            dropdown.select(newOption, silent);
        }
    }

    private disableLeftVersions(): void {
        let markReadOnly = false;

        const rightOption = this.rightDropdown.getSelectedItems()[0];
        const isNextSelectedInRightDropdown = !!rightOption ? rightOption.getAliasType() === AliasType.NEXT : null;

        this.leftDropdown.getList().getItems().slice().reverse().forEach((option: VersionHistoryItem) => {
            // slice first to create new array and prevent modification of original options
            // doing reverse to be sure to go through regular versions before aliases
            // and make everything in one go

            const view = this.leftDropdown.getList().getItemView(option);
            const isReadonly = option.isAlias()
                               ? isNextSelectedInRightDropdown && option.getAliasType() === AliasType.PREV
                               : markReadOnly || option.isReadonly();

            if (isReadonly) {
                view.getParentElement().addClass('readonly');
            } else {
                view.getParentElement().removeClass('readonly');
            }


            if (option.getSecondaryId() === this.rightVersionId) {
                // marking readOnly all versions after rightVersion
                markReadOnly = true;
            }
        });
    }

    private disableRightVersions(): void {
        const leftOption = this.leftDropdown.getSelectedItems()[0];
        const isPrevSelectedInLeftDropdown = !!leftOption ? leftOption.getAliasType() === AliasType.PREV : null;

        this.rightDropdown.getList().getItems().filter(option => option.isAlias() || option.isReadonly()).forEach(option => {
            const view = this.rightDropdown.getList().getItemView(option);
            view.getParentElement().toggleClass('readonly',
                option.isReadonly() || (isPrevSelectedInLeftDropdown && option.getAliasType() === AliasType.NEXT));
        });
    }

    private fetchVersionPromise(versionId: string): Q.Promise<object> {
        const cache = this.contentCache[versionId];

        if (cache) {
            return Q(cache);
        }

        return new GetContentVersionRequest(this.content.getContentId())
            .setVersion(versionId)
            .sendRequest().then(content => {
                const processedContent = this.processContent(content, versionId);
                this.contentCache[versionId] = processedContent;
                return processedContent;
            });
    }

    private displayDiff(): Q.Promise<void> {
        const leftVersionId: string = this.extractId(this.leftVersionId);
        const rightVersionId: string = this.extractId(this.rightVersionId);

        const promises = [
            this.fetchVersionPromise(leftVersionId)
        ];

        if (leftVersionId !== rightVersionId) {
            promises.push(this.fetchVersionPromise(rightVersionId));
        }
        this.comparisonContainer.addClass('loading');

        return Q.all(promises).spread((leftJson: object, rightJson: object) => {
            const delta: Delta = this.diffPatcher.diff(leftJson, rightJson || leftJson);
            let text;
            let isEmpty = false;
            if (delta) {
                text = formatters.html.format(delta, rightJson || leftJson);
            } else {
                isEmpty = true;
                text = `<h3>${i18n('dialog.compareVersions.versionsIdentical')}</h3>`;
            }
            this.comparisonContainer.removeClass('loading');
            this.comparisonContainer.setHtml(text, false).toggleClass('empty', isEmpty);
        });
    }

    private extractId(versionId: string): string {
        return versionId.split(':')[0];
    }

    private updateButtonsState() {
        const leftVersion: VersionHistoryItem = this.leftDropdown.getSelectedItems()[0];
        const rightVersion: VersionHistoryItem = this.rightDropdown.getSelectedItems()[0];

        this.revertLeftButton.setEnabled(this.isVersionRevertable(leftVersion));
        this.revertRightButton.setEnabled(this.isVersionRevertable(rightVersion));
    }

    private isVersionRevertable(version: VersionHistoryItem): boolean {
        return !this.readOnly && !this.isVersionActive(version) && VersionHistoryHelper.isRevertableItem(version);
    }

    private isVersionActive(version: VersionHistoryItem): boolean {
        return VersionContext.isActiveVersion(this.content.getId(), version.getId());
    }

    private processContent(contentJson: ContentJson, versionId: string): ContentJson {
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

    private createAliasId(version: VersionHistoryItem): string {
        const versionId: string = version.getId();
        let counter: number = this.versionIdCounters[versionId] || 0;
        const aliasId: string = `${versionId}:alias|${++counter}`;
        this.versionIdCounters[versionId] = counter;

        return aliasId;
    }
}

class CompareContentVersionsDialogHeader
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

class CompareDropdown
    extends FilterableListBoxWrapper<VersionHistoryItem> {

    private selectedItemViewer: ContentVersionViewer;

    constructor() {
        super(new CompareList(), {
                className: 'compare-dropdown',
                maxSelected: 1,
            }
        );
    }

    protected initElements(): void {
        super.initElements();

        this.selectedItemViewer = new ContentVersionViewer();
    }

    createSelectedOption(item: VersionHistoryItem): Option<VersionHistoryItem> {
        return Option.create<VersionHistoryItem>()
            .setValue(item.getSecondaryId())
            .setDisplayValue(item)
            .build();
    }

    protected initListeners(): void {
        super.initListeners();

        this.onSelectionChanged(() => {
            this.selectedItemViewer.setObject(this.getSelectedItems()[0]);
        });

        this.selectedItemViewer.onClicked(() => {
           this.handleDropdownHandleClicked();
        });
    }

    hideDropdown(): void {
        super.hideDropdown();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.filterContainer.appendChild(this.selectedItemViewer);

            return rendered;
        });
    }

    protected handleUserToggleAction(item: VersionHistoryItem): void {
        if (item.getSecondaryId() === this.selectedItemViewer.getObject().getSecondaryId()) {
            return;
        }

        super.handleUserToggleAction(item);
    }

}

class CompareList
    extends ListBox<VersionHistoryItem> {

    protected createItemView(item: VersionHistoryItem, readOnly: boolean): ContentVersionViewer {
        const viewer = new ContentVersionViewer();
        viewer.setObject(item);
        return viewer;
    }

    protected getItemId(item: VersionHistoryItem): string {
        return item?.getSecondaryId();
    }


}
