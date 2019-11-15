import {ContentVersion} from '../ContentVersion';
import {ContentVersionViewer} from '../view/context/widget/version/ContentVersionViewer';
import {ActiveContentVersionSetEvent} from '../event/ActiveContentVersionSetEvent';
import {Content} from '../content/Content';
import {GetContentByIdRequest} from '../resource/GetContentByIdRequest';
import {Delta, DiffPatcher, formatters} from 'jsondiffpatch';
import {GetContentVersionsForViewRequest} from '../resource/GetContentVersionsForViewRequest';
import {ContentVersions} from '../ContentVersions';
import {RevertVersionRequest} from '../resource/RevertVersionRequest';
import {AttachmentJson} from '../attachment/AttachmentJson';
import NotifyManager = api.notify.NotifyManager;
import Button = api.ui.button.Button;
import ModalDialog = api.ui.dialog.ModalDialog;
import ModalDialogConfig = api.ui.dialog.ModalDialogConfig;
import i18n = api.util.i18n;
import Element = api.dom.Element;
import DivEl = api.dom.DivEl;
import ContentId = api.content.ContentId;
import Option = api.ui.selector.Option;
import Dropdown = api.ui.selector.dropdown.Dropdown;
import CheckboxBuilder = api.ui.CheckboxBuilder;

export class CompareContentVersionsDialog
    extends ModalDialog {

    private static INSTANCE: CompareContentVersionsDialog;

    private leftVersion: string;

    private rightVersion: string;

    private activeVersion: string;

    private contentId: ContentId;

    private toolbar: DivEl;

    private leftDropdown: Dropdown<ContentVersion>;

    private rightDropdown: Dropdown<ContentVersion>;

    private comparisonContainer: DivEl;

    private revertLeftButton: Button;

    private revertRightButton: Button;

    private contentCache: { [key: string]: Object };

    private diffPatcher: DiffPatcher;

    protected constructor() {
        super(<ModalDialogConfig>{
            class: 'compare-content-versions-dialog grey-header',
        });

        this.diffPatcher = new DiffPatcher();
    }

    private createVersionDropdown(stylePrefix: string, version: string): Dropdown<ContentVersion> {

        const dropdown = new Dropdown(`${stylePrefix}-version`, {
            optionDisplayValueViewer: new ContentVersionViewer(),
            disableFilter: true,
            dataIdProperty: 'value',
            value: version
        });

        dropdown.onValueChanged(event => {
            const sourceDropdown = (dropdown === this.rightDropdown) ? this.leftDropdown : this.rightDropdown;
            this.updateButtonsState();
            this.displayDiff(event.getNewValue(), sourceDropdown.getValue());
        });
        return dropdown;
    }

    createVersionRevertButton(dropdown: Dropdown<ContentVersion>): Button {
        const button = new Button(i18n('field.version.revert'));

        button.onClicked(event => {
            this.restoreVersion(dropdown.getValue()).then(() => {
                dropdown.setValue(this.activeVersion);
                this.updateButtonsState();
            });
        });

        return button;
    }

    doRender(): wemQ.Promise<boolean> {
        return super.doRender().then(rendered => {
            this.toolbar = new DivEl('toolbar-container');

            this.leftDropdown = this.createVersionDropdown('left', this.leftVersion);
            this.revertLeftButton = this.createVersionRevertButton(this.leftDropdown);

            const leftContainer = new DivEl('container left');
            leftContainer.appendChildren<Element>(this.revertLeftButton, this.leftDropdown);

            this.rightDropdown = this.createVersionDropdown('right', this.rightVersion);
            this.revertRightButton = this.createVersionRevertButton(this.rightDropdown);

            const rightContainer = new DivEl('container right');
            rightContainer.appendChildren<Element>(this.rightDropdown, this.revertRightButton);

            const bottomContainer = new DivEl('container bottom');
            const htmlFormatter = (<any>formatters.html);
            htmlFormatter.showUnchanged(false, null, 0);
            const changesCheckbox = new CheckboxBuilder().setLabelText(i18n('dialog.compareVersions.showUnchanged')).build();
            changesCheckbox.onValueChanged(event => {
                htmlFormatter.showUnchanged(event.getNewValue() === 'true', null, 0);
            });
            bottomContainer.appendChild(changesCheckbox);

            this.toolbar.appendChildren(leftContainer, rightContainer, bottomContainer);

            this.comparisonContainer = new DivEl('jsondiffpatch-delta');

            this.appendChildToHeader(this.toolbar);
            this.appendChildToContentPanel(this.comparisonContainer);

            this.updateButtonsState();

            return rendered;
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
        if (this.leftDropdown) {
            this.leftDropdown.setValue(value);
        }
        return this;
    }

    setRightVersion(value: string): CompareContentVersionsDialog {
        this.rightVersion = value;
        if (this.rightDropdown) {
            this.rightDropdown.setValue(value);
        }
        return this;
    }

    setActiveVersion(value: string): CompareContentVersionsDialog {
        this.activeVersion = value;
        this.updateButtonsState();
        return this;
    }

    setContentDisplayName(value: string): CompareContentVersionsDialog {
        this.setTitle(i18n('dialog.compareVersions.comparingVersions', value));
        return this;
    }

    setContentId(value: ContentId): CompareContentVersionsDialog {
        this.contentId = value;
        return this;
    }

    open() {
        super.open();
        this.contentCache = {};
        if (this.contentId) {
            this.reloadVersions().then(() => {
                this.displayDiff(this.leftVersion, this.rightVersion);
            });
        }
    }

    private reloadVersions() {
        return new GetContentVersionsForViewRequest(this.contentId).setSize(-1).sendAndParse()
            .then((contentVersions: ContentVersions) => {

                if (this.leftDropdown) {
                    this.leftDropdown.removeAllOptions();
                }
                if (this.rightDropdown) {
                    this.rightDropdown.removeAllOptions();
                }

                let options: Option<ContentVersion>[] = [];
                const versions = contentVersions.getContentVersions();
                for (let i = 0; i < versions.length; i++) {
                    const version = versions[i];
                    options.push({
                        value: version.id,
                        displayValue: version
                    });
                }

                options = options.sort((a, b) => {
                    return b.displayValue.modified.getTime() - a.displayValue.modified.getTime();
                });

                this.leftDropdown.setOptions(options);
                this.rightDropdown.setOptions(options);
            });
    }

    close() {
        super.close();
    }

    private fetchVersionPromise(version: string): wemQ.Promise<Object> {
        const cache = this.contentCache[version];

        if (cache) {
            return Q(cache);
        }

        return new GetContentByIdRequest(this.contentId)
            .setVersion(version)
            .sendAndParse().then(content => {
                const processedContent = this.processContent(content);
                this.contentCache[version] = processedContent;
                return processedContent;
            });
    }

    private displayDiff(leftVersion: string, rightVersion: string): wemQ.Promise<void> {
        const promises = [
            this.fetchVersionPromise(leftVersion),
            this.fetchVersionPromise(rightVersion)
        ];
        this.comparisonContainer.addClass('loading');

        return wemQ.all(promises).spread((leftJson: Object, rightJson: Object) => {
            const delta: Delta = this.diffPatcher.diff(leftJson, rightJson);
            let text;
            let isEmpty = false;
            if (delta) {
                text = formatters.html.format(delta, leftJson);
            } else {
                isEmpty = true;
                text = `<h3>${i18n('dialog.compareVersions.versionsIdentical')}</h3>`;
            }
            this.comparisonContainer.removeClass('loading');
            this.comparisonContainer.setHtml(text, false).toggleClass('empty', isEmpty);
        });
    }

    private restoreVersion(version: string): wemQ.Promise<void> {
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

    private updateButtonState(button: Button, versionDropdown: Dropdown<ContentVersion>) {
        if (!button) {
            return;
        }
        const isCurrentVersion = versionDropdown.getValue() === this.activeVersion;
        button.setEnabled(!isCurrentVersion);
        button.setLabel(i18n(isCurrentVersion ? 'dialog.compareVersions.current' : 'field.version.revert'));
    }

    private updateButtonsState() {
        this.updateButtonState(this.revertLeftButton, this.leftDropdown);
        this.updateButtonState(this.revertRightButton, this.rightDropdown);
    }

    private processContent(content: Content): Object {
        const attachments: AttachmentJson[] = [];
        content.getAttachments().forEach(attachment => attachments.push(attachment.toJson()));
        const allExtraData = content.getAllExtraData().map(extraData => extraData.toJson());
        return {
            displayName: content.getDisplayName(),
            name: content.getName().toString(),
            path: content.getPath().toString(),
            type: content.getType().toString(),
            iconUrl: content.getIconUrl(),
            valid: content.isValid(),
            owner: content.getOwner() ? content.getOwner().toString() : undefined,
            language: content.getLanguage(),
            data: content.getContentData().toJson(),
            page: content.getPage() ? content.getPage().toJson() : undefined,
            extraData: allExtraData,
            attachments: attachments,
        };
    }
}
