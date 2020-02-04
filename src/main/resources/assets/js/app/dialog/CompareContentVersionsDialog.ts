import * as Q from 'q';
import {ContentVersion} from '../ContentVersion';
import {ActiveContentVersionSetEvent} from '../event/ActiveContentVersionSetEvent';
import {GetContentVersionRequest} from '../resource/GetContentVersionRequest';
import {Delta, DiffPatcher, formatters} from 'jsondiffpatch';
import {GetContentVersionsForViewRequest} from '../resource/GetContentVersionsForViewRequest';
import {ContentVersions} from '../ContentVersions';
import {RevertVersionRequest} from '../resource/RevertVersionRequest';
import {DefaultModalDialogHeader, ModalDialog, ModalDialogConfig, ModalDialogHeader} from 'lib-admin-ui/ui/dialog/ModalDialog';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {NotifyManager} from 'lib-admin-ui/notify/NotifyManager';
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
import {ContentVersionAndAliasViewer} from './ContentVersionAndAliasViewer';
import {AliasType, ContentVersionAndAlias} from './ContentVersionAndAlias';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';

export class CompareContentVersionsDialog
    extends ModalDialog {

    private static INSTANCE: CompareContentVersionsDialog;

    private leftVersion: string;

    private rightVersion: string;

    private activeVersion: string;

    private contentId: ContentId;

    private toolbar: DivEl;

    private leftDropdown: Dropdown<ContentVersionAndAlias>;

    private rightDropdown: Dropdown<ContentVersionAndAlias>;

    private leftLabel: LabelEl;

    private rightLabel: LabelEl;

    private comparisonContainer: DivEl;

    private revertLeftButton: Button;

    private revertRightButton: Button;

    private diffIcon: SpanEl;

    private contentCache: { [key: string]: Object };

    private diffPatcher: DiffPatcher;

    private htmlFormatter: any;

    private content: ContentSummary;

    private outsideClickListener: (event: MouseEvent) => void;

    private versionIdCounters: { [id: string]: number };

    protected constructor() {
        super(<ModalDialogConfig>{
            class: 'compare-content-versions-dialog grey-header',
            title: i18n('dialog.compareVersions.comparingVersions')
        });

        this.diffPatcher = new DiffPatcher();
    }

    private createVersionDropdown(stylePrefix: string, version: string): Dropdown<ContentVersionAndAlias> {

        const dropdown = new Dropdown(`${stylePrefix}-version`, {
            optionDisplayValueViewer: new ContentVersionAndAliasViewer(),
            disableFilter: true,
            dataIdProperty: 'value',
            value: version
        });

        dropdown.onOptionSelected((event: OptionSelectedEvent<ContentVersionAndAlias>) => {
            if (!this.isRendered()) {
                return;
            }

            this.handleVersionChanged(dropdown === this.leftDropdown);
        });
        return dropdown;
    }

    private handleVersionChanged(isLeft?: boolean) {
        this.leftVersion = this.leftDropdown.getSelectedOption().value;

        this.rightVersion = this.rightDropdown.getSelectedOption().value;

        if (!this.leftVersion || !this.rightVersion) {
            return;
        }

        if (!isLeft && this.leftVersionRequiresForcedSelection()) {
            this.leftVersion = this.normalizeVersion(this.rightVersion);
            this.forceSelectVersion(this.leftDropdown, this.leftVersion, true);
        }

        this.updateButtonsState();
        if (this.updateAliases(!isLeft) !== false) {
            this.displayDiff(this.leftVersion, this.rightVersion);
        }
    }

    private isAlias(value: string): boolean {
        return value && value.startsWith('alias');
    }

    private aliasToVersionId(alias: string): string {
        // alias ids have following format: alias|<id>|<counter>
        return alias.split('|')[1];
    }

    createVersionRevertButton(dropdown: Dropdown<ContentVersionAndAlias>): Button {

        const revertAction = new Action(i18n('field.version.revert')).onExecuted(() => {
            this.restoreVersion(dropdown.getValue());
        });
        const menu = new Menu([revertAction]);
        menu.onItemClicked(() => {
            this.setMenuVisible(false, menu, button);
        });
        const button = new Button();
        button.addClass('transparent icon-more_vert icon-large');
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

            this.leftDropdown = this.createVersionDropdown('left', this.leftVersion);
            this.leftDropdown.onExpanded(this.disableLeftVersions.bind(this));
            this.revertLeftButton = this.createVersionRevertButton(this.leftDropdown);

            this.leftLabel = new LabelEl(i18n('dialog.compareVersions.olderVersion'));
            const leftContainer = new DivEl('container left');
            leftContainer.appendChildren<Element>(this.revertLeftButton, this.leftDropdown, this.leftLabel);

            this.rightLabel = new LabelEl(i18n('dialog.compareVersions.newerVersion'));
            this.rightDropdown = this.createVersionDropdown('right', this.rightVersion);
            this.rightDropdown.onExpanded(this.disableRightVersions.bind(this));
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

            this.diffIcon = new SpanEl('icon-compare icon-large');

            return this.reloadVersions().then(() => {

                this.toolbar.appendChildren<any>(leftContainer, this.diffIcon, rightContainer);

                this.comparisonContainer = new DivEl('jsondiffpatch-delta');

                this.appendChildToHeader(this.toolbar);
                this.appendChildToContentPanel(this.comparisonContainer);

                this.updateButtonsState();
                this.displayDiff(this.leftVersion, this.rightVersion);

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

    setLeftVersion(value: string): CompareContentVersionsDialog {
        this.leftVersion = value;
        return this;
    }

    setRightVersion(value: string): CompareContentVersionsDialog {
        this.rightVersion = value;
        return this;
    }

    setActiveVersion(value: string): CompareContentVersionsDialog {
        this.activeVersion = value;
        return this;
    }

    setContent(value: ContentSummary): CompareContentVersionsDialog {
        this.content = value;
        this.contentId = value ? value.getContentId() : null;
        (<CompareContentVersionsDialogHeader>this.header).setSubTitle(value ? value.getPath().toString() : null);
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
        return new GetContentVersionsForViewRequest(this.contentId).setSize(-1).sendAndParse()
            .then((contentVersions: ContentVersions) => {

                this.versionIdCounters = {};

                if (this.leftDropdown) {
                    this.leftDropdown.removeAllOptions();
                }
                if (this.rightDropdown) {
                    this.rightDropdown.removeAllOptions();
                }

                const options: Option<ContentVersionAndAlias>[] = [];
                const versions = contentVersions.getContentVersions().sort((v1: ContentVersion, v2: ContentVersion) => {
                    return v2.modified.getTime() - v1.modified.getTime();
                });
                for (let i = 0; i < versions.length; i++) {
                    const version = versions[i];
                    const option = this.createOption(version);
                    if (i === 0) {
                        option.displayValue.divider = true; // Mark newest version as a divider to separate versions from aliases
                    }
                    options.push(option);
                }

                // init latest versions by default if nothing is set
                if (!this.leftVersion || !this.rightVersion) {
                    const latestOption = this.getDefaultOption(options);
                    if (!this.leftVersion) {
                        this.leftVersion = latestOption.value;
                    }
                    if (!this.rightVersion) {
                        this.rightVersion = latestOption.value;
                    }
                }

                const leftAliases = this.createAliases(options, true);
                const rightAliases = this.createAliases(options, false);

                this.leftDropdown.setOptions(leftAliases.concat(options));
                this.leftDropdown.sort(this.optionSorter.bind(this));
                this.rightDropdown.setOptions(rightAliases.concat(options));
                this.rightDropdown.sort(this.optionSorter.bind(this));

                // now after aliases are added we can select newest alias for the right dropdown
                const latestAlias = this.getDefaultOption(this.rightDropdown.getOptions());
                if (latestAlias.value !== this.rightVersion) {
                    this.rightVersion = latestAlias.value;
                }

                this.forceSelectVersion(this.leftDropdown, this.leftVersion, true);
                this.forceSelectVersion(this.rightDropdown, this.rightVersion);
            });
    }

    private findOptionByValue(options: Option<ContentVersionAndAlias>[], value: string): Option<ContentVersionAndAlias> {
        if (!options || options.length === 0) {
            return;
        }
        return options.find((option) => {
            return option.value === value;
        });
    }

    private updateAliases(isLeft: boolean): boolean {
        const dd = isLeft ? this.leftDropdown : this.rightDropdown;
        let selectedType: AliasType;
        const selectedOption = dd.getSelectedOption();
        if (selectedOption) {
            selectedType = selectedOption.displayValue.type;
        }

        let nextOption: Option<ContentVersionAndAlias> = dd.getOptionByRow(0);
        while (this.isAlias(nextOption.value)) {
            dd.removeOption(nextOption);
            nextOption = dd.getOptionByRow(0);
        }

        let aliasFound;
        this.createAliases(dd.getOptions(), isLeft).forEach(alias => {
            dd.addOption(alias);
            if (selectedType !== undefined && alias.displayValue.type === selectedType) {
                aliasFound = true;
                dd.selectOption(alias, true);
                // update version with new alias id
                if (isLeft) {
                    this.leftVersion = alias.value;
                } else {
                    this.rightVersion = alias.value;
                }
            }
        });
        // sort first to ensure correct order
        dd.sort(this.optionSorter.bind(this));

        if (selectedType !== undefined) {
            // alias has been removed so select default option
            if (!aliasFound) {
                // set same value as in the other dropdown
                this.forceSelectVersion(dd, isLeft ? this.rightVersion : this.leftVersion);
                return false;
            }
        }
    }

    private getDefaultOption(opts: Option<ContentVersionAndAlias>[]): Option<ContentVersionAndAlias> {
        let newest = opts.find(opt => {
            if (opt.displayValue.type === AliasType.NEWEST) {
                return true;
            }
        });
        if (!newest) {
            opts.forEach(opt => {
                if (!newest || opt.displayValue.contentVersion.modified > newest.displayValue.contentVersion.modified) {
                    newest = opt;
                }
            });
        }

        return newest;
    }

    private createAliases(options: Option<ContentVersionAndAlias>[], isLeft: boolean): Option<ContentVersionAndAlias>[] {
        let latestPublished: ContentVersion;
        let prevVersion: ContentVersion;
        let nextVersion: ContentVersion;
        let newestVersion: ContentVersion;

        const leftOpt = this.findOptionByValue(options, this.normalizeVersion(this.leftVersion));
        const leftModTime = leftOpt ? leftOpt.displayValue.contentVersion.modified.getTime() : Date.now();
        const rightOpt = this.findOptionByValue(options, this.normalizeVersion(this.rightVersion));
        const rightModTime = rightOpt ? rightOpt.displayValue.contentVersion.modified.getTime() : 0;

        options.forEach(option => {
            const version = option.displayValue.contentVersion;
            const modTime = version.modified.getTime();
            if (version.publishInfo && (!isLeft || modTime <= rightModTime)) {
                if (!latestPublished || (version.publishInfo.timestamp.getTime() - latestPublished.publishInfo.timestamp.getTime() < 0)) {
                    latestPublished = version;
                }
            }
            if (isLeft) {
                if ((!prevVersion || (modTime - prevVersion.modified.getTime() > 0)) && (modTime - rightModTime < 0)) {
                    prevVersion = version;
                }
            } else {
                if ((!nextVersion || (modTime - nextVersion.modified.getTime() < 0)) && (modTime - leftModTime > 0)) {
                    nextVersion = version;
                }
                if (!newestVersion || (modTime - newestVersion.modified.getTime() > 0)) {
                    newestVersion = version;
                }
            }
        });

        const aliases: Option<ContentVersionAndAlias>[] = [];
        if (latestPublished) {
            aliases.push(this.createOption(latestPublished, i18n('dialog.compareVersions.publishedVersion'), AliasType.PUBLISHED));
        }
        if (prevVersion) {
            aliases.push(this.createOption(prevVersion, i18n('dialog.compareVersions.previousVersion'), AliasType.PREV));
        }
        if (nextVersion) {
            aliases.push(this.createOption(nextVersion, i18n('dialog.compareVersions.nextVersion'), AliasType.NEXT));
        }
        if (newestVersion) {
            aliases.push(this.createOption(newestVersion, i18n('dialog.compareVersions.newestVersion'), AliasType.NEWEST));
        }

        return aliases;
    }

    private createOption(version: ContentVersion, alias?: string, type?: AliasType): Option<ContentVersionAndAlias> {
        let value = version.id;
        if (alias) {
            let counter = this.versionIdCounters[version.id] || 0;
            value = `alias|${value}|${++counter}`;
            this.versionIdCounters[version.id] = counter;
        }
        return {
            value: value,
            displayValue: {
                alias: alias,
                type: type,
                contentVersion: version
            }
        };
    }

    private optionSorter(a: Option<ContentVersionAndAlias>, b: Option<ContentVersionAndAlias>): number {
        const aVal = a.displayValue;
        const bVal = b.displayValue;
        if (aVal.alias == null && bVal.alias != null) {
            return 1;
        } else if (aVal.alias != null && bVal.alias == null) {
            return -1;
        } else if (!isNaN(aVal.type) && !isNaN(bVal.type)) {
            // Bubble AliasType.Newest to the top
            return aVal.type - bVal.type;
        }
        return bVal.contentVersion.modified.getTime() - aVal.contentVersion.modified.getTime();
    }

    private leftVersionRequiresForcedSelection() {
        const leftTime = this.leftDropdown.getSelectedOption().displayValue.contentVersion.modified;
        const rightTime = this.rightDropdown.getSelectedOption().displayValue.contentVersion.modified;

        return leftTime.getTime() > rightTime.getTime();
    }

    private forceSelectVersion(dropdown: Dropdown<ContentVersionAndAlias>, version: string, silent?: boolean) {
        dropdown.resetActiveSelection();
        dropdown.setValue(version, silent);
    }

    private disableLeftVersions() {
        const readOnlyOptions: Option<ContentVersionAndAlias>[] = [];
        const normalizedRight = this.normalizeVersion(this.rightVersion);
        let markReadOnly = false;

        const rightOption = this.rightDropdown.getSelectedOption();
        let isNextSelectedInRightDropdown;
        if (rightOption) {
            isNextSelectedInRightDropdown = rightOption.displayValue.type === AliasType.NEXT;
        }

        this.leftDropdown.getOptions().slice().reverse().forEach((option: Option<ContentVersionAndAlias>) => {
            // slice first to create new array and prevent modification of original options
            // doing reverse to be sure to go through regular versions before aliases
            // and make everything in one go

            if (this.isAlias(option.value)) {
                if (isNextSelectedInRightDropdown && option.displayValue.type === AliasType.PREV) {
                    option.readOnly = true;
                    readOnlyOptions.push(option);
                } else {
                    // don't disable aliases
                    return;
                }
            } else {
                option.readOnly = markReadOnly;
                if (markReadOnly) {
                    readOnlyOptions.push(option);
                }
            }

            if (option.value === normalizedRight) {
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
            isPrevSelectedInLeftDropdown = leftOption.displayValue.type === AliasType.PREV;
        }

        this.rightDropdown.getOptions().forEach(option => {
            if (this.isAlias(option.value)) {
                if (isPrevSelectedInLeftDropdown && option.displayValue.type === AliasType.NEXT) {
                    option.readOnly = true;
                    readOnlyOptions.push(option);
                } else {
                    // dont' disable aliases
                    return;
                }
            }
        });

        if (readOnlyOptions.length) {
            this.rightDropdown.markReadOnly(readOnlyOptions);
        }
    }

    private fetchVersionPromise(version: string): Q.Promise<Object> {
        const cache = this.contentCache[version];

        if (cache) {
            return Q(cache);
        }

        return new GetContentVersionRequest(this.contentId)
            .setVersion(version)
            .sendRequest().then(content => {
                const processedContent = this.processContent(content);
                this.contentCache[version] = processedContent;
                return processedContent;
            });
    }

    private normalizeVersion(versionOrAlias: string): string {
        if (this.isAlias(versionOrAlias)) {
            return this.aliasToVersionId(versionOrAlias);
        }
        return versionOrAlias;
    }

    private displayDiff(leftVersion: string, rightVersion: string): Q.Promise<void> {
        const normalizedLeftVersion = this.normalizeVersion(leftVersion);
        const promises = [
            this.fetchVersionPromise(normalizedLeftVersion)
        ];

        const normalizedRightVersion = this.normalizeVersion(rightVersion);
        if (normalizedLeftVersion !== normalizedRightVersion) {
            promises.push(this.fetchVersionPromise(normalizedRightVersion));
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

    private restoreVersion(version: string): Q.Promise<void> {
        return new RevertVersionRequest(version, this.contentId.toString()).sendAndParse()
            .then((contentKey: string) => {
                if (contentKey === this.activeVersion) {
                    NotifyManager.get().showFeedback(i18n('notify.revert.noChanges'));
                } else {
                    NotifyManager.get().showFeedback(i18n('notify.version.changed', contentKey));
                    new ActiveContentVersionSetEvent(this.contentId, contentKey).fire();
                    this.activeVersion = contentKey;
                    return this.reloadVersions();
                }
            });
    }

    private updateButtonsState() {
        const isCurrentVersionLeft = this.normalizeVersion(this.leftDropdown.getValue()) === this.activeVersion;
        const isCurrentVersionRight = this.normalizeVersion(this.rightDropdown.getValue()) === this.activeVersion;

        const leftLabel = i18n(isCurrentVersionLeft ? 'dialog.compareVersions.current' : 'dialog.compareVersions.olderVersion');
        const rightLabel = i18n(isCurrentVersionRight ? 'dialog.compareVersions.current' : 'dialog.compareVersions.newerVersion');

        this.revertLeftButton.setEnabled(!isCurrentVersionLeft);
        this.revertRightButton.setEnabled(!isCurrentVersionRight);

        this.leftLabel.setValue(leftLabel);
        this.rightLabel.setValue(rightLabel);
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
