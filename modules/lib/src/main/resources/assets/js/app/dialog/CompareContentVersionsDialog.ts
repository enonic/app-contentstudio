import * as Q from 'q';
import {AliasType, ContentVersion} from '../ContentVersion';
import {GetContentVersionRequest} from '../resource/GetContentVersionRequest';
import {Delta, DiffPatcher, formatters} from 'jsondiffpatch';
import {GetContentVersionsRequest} from '../resource/GetContentVersionsRequest';
import {ContentVersions} from '../ContentVersions';
import {DefaultModalDialogHeader, ModalDialog, ModalDialogConfig, ModalDialogHeader} from 'lib-admin-ui/ui/dialog/ModalDialog';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {OptionSelectedEvent} from 'lib-admin-ui/ui/selector/OptionSelectedEvent';
import {CheckboxBuilder} from 'lib-admin-ui/ui/Checkbox';
import {Element} from 'lib-admin-ui/dom/Element';
import {LabelEl} from 'lib-admin-ui/dom/LabelEl';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {Dropdown} from 'lib-admin-ui/ui/selector/dropdown/Dropdown';
import {Button} from 'lib-admin-ui/ui/button/Button';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {H6El} from 'lib-admin-ui/dom/H6El';
import {Menu} from 'lib-admin-ui/ui/menu/Menu';
import {Action} from 'lib-admin-ui/ui/Action';
import {Body} from 'lib-admin-ui/dom/Body';
import {ContentVersionViewer} from '../view/context/widget/version/ContentVersionViewer';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';
import {ContentServerChangeItem} from '../event/ContentServerChangeItem';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ActiveContentVersionSetEvent} from '../event/ActiveContentVersionSetEvent';

export class CompareContentVersionsDialog
    extends ModalDialog {

    private static INSTANCE: CompareContentVersionsDialog;

    private leftVersionId: string;

    private rightVersionId: string;

    private contentId: ContentId;

    private toolbar: DivEl;

    private leftDropdown: Dropdown<ContentVersion>;

    private rightDropdown: Dropdown<ContentVersion>;

    private leftLabel: LabelEl;

    private rightLabel: LabelEl;

    private comparisonContainer: DivEl;

    private revertLeftButton: Button;

    private revertRightButton: Button;

    private contentCache: { [key: string]: Object };

    private diffPatcher: DiffPatcher;

    private htmlFormatter: any;

    private outsideClickListener: (event: MouseEvent) => void;

    private versionIdCounters: { [id: string]: number };

    private revertVersionCallback: (versionId: string, versionDate: Date, activeVersionId?: string) => void;

    private activeVersionId: string;

    private readOnly: boolean;

    protected constructor() {
        super(<ModalDialogConfig>{
            class: 'compare-content-versions-dialog grey-header',
            title: i18n('dialog.compareVersions.comparingVersions'),
            alwaysFullscreen: true
        });

        this.diffPatcher = new DiffPatcher();
    }

    protected initListeners() {
        super.initListeners();

        const serverEventsHandler: ContentServerEventsHandler = ContentServerEventsHandler.getInstance();

        const deletedHandler = (deletedItems: ContentServerChangeItem[]) => {
            if (deletedItems.some((item: ContentServerChangeItem) => this.contentId.equals(item.getContentId()))) {
                this.close();
            }
        };

        const updatedHandler = (updatedItems: ContentSummaryAndCompareStatus[]) => {
            const currentItem: ContentSummaryAndCompareStatus =
                updatedItems.find((item: ContentSummaryAndCompareStatus) => item.getContentId().equals(this.contentId));

            if (currentItem) {
                (<CompareContentVersionsDialogHeader>this.header).setSubTitle(currentItem.getPath().toString());
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

        ActiveContentVersionSetEvent.on((event: ActiveContentVersionSetEvent) => {
            this.activeVersionId = event.getVersionId();
            this.rightVersionId = null;
            this.reloadVersions();
        });
    }

    private createVersionDropdown(stylePrefix: string, versionId: string): Dropdown<ContentVersion> {

        const dropdown = new Dropdown(`${stylePrefix}-version`, {
            optionDisplayValueViewer: new ContentVersionViewer(),
            disableFilter: true,
            dataIdProperty: 'value',
            value: versionId
        });

        dropdown.onOptionSelected((event: OptionSelectedEvent<ContentVersion>) => {
            if (!this.isRendered()) {
                return;
            }

            this.handleVersionChanged(dropdown === this.leftDropdown);
        });
        return dropdown;
    }

    private getSelectedVersionId(isLeft: boolean) {
        return (isLeft ? this.leftDropdown : this.rightDropdown).getSelectedOption().getDisplayValue().getId();
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

    createVersionRevertButton(dropdown: Dropdown<ContentVersion>): Button {
        const revertAction: Action = new Action(i18n('field.version.revert')).onExecuted(() => {
            const version: ContentVersion = dropdown.getSelectedOption().getDisplayValue();
            this.revertVersionCallback(version.getId(), version.getModified(), this.activeVersionId);
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

        return button;
    }

    private bindOutsideClickListener(enableEdit: boolean, menu: Menu, button: Button) {
        const body = Body.get();
        if (!this.outsideClickListener) {
            this.outsideClickListener = (event: MouseEvent) => {
                if (!button.getEl().contains(<HTMLElement>event.target)) {
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
        if (menu.isVisible() !== flag) {
            menu.setVisible(flag);
        }
        button.toggleClass('expanded', flag);
        this.bindOutsideClickListener(flag, menu, button);
    }

    protected createHeader(title: string): CompareContentVersionsDialogHeader {
        return new CompareContentVersionsDialogHeader(title);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then(rendered => {
            this.toolbar = new DivEl('toolbar-container');

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
            this.htmlFormatter = (<any>formatters.html);
            this.htmlFormatter.showUnchanged(false, null, 0);
            const changesCheckbox = new CheckboxBuilder().setLabelText(i18n('dialog.compareVersions.showUnchanged')).build();
            changesCheckbox.onValueChanged(event => {
                this.htmlFormatter.showUnchanged(event.getNewValue() === 'true', null, 0);
            });
            bottomContainer.appendChild(changesCheckbox);
            this.appendChildToFooter(bottomContainer);

            return this.reloadVersions().then(() => {

                this.toolbar.appendChildren<any>(leftContainer, rightContainer);

                this.comparisonContainer = new DivEl('jsondiffpatch-delta');

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

    setLeftVersion(versionId: string): CompareContentVersionsDialog {
        this.leftVersionId = versionId;
        return this;
    }

    resetRightVersion(): CompareContentVersionsDialog {
        this.rightVersionId = null;
        return this;
    }

    setContent(content: ContentSummary): CompareContentVersionsDialog {
        this.contentId = content ? content.getContentId() : null;
        (<CompareContentVersionsDialogHeader>this.header).setSubTitle(content ? content.getPath().toString() : null);
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
        if (!this.contentId) {
            return;
        }
        return new GetContentVersionsRequest(this.contentId).setSize(-1).sendAndParse()
            .then((contentVersions: ContentVersions) => {

                this.versionIdCounters = {};

                if (this.leftDropdown) {
                    this.leftDropdown.removeAllOptions();
                }
                if (this.rightDropdown) {
                    this.rightDropdown.removeAllOptions();
                }

                const options: Option<ContentVersion>[] = [];
                const versions = contentVersions.getContentVersions().sort((v1: ContentVersion, v2: ContentVersion) => {
                    return v2.getModified().getTime() - v1.getModified().getTime();
                });
                for (let i = 0; i < versions.length; i++) {
                    const version = versions[i];
                    if (version.isActive()) {
                        this.activeVersionId = version.getId();
                    }
                    const option = this.createOption(version);
                    options.push(option);
                }

                // init latest versions by default if nothing is set
                const newestVersionOption = this.getNewestVersionOption(options);
                if (!this.leftVersionId) {
                    this.leftVersionId = newestVersionOption.getDisplayValue().getId();
                }
                if (!this.rightVersionId) {
                    this.rightVersionId = newestVersionOption.getDisplayValue().getId();
                }

                const leftAliases = this.createAliases(options, newestVersionOption.getDisplayValue().getModified().getTime());
                const rightAliases = this.createAliases(options);

                this.leftDropdown.setOptions(leftAliases.concat(options).sort(this.optionSorter.bind(this)));
                this.rightDropdown.setOptions(rightAliases.concat(options).sort(this.optionSorter.bind(this)));

                this.forceSelectVersion(this.leftDropdown, this.leftVersionId, true);

                // now after aliases are added we can select newest alias for the right dropdown
                const latestAlias = this.getNewestVersionOption(this.rightDropdown.getOptions());
                this.forceSelectVersion(this.rightDropdown, latestAlias.getValue(), false);
            });
    }

    private updateAliases(isLeft: boolean): boolean {
        const dropdown = isLeft ? this.leftDropdown : this.rightDropdown;
        let selectedAliasType: AliasType;
        const selectedOption = dropdown.getSelectedOption();
        if (selectedOption) {
            selectedAliasType = selectedOption.getDisplayValue().getAliasType();
        }

        let nextOption: Option<ContentVersion> = dropdown.getOptionByRow(0);
        while (nextOption.getDisplayValue().isAlias()) {
            dropdown.removeOption(nextOption);
            nextOption = dropdown.getOptionByRow(0);
        }

        let aliasFound;
        this.createAliases(dropdown.getOptions(),
            isLeft ? selectedOption.getDisplayValue().getModified().getTime() : null).forEach(alias => {
            dropdown.addOption(alias);
            if (alias.getDisplayValue().getAliasType() === selectedAliasType) {
                aliasFound = true;
                dropdown.selectOption(alias, true);
                // update version with new alias id
                if (isLeft) {
                    this.leftVersionId = alias.getDisplayValue().getId();
                } else {
                    this.rightVersionId = alias.getDisplayValue().getId();
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

    private getNewestVersionOption(opts: Option<ContentVersion>[]): Option<ContentVersion> {
        let newest = opts.find(opt => opt.getDisplayValue().getAliasType() === AliasType.NEWEST);
        if (!newest) {
            opts.forEach(opt => {
                if (!newest || opt.getDisplayValue().getModified() > newest.getDisplayValue().getModified()) {
                    newest = opt;
                }
            });
        }

        return newest;
    }

    private getNewestPublishedVersion(options: Option<ContentVersion>[], maxDateTime: number): ContentVersion {
        return options
            .map(option => option.getDisplayValue())
            .filter((version: ContentVersion) => version.isPublished() && (!maxDateTime || version.getModified().getTime() <= maxDateTime))
            .sort((v1, v2) => v2.getPublishInfo().getTimestamp().getTime() - v1.getPublishInfo().getTimestamp().getTime())[0];

    }

    private getNewestVersion(options: Option<ContentVersion>[]): ContentVersion {
        return options
            .map(option => option.getDisplayValue())
            .sort((v1, v2) => v2.getModified().getTime() - v1.getModified().getTime())[0];
    }

    private getVersionIndexInOptions(options: Option<ContentVersion>[], versionId: string) {
        return options.findIndex((option: Option<ContentVersion>) => option.getDisplayValue().getId() === versionId);
    }

    private getPreviousVersion(options: Option<ContentVersion>[]): ContentVersion {
        const versionIndex = this.getVersionIndexInOptions(options, this.rightVersionId);

        if (versionIndex === -1 || versionIndex === options.length - 1) {
            return null;
        }

        return options[versionIndex + 1].getDisplayValue();
    }

    private getNextVersion(options: Option<ContentVersion>[]): ContentVersion {
        const versionIndex = this.getVersionIndexInOptions(options, this.leftVersionId);

        if (versionIndex <= 0) {
            return null;
        }

        return options[versionIndex - 1].getDisplayValue();
    }

    private createAliases(options: Option<ContentVersion>[], maxDateTime?: number): Option<ContentVersion>[] {
        const aliases: Option<ContentVersion>[] = [];
        const isLeft = !!maxDateTime;

        const newestPublishedVersion: ContentVersion =
            this.getNewestPublishedVersion(options, maxDateTime || Date.now());

        if (newestPublishedVersion) {
            aliases.push(
                this.createAliasOption(newestPublishedVersion, i18n('dialog.compareVersions.publishedVersion'), AliasType.PUBLISHED)
            );
        }

        if (isLeft) {
            const prevVersion: ContentVersion = this.getPreviousVersion(options);
            if (prevVersion) {
                aliases.push(this.createAliasOption(prevVersion, i18n('dialog.compareVersions.previousVersion'), AliasType.PREV));
            }
        } else {
            const nextVersion: ContentVersion = this.getNextVersion(options);

            if (nextVersion) {
                aliases.push(this.createAliasOption(nextVersion, i18n('dialog.compareVersions.nextVersion'), AliasType.NEXT));
            }

            const newestVersion: ContentVersion = this.getNewestVersion(options);

            if (newestVersion) {
                aliases.push(this.createAliasOption(newestVersion, i18n('dialog.compareVersions.newestVersion'), AliasType.NEWEST));
            }
        }

        return aliases;
    }

    private createAliasOption(version: ContentVersion, alias: string, type: AliasType): Option<ContentVersion> {
        const versionId = version.getId();
        let counter = this.versionIdCounters[versionId] || 0;
        const aliasId = `alias|${versionId}|${++counter}`;
        this.versionIdCounters[versionId] = counter;

        const aliasVersion = version.createAlias(alias, type);

        return this.doCreateOption(aliasId, aliasVersion);
    }

    private createOption(version: ContentVersion): Option<ContentVersion> {
        return this.doCreateOption(version.getId(), version);
    }

    private doCreateOption(value: string, version: ContentVersion): Option<ContentVersion> {
        return Option.create<ContentVersion>()
            .setValue(value)
            .setDisplayValue(version)
            .build();
    }

    private optionSorter(a: Option<ContentVersion>, b: Option<ContentVersion>): number {
        const aVal = a.getDisplayValue();
        const bVal = b.getDisplayValue();
        if (!aVal.isAlias() && bVal.isAlias()) {
            return 1;
        }

        if (aVal.isAlias() && !bVal.isAlias()) {
            return -1;
        }

        if (aVal.isAlias() && bVal.isAlias()) {
            // Bubble AliasType.Newest to the top
            return aVal.getAliasType() - bVal.getAliasType();
        }

        return bVal.getModified().getTime() - aVal.getModified().getTime();
    }

    private leftVersionRequiresForcedSelection() {
        const leftTime = this.leftDropdown.getSelectedOption().getDisplayValue().getModified();
        const rightTime = this.rightDropdown.getSelectedOption().getDisplayValue().getModified();

        return leftTime.getTime() > rightTime.getTime();
    }

    private forceSelectVersion(dropdown: Dropdown<ContentVersion>, versionId: string, silent?: boolean) {
        const newOption = dropdown.getOptionByValue(versionId);
        const selectedValue = dropdown.getValue();
        if (!!newOption && versionId !== selectedValue) {
            dropdown.selectOption(newOption, silent);
        }
    }

    private disableLeftVersions() {
        const readOnlyOptions: Option<ContentVersion>[] = [];
        let markReadOnly = false;

        const rightOption = this.rightDropdown.getSelectedOption();
        let isNextSelectedInRightDropdown;
        if (rightOption) {
            isNextSelectedInRightDropdown = rightOption.getDisplayValue().getAliasType() === AliasType.NEXT;
        }

        this.leftDropdown.getOptions().slice().reverse().forEach((option: Option<ContentVersion>) => {
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

        return new GetContentVersionRequest(this.contentId)
            .setVersion(versionId)
            .sendRequest().then(content => {
                const processedContent = this.processContent(content);
                this.contentCache[versionId] = processedContent;
                return processedContent;
            });
    }

    private displayDiff(): Q.Promise<void> {
        const leftVersionId = this.leftVersionId;
        const rightVersionId = this.rightVersionId;

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

    private updateButtonsState() {
        this.revertLeftButton.setEnabled(!this.readOnly && !this.isLeftVersionActive());
        this.revertRightButton.setEnabled(!this.readOnly && !this.isRightVersionActive());
    }

    private isLeftVersionActive(): boolean {
        return this.leftDropdown.getSelectedOption().getDisplayValue().isActive();
    }

    private isRightVersionActive(): boolean {
        return this.rightDropdown.getSelectedOption().getDisplayValue().isActive();
    }

    private processContent(contentJson: any): Object {
        [
            '_id', 'childOrder', 'creator', 'createdTime', 'hasChildren'
        ].forEach(e => delete contentJson[e]);

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
