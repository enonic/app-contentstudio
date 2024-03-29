import * as Q from 'q';
import {GetContentVersionRequest} from '../resource/GetContentVersionRequest';
import {Delta, DiffPatcher, formatters, HtmlFormatter} from 'jsondiffpatch';
import {DefaultModalDialogHeader, ModalDialog, ModalDialogConfig, ModalDialogHeader} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {OptionSelectedEvent} from '@enonic/lib-admin-ui/ui/selector/OptionSelectedEvent';
import {CheckboxBuilder} from '@enonic/lib-admin-ui/ui/Checkbox';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {LabelEl} from '@enonic/lib-admin-ui/dom/LabelEl';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {Dropdown} from '@enonic/lib-admin-ui/ui/selector/dropdown/Dropdown';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {Menu} from '@enonic/lib-admin-ui/ui/menu/Menu';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {ContentVersionViewer} from '../view/context/widget/version/ContentVersionViewer';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';
import {ContentServerChangeItem} from '../event/ContentServerChangeItem';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {AliasType, VersionHistoryItem} from '../view/context/widget/version/VersionHistoryItem';
import {ContentVersionsLoader} from '../view/context/widget/version/ContentVersionsLoader';
import {ContentVersions} from '../ContentVersions';
import {ContentVersionsConverter} from '../view/context/widget/version/ContentVersionsConverter';
import {VersionContext} from '../view/context/widget/version/VersionContext';
import {VersionHistoryHelper} from '../view/context/widget/version/VersionHistoryHelper';
import {ContentVersion} from '../ContentVersion';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ContentJson} from '../content/ContentJson';

export class CompareContentVersionsDialog
    extends ModalDialog {

    private static INSTANCE: CompareContentVersionsDialog;

    private leftVersionId: string;

    private rightVersionId: string;

    private versions: ContentVersions;

    private content: ContentSummaryAndCompareStatus;

    private toolbar: DivEl;

    private leftDropdown: Dropdown<VersionHistoryItem>;

    private rightDropdown: Dropdown<VersionHistoryItem>;

    private leftLabel: LabelEl;

    private rightLabel: LabelEl;

    private comparisonContainer: DivEl;

    private revertLeftButton: Button;

    private revertRightButton: Button;

    private contentCache: Record<string, Object>;

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

    private createVersionDropdown(stylePrefix: string, versionId: string): Dropdown<VersionHistoryItem> {
        const dropdown = new Dropdown(`${stylePrefix}-version`, {
            optionDisplayValueViewer: new ContentVersionViewer(),
            rowHeight: 50,
            disableFilter: true,
            dataIdProperty: 'value',
            value: versionId
        });

        dropdown.onOptionSelected((event: OptionSelectedEvent<VersionHistoryItem>) => {
            if (!this.isRendered()) {
                return;
            }

            this.handleVersionChanged(dropdown === this.leftDropdown);
        });

        this.onClosed(() => dropdown.hideDropdown());

        return dropdown;
    }

    private getSelectedVersionId(isLeft: boolean): string {
        return (isLeft ? this.leftDropdown : this.rightDropdown).getSelectedOption().getValue();
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

    private createVersionRevertButton(dropdown: Dropdown<VersionHistoryItem>): Button {
        const revertAction: Action = new Action(i18n('field.version.revert')).onExecuted(() => {
            const version: VersionHistoryItem = dropdown.getSelectedOption().getDisplayValue();
            this.revertVersionCallback(version.getId(), version.getContentVersion().getTimestamp());
        });
        revertAction.setTitle(i18n('field.version.makeCurrent'));

        const menu = new Menu([revertAction]);
        menu.onItemClicked(() => {
            this.setMenuVisible(false, menu, button);
        });

        const button = new Button();
        button.addClass('context-menu transparent icon-more_vert icon-large');
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

            this.leftDropdown = this.createVersionDropdown('left', this.leftVersionId);
            this.leftDropdown.onExpanded(() => this.disableLeftVersions());
            this.revertLeftButton = this.createVersionRevertButton(this.leftDropdown);

            this.leftLabel = new LabelEl(i18n('dialog.compareVersions.olderVersion'));
            const leftContainer = new DivEl('container left');
            leftContainer.appendChildren<Element>(this.leftLabel, this.leftDropdown, this.revertLeftButton);

            this.rightLabel = new LabelEl(i18n('dialog.compareVersions.newerVersion'));
            this.rightDropdown = this.createVersionDropdown('right', this.rightVersionId);
            this.rightDropdown.onExpanded(() => this.disableRightVersions());
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

        return this.versionsLoader.load(this.content).then((versions: ContentVersions) => {
            this.resetVersions(versions);

            const items: VersionHistoryItem[] = this.convertVersionsToHistoryItems();
            const options: Option<VersionHistoryItem>[] = items.map((item: VersionHistoryItem) => this.createOption(item));

            this.updateLeftDropdown(options);
            this.updateRightDropdown(options);

            this.updateButtonsState();
            this.displayDiff();
        });
    }

    private resetVersions(versions: ContentVersions): void {
        this.versions = versions;
        VersionContext.setActiveVersion(this.content.getId(), versions.getActiveVersionId());
        this.versionIdCounters = {};
    }

    private updateLeftDropdown(options: Option<VersionHistoryItem>[]): void {
        this.leftDropdown?.removeAllOptions();
        const newestVersionOption: Option<VersionHistoryItem> = this.getNewestVersionOption(options);
        const leftAliases: Option<VersionHistoryItem>[] =
            this.createLeftAliases(options, newestVersionOption.getDisplayValue().getContentVersion().getTimestamp().getTime());
        this.leftDropdown.setOptions(leftAliases.concat(options).sort(this.optionSorter.bind(this)));

        if (!this.leftVersionId) {
            const prev: Option<VersionHistoryItem> =
                leftAliases.find((opt: Option<VersionHistoryItem>) => opt.getDisplayValue().getAliasType() === AliasType.PREV);
            this.leftVersionId = prev.getValue() || newestVersionOption.getValue();
        }

        const leftOptionToSelect: Option<VersionHistoryItem> = this.getNewOptionToSelect(this.leftDropdown, this.leftVersionId);

        if (leftOptionToSelect) {
            this.leftDropdown.selectOption(leftOptionToSelect, true);
        }
    }

    private updateRightDropdown(options: Option<VersionHistoryItem>[]): void {
        this.rightDropdown?.removeAllOptions();
        const rightAliases: Option<VersionHistoryItem>[] = this.createRightAliases(options);
        this.rightDropdown.setOptions(rightAliases.concat(options).sort(this.optionSorter.bind(this)));

        const rightOptionToSelect: Option<VersionHistoryItem> =
            this.getNewOptionToSelect(this.rightDropdown, this.rightVersionId);

        if (rightOptionToSelect) {
            this.rightDropdown.selectOption(rightOptionToSelect, true);
        }
    }

    private convertVersionsToHistoryItems(): VersionHistoryItem[] {
        return ContentVersionsConverter.create()
            .setContent(this.content)
            .setContentVersions(this.versions)
            .build()
            .toVersionHistoryItems();
    }

    private getNewOptionToSelect(dropdown: Dropdown<VersionHistoryItem>, versionId: string): Option<VersionHistoryItem> {
        const newOptionToSelect: Option<VersionHistoryItem> = dropdown.getOptionByValue(versionId);
        const currentSelectedValue: string = dropdown.getValue();
        return (!!newOptionToSelect && versionId !== currentSelectedValue) ? newOptionToSelect : null;
    }

    private updateAliases(isLeft: boolean): boolean {
        const dropdown: Dropdown<VersionHistoryItem> = isLeft ? this.leftDropdown : this.rightDropdown;
        let selectedAliasType: AliasType;
        const selectedOption: Option<VersionHistoryItem> = dropdown.getSelectedOption();
        if (selectedOption) {
            selectedAliasType = selectedOption.getDisplayValue().getAliasType();
        }

        let nextOption: Option<VersionHistoryItem> = dropdown.getOptionByRow(0);
        while (nextOption.getDisplayValue().isAlias()) {
            dropdown.removeOption(nextOption);
            nextOption = dropdown.getOptionByRow(0);
        }

        let aliasFound: boolean;
        const aliases: Option<VersionHistoryItem>[] = isLeft ? this.createLeftAliases(dropdown.getOptions(),
            selectedOption.getDisplayValue().getContentVersion().getTimestamp().getTime()) : this.createRightAliases(dropdown.getOptions());

        aliases.forEach((alias: Option<VersionHistoryItem>) => {
            dropdown.addOption(alias);
            if (alias.getDisplayValue().getAliasType() === selectedAliasType) {
                aliasFound = true;
                dropdown.selectOption(alias, true);
                // update version with new alias id
                if (isLeft) {
                    this.leftVersionId = alias.getValue();
                } else {
                    this.rightVersionId = alias.getValue();
                }
            }
        });
        // sort first to ensure correct order
        dropdown.sort(this.optionSorter.bind(this));

        if (selectedAliasType && !aliasFound) {
            // set same value as in the other dropdown
            this.forceSelectVersion(dropdown, isLeft ? this.rightVersionId : this.leftVersionId);
            return false;
        }

        return true;
    }

    private getNewestVersionOption(opts: Option<VersionHistoryItem>[]): Option<VersionHistoryItem> {
        let newest = opts.find(opt => opt.getDisplayValue().getAliasType() === AliasType.NEWEST);
        if (!newest) {
            opts.forEach(opt => {
                if (!newest || opt.getDisplayValue().getContentVersion().getTimestamp() >
                    newest.getDisplayValue().getContentVersion().getTimestamp()) {
                    newest = opt;
                }
            });
        }

        return newest;
    }

    private getNewestPublishedVersion(options: Option<VersionHistoryItem>[], maxDateTime: number): VersionHistoryItem {
        return options
            .map(option => option.getDisplayValue())
            .filter((version: VersionHistoryItem) => version.getContentVersion().isPublished() &&
                                                     (!maxDateTime || version.getContentVersion().getTimestamp().getTime() <= maxDateTime))
            .sort((v1, v2) => v2.getContentVersion().getPublishInfo().getTimestamp().getTime() -
                              v1.getContentVersion().getPublishInfo().getTimestamp().getTime())[0];
    }

    private getNewestVersion(options: Option<VersionHistoryItem>[]): VersionHistoryItem {
        return options
            .map(option => option.getDisplayValue())
            .sort((v1, v2) => v2.getContentVersion().getTimestamp().getTime() - v1.getContentVersion().getTimestamp().getTime())[0];
    }

    private getVersionIndexInOptions(options: Option<VersionHistoryItem>[], versionId: string) {
        return options.findIndex((option: Option<VersionHistoryItem>) => option.getValue() === versionId);
    }

    private getPreviousVersionItem(options: Option<VersionHistoryItem>[]): VersionHistoryItem {
        const versionIndex: number = this.getVersionIndexInOptions(options, this.rightVersionId);

        if (versionIndex === -1 || versionIndex === options.length - 1) {
            return null;
        }

        return options[versionIndex + 1].getDisplayValue();
    }

    private getNextVersion(options: Option<VersionHistoryItem>[]): VersionHistoryItem {
        const versionIndex = this.getVersionIndexInOptions(options, this.leftVersionId);

        if (versionIndex <= 0) {
            return null;
        }

        return options[versionIndex - 1].getDisplayValue();
    }

    private createLeftAliases(options: Option<VersionHistoryItem>[], maxDateTime: number): Option<VersionHistoryItem>[] {
        const aliases: Option<VersionHistoryItem>[] = [];

        const newestPublishedVersion: VersionHistoryItem =
            this.getNewestPublishedVersion(options, maxDateTime);

        if (newestPublishedVersion) {
            aliases.push(
                this.createAliasOption(newestPublishedVersion, i18n('dialog.compareVersions.publishedVersion'), AliasType.PUBLISHED)
            );
        }

        const prevVersion: VersionHistoryItem = this.getPreviousVersionItem(options);
        if (prevVersion) {
            aliases.push(this.createAliasOption(prevVersion, i18n('dialog.compareVersions.previousVersion'), AliasType.PREV));
        }

        return aliases;
    }

    private createRightAliases(options: Option<VersionHistoryItem>[]): Option<VersionHistoryItem>[] {
        const aliases: Option<VersionHistoryItem>[] = [];

        const newestPublishedVersion: VersionHistoryItem =
            this.getNewestPublishedVersion(options, Date.now());

        if (newestPublishedVersion) {
            aliases.push(
                this.createAliasOption(newestPublishedVersion, i18n('dialog.compareVersions.publishedVersion'), AliasType.PUBLISHED)
            );
        }

        const nextVersion: VersionHistoryItem = this.getNextVersion(options);

        if (nextVersion) {
            aliases.push(this.createAliasOption(nextVersion, i18n('dialog.compareVersions.nextVersion'), AliasType.NEXT));
        }

        const newestVersion: VersionHistoryItem = this.getNewestVersion(options);

        if (newestVersion) {
            aliases.push(this.createAliasOption(newestVersion, i18n('dialog.compareVersions.newestVersion'), AliasType.NEWEST));
        }

        return aliases;
    }

    private createAliasOption(version: VersionHistoryItem, alias: string, type: AliasType): Option<VersionHistoryItem> {
        const versionId: string = version.getId();
        let counter: number = this.versionIdCounters[versionId] || 0;
        const aliasId: string = `${versionId}:alias|${++counter}`;
        this.versionIdCounters[versionId] = counter;

        const aliasVersionItem: VersionHistoryItem = version.createAlias(alias, type);

        return this.doCreateOption(aliasId, aliasVersionItem);
    }

    private createOption(version: VersionHistoryItem): Option<VersionHistoryItem> {
        return this.doCreateOption(`${version.getId()}:${version.getStatus()}`, version);
    }

    private doCreateOption(value: string, version: VersionHistoryItem): Option<VersionHistoryItem> {
        return Option.create<VersionHistoryItem>()
            .setValue(value)
            .setDisplayValue(version)
            .build();
    }

    private optionSorter(a: Option<VersionHistoryItem>, b: Option<VersionHistoryItem>): number {
        function isFirstValid(a: boolean, b: boolean) {
            return a && !b ? true : false;
        }

        function isSecondValid(a: boolean, b: boolean) {
            return !a && b ? true : false;
        }

        function areBothValid(a: boolean, b: boolean) {
            return a && b ? true : false;
        }

        const aVal: VersionHistoryItem = a.getDisplayValue();
        const bVal: VersionHistoryItem = b.getDisplayValue();
        const aAlias: boolean = aVal.isAlias();
        const bAlias: boolean = bVal.isAlias();

        if (isSecondValid(aAlias, bAlias)) {
            return 1;
        }

        if (isFirstValid(aAlias, bAlias)) {
            return -1;
        }

        if (areBothValid(aAlias, bAlias)) {
            // Bubble AliasType.Newest to the top
            return aVal.getAliasType() - bVal.getAliasType();
        }

        return bVal.getContentVersion().getTimestamp().getTime() - aVal.getContentVersion().getTimestamp().getTime();
    }

    private leftVersionRequiresForcedSelection() {
        const leftTime: Date = this.leftDropdown.getSelectedOption().getDisplayValue().getContentVersion().getTimestamp();
        const rightTime: Date = this.rightDropdown.getSelectedOption().getDisplayValue().getContentVersion().getTimestamp();

        return leftTime.getTime() > rightTime.getTime();
    }

    private forceSelectVersion(dropdown: Dropdown<VersionHistoryItem>, versionId: string, silent?: boolean) {
        const newOption: Option<VersionHistoryItem> = dropdown.getOptionByValue(versionId);
        const selectedValue: string = dropdown.getValue();

        if (!!newOption && versionId !== selectedValue) {
            dropdown.selectOption(newOption, silent);
        }
    }

    private disableLeftVersions() {
        const readOnlyOptions: Option<VersionHistoryItem>[] = [];
        let markReadOnly = false;

        const rightOption = this.rightDropdown.getSelectedOption();
        let isNextSelectedInRightDropdown;
        if (rightOption) {
            isNextSelectedInRightDropdown = rightOption.getDisplayValue().getAliasType() === AliasType.NEXT;
        }

        this.leftDropdown.getOptions().slice().reverse().forEach((option: Option<VersionHistoryItem>) => {
            // slice first to create new array and prevent modification of original options
            // doing reverse to be sure to go through regular versions before aliases
            // and make everything in one go

            if (option.getDisplayValue().isAlias()) {
                if (isNextSelectedInRightDropdown && option.getDisplayValue().getAliasType() === AliasType.PREV) {
                    option.setReadOnly(true);
                    readOnlyOptions.push(option);
                } else {
                    // don't disable aliases
                    return;
                }
            } else {
                option.setReadOnly(markReadOnly);
                if (markReadOnly) {
                    readOnlyOptions.push(option);
                }
            }

            if (option.getValue() === this.rightVersionId) {
                // marking readOnly all versions after rightVersion
                markReadOnly = true;
            }

        });

        if (readOnlyOptions.length) {
            this.leftDropdown.markReadOnly(readOnlyOptions);
        }
    }

    private disableRightVersions() {
        const readOnlyOptions = [];
        const leftOption = this.leftDropdown.getSelectedOption();
        let isPrevSelectedInLeftDropdown;
        if (leftOption) {
            isPrevSelectedInLeftDropdown = leftOption.getDisplayValue().getAliasType() === AliasType.PREV;
        }

        this.rightDropdown.getOptions().filter(option => option.getDisplayValue().isAlias()).forEach(option => {
            if (isPrevSelectedInLeftDropdown && option.getDisplayValue().getAliasType() === AliasType.NEXT) {
                option.setReadOnly(true);
                readOnlyOptions.push(option);
            } else {
                // dont' disable aliases
                return;
            }
        });

        if (readOnlyOptions.length) {
            this.rightDropdown.markReadOnly(readOnlyOptions);
        }
    }

    private fetchVersionPromise(versionId: string): Q.Promise<Object> {
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

        return Q.all(promises).spread((leftJson: Object, rightJson: Object) => {
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
        const leftVersion: VersionHistoryItem = this.leftDropdown.getSelectedOption().getDisplayValue();
        const rightVersion: VersionHistoryItem = this.rightDropdown.getSelectedOption().getDisplayValue();

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

        const version: ContentVersion = this.versions.getVersionById(versionId);

        if (ObjectHelper.isDefined(version?.getPermissions())) {
            contentJson['permissions'] = version.getPermissions().toJson();
        }

        if (ObjectHelper.isDefined(version?.isInheritPermissions())) {
            contentJson['inheritPermissions'] = version.isInheritPermissions();
        }

        return contentJson;
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
