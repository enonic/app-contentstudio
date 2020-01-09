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
import {ContentVersionAndAlias} from './ContentVersionAndAlias';

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

    private invertButton: Button;

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
        if (this.isAlias(this.leftVersion)) {
            this.leftVersion = this.selectOptionByAlias(this.leftVersion, this.leftDropdown).value;
        }

        this.rightVersion = this.rightDropdown.getSelectedOption().value;
        if (this.isAlias(this.rightVersion)) {
            this.rightVersion = this.selectOptionByAlias(this.rightVersion, this.rightDropdown).value;
        }

        if (!this.leftVersion || !this.rightVersion) {
            return;
        }

        if (!isLeft && this.leftVersionRequiresForcedSelection()) {
            this.leftVersion = this.rightVersion;
            this.forceSelectLeftVersion(this.leftVersion);
        }

        this.updateButtonsState();
        this.updateAliases(!isLeft);
        this.displayDiff(this.leftVersion, this.rightVersion);
    }

    private selectOptionByAlias(alias: string, dropdown: Dropdown<ContentVersionAndAlias>): Option<ContentVersionAndAlias> {
        const option = dropdown.getOptionByValue(this.aliasToVersionId(alias));
        if (option) {
            dropdown.resetActiveSelection();
            dropdown.setValue(option.value, true);
        }
        return option;
    }

    private isAlias(value: string): boolean {
        return value && value.startsWith('alias');
    }

    private aliasToVersionId(alias: string): string {
        // alias ids have following format: alias|<id>|<counter>
        return alias.split('|')[1];
    }

    private isDivider(value: string): boolean {
        // divider id have following format: divider|<counter>
        return value && value.startsWith('divider');
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

            this.invertButton = new Button();
            this.invertButton.addClass('transparent icon-compare icon-large');
            this.invertButton.onClicked((event) => {
                this.leftDropdown.setValue(this.rightVersion, true);
                this.rightDropdown.setValue(this.leftVersion);
                this.handleVersionChanged(true);
            });

            return this.reloadVersions().then(() => {

                this.toolbar.appendChildren(leftContainer, this.invertButton, rightContainer);

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
                const versions = contentVersions.getContentVersions();
                for (let i = 0; i < versions.length; i++) {
                    const version = versions[i];
                    options.push(this.createOption(version));
                }

                const leftAliases = this.createAliases(options, true);
                const rightAliases = this.createAliases(options, false);

                this.leftDropdown.setOptions(leftAliases.concat(options));
                this.leftDropdown.sort(this.optionSorter.bind(this));
                this.rightDropdown.setOptions(rightAliases.concat(options));
                this.rightDropdown.sort(this.optionSorter.bind(this));

                this.leftDropdown.setValue(this.leftVersion, true);
                this.rightDropdown.setValue(this.rightVersion);
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

    private updateAliases(isLeft: boolean) {
        const dd = isLeft ? this.leftDropdown : this.rightDropdown;
        let nextOption: Option<ContentVersionAndAlias> = dd.getOptionByRow(0);
        while (this.isAlias(nextOption.value) || this.isDivider(nextOption.value)) {
            dd.removeOption(nextOption);
            nextOption = dd.getOptionByRow(0);
        }

        this.createAliases(dd.getOptions(), isLeft).forEach(alias => {
            dd.addOption(alias);
        });
        dd.sort(this.optionSorter.bind(this));
    }

    private createAliases(options: Option<ContentVersionAndAlias>[], isLeft: boolean): Option<ContentVersionAndAlias>[] {
        let latestPublished: ContentVersion;
        let prevVersion: ContentVersion;
        let nextVersion: ContentVersion;
        let newestVersion: ContentVersion;

        const leftVersion = this.findOptionByValue(options, this.leftVersion);
        const leftModTime = leftVersion ? leftVersion.displayValue.contentVersion.modified.getTime() : Date.now();
        const rightVersion = this.findOptionByValue(options, this.rightVersion);
        const rightModTime = rightVersion ? rightVersion.displayValue.contentVersion.modified.getTime() : 0;

        options.forEach(option => {
            const version = option.displayValue.contentVersion;
            const modTime = version.modified.getTime();
            if (version.publishInfo) {
                if (!latestPublished || (version.publishInfo.timestamp.getTime() - latestPublished.publishInfo.timestamp.getTime() > 0)) {
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
            }
            if (!newestVersion || (modTime - newestVersion.modified.getTime() > 0)) {
                newestVersion = version;
            }
        });

        const aliases: Option<ContentVersionAndAlias>[] = [];
        if (latestPublished) {
            aliases.push(this.createOption(latestPublished, i18n('dialog.compareVersions.publishedVersion')));
        }
        if (prevVersion) {
            aliases.push(this.createOption(prevVersion, i18n('dialog.compareVersions.previousVersion')));
        }
        if (nextVersion) {
            aliases.push(this.createOption(nextVersion, i18n('dialog.compareVersions.nextVersion')));
        }
        if (newestVersion) {
            aliases.push(this.createOption(newestVersion, i18n('dialog.compareVersions.newestVersion')));
        }
        aliases.push(this.createDivider());

        return aliases;
    }

    private createOption(version: ContentVersion, alias?: string): Option<ContentVersionAndAlias> {
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
                contentVersion: version
            }
        };
    }

    private createDivider(): Option<ContentVersionAndAlias> {
        const id = 'divider';
        let counter = this.versionIdCounters[id] || 0;
        const value = `${id}|${++counter}`;
        this.versionIdCounters[id] = counter;
        return {
            value: value,
            readOnly: true,
            displayValue: {
                contentVersion: null
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
        } else if (this.isDivider(a.value) && !this.isDivider(b.value)) {
            return -1;
        } else if (!this.isDivider(a.value) && this.isDivider(b.value)) {
            return 1;
        }
        return bVal.contentVersion.modified.getTime() - aVal.contentVersion.modified.getTime();
    }

    private leftVersionRequiresForcedSelection() {
        const leftTime = this.leftDropdown.getSelectedOption().displayValue.contentVersion.modified;
        const rightTime = this.rightDropdown.getSelectedOption().displayValue.contentVersion.modified;

        return leftTime.getTime() > rightTime.getTime();
    }

    private forceSelectLeftVersion(leftVersion: string) {
        this.leftDropdown.resetActiveSelection();
        this.leftDropdown.setValue(leftVersion, true);
    }

    private disableLeftVersions() {
        const readOnlyOptions: Option<ContentVersionAndAlias>[] = [];
        let readOnlyOptionIds: string[] = [];
        let markReadOnly = false;
        this.leftDropdown.getOptions().slice().reverse().forEach((option: Option<ContentVersionAndAlias>) => {
            // slice first to create new array and prevent modification of original options
            // doing reverse to be sure to go through regular versions before aliases
            // and make everything in one go

            if (this.isDivider(option.value)) {
                readOnlyOptions.push(option);
            } else if (this.isAlias(option.value)) {
                const id = this.aliasToVersionId(option.value);
                const readOnly = readOnlyOptionIds.indexOf(id) >= 0 || id === this.leftVersion;
                option.readOnly = readOnly;
                if (readOnly) {
                    readOnlyOptions.push(option);
                }
            } else {
                option.readOnly = markReadOnly;
                if (markReadOnly) {
                    readOnlyOptions.push(option);
                    readOnlyOptionIds.push(option.value);
                }
            }

            if (option.value === this.rightVersion) {
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
        this.rightDropdown.getOptions().forEach(option => {
            if (this.isDivider(option.value)) {
                readOnlyOptions.push(option);
            } else if (this.isAlias(option.value)) {
                const id = this.aliasToVersionId(option.value);
                if (id === this.rightVersion) {
                    option.readOnly = true;
                    readOnlyOptions.push(option);
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

    private displayDiff(leftVersion: string, rightVersion: string): Q.Promise<void> {
        const promises = [
            this.fetchVersionPromise(leftVersion)
        ];
        if (leftVersion !== rightVersion) {
            promises.push(this.fetchVersionPromise(rightVersion));
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
        const isCurrentVersionLeft = this.leftDropdown.getValue() === this.activeVersion;
        const isCurrentVersionRight = this.rightDropdown.getValue() === this.activeVersion;

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
