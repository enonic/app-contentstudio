import {ContentVersion} from '../ContentVersion';
import {ContentVersionViewer} from '../view/context/widget/version/ContentVersionViewer';
import {ActiveContentVersionSetEvent} from '../event/ActiveContentVersionSetEvent';
import {Content} from '../content/Content';
import {GetContentByIdRequest} from '../resource/GetContentByIdRequest';
import {Delta, DiffContext, DiffPatcher, formatters} from 'jsondiffpatch';
import {GetContentVersionsForViewRequest} from '../resource/GetContentVersionsForViewRequest';
import {ContentVersions} from '../ContentVersions';
import {RevertVersionRequest} from '../resource/RevertVersionRequest';
import {AttachmentJson} from '../attachment/AttachmentJson';
import {NotifyManager} from 'lib-admin-ui/notify/NotifyManager';
import {Button} from 'lib-admin-ui/ui/button/Button';
import {ModalDialog, ModalDialogConfig} from 'lib-admin-ui/ui/dialog/ModalDialog';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {Dropdown} from 'lib-admin-ui/ui/selector/dropdown/Dropdown';
import {CheckboxBuilder} from 'lib-admin-ui/ui/Checkbox';
import {Element} from 'lib-admin-ui/dom/Element';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import * as Q from 'q';


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

    private skipProps: string[] = ['extraData', 'data', 'page'];

    protected constructor() {
        super(<ModalDialogConfig>{
            class: 'compare-content-versions-dialog grey-header',
        });

        this.diffPatcher = new DiffPatcher({
            propertyFilter: (name: string, context: DiffContext) => {
                return this.skipProps.indexOf(name) === -1;
            }
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then(rendered => {
            this.toolbar = new DivEl('toolbar-container');

            this.leftDropdown = new Dropdown('left-version', {
                optionDisplayValueViewer: new ContentVersionViewer(),
                disableFilter: true,
                dataIdProperty: 'value',
                value: this.leftVersion
            });
            this.revertLeftButton = new Button(i18n('dialog.compare.revertThis'));
            this.leftDropdown.onValueChanged(event => {
                this.updateButtonsState();
                this.displayDiff(event.getNewValue(), this.rightDropdown.getValue());
            });
            this.revertLeftButton.onClicked(event => {
                this.restoreVersion(this.leftDropdown.getValue()).then(() => {
                    this.leftDropdown.setValue(this.activeVersion);
                    this.updateButtonsState();
                });
            });
            const leftContainer = new DivEl('container left');
            leftContainer.appendChildren<Element>(this.revertLeftButton, this.leftDropdown);


            this.rightDropdown = new Dropdown('right-version', {
                optionDisplayValueViewer: new ContentVersionViewer(),
                dataIdProperty: 'value',
                disableFilter: true,
                value: this.rightVersion
            });
            this.revertRightButton = new Button(i18n('dialog.compare.revertThis'));
            this.rightDropdown.onValueChanged(event => {
                this.updateButtonsState();
                this.displayDiff(this.leftDropdown.getValue(), event.getNewValue());
            });
            this.revertRightButton.onClicked(event => {
                this.restoreVersion(this.rightDropdown.getValue()).then(() => {
                    this.rightDropdown.setValue(this.activeVersion);
                    this.updateButtonsState();
                });
            });
            const rightContainer = new DivEl('container right');
            rightContainer.appendChildren<Element>(this.rightDropdown, this.revertRightButton);

            const bottomContainer = new DivEl('container bottom');
            const htmlFormatter = (<any>formatters.html);
            htmlFormatter.showUnchanged(false, null, 0);
            const changesCheckbox = new CheckboxBuilder().setLabelText(i18n('dialog.compare.showUnchanged')).build();
            changesCheckbox.onValueChanged(event => {
                htmlFormatter.showUnchanged(event.getNewValue() === 'true', null, 0);
            });
            bottomContainer.appendChild(changesCheckbox);

            this.toolbar.appendChildren(leftContainer, rightContainer, bottomContainer);

            this.comparisonContainer = new DivEl('jsondiffpatch-delta');

            this.getContentPanel().appendChildren(this.toolbar, this.comparisonContainer);

            this.addCancelButtonToBottom();
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
        this.setTitle(i18n('dialog.compareVersions', value));
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

    private displayDiff(leftVersion: string, rightVersion: string): Q.Promise<void> {
        let leftCache = this.contentCache[leftVersion];
        let rightCache = this.contentCache[rightVersion];

        const promises = [];
        if (!leftCache) {
            promises.push(new GetContentByIdRequest(this.contentId)
                .setVersion(leftVersion)
                .sendAndParse().then(content => {
                    const processedContent = this.processContent(content);
                    this.contentCache[leftVersion] = processedContent;
                    return processedContent;
                }));
        } else {
            promises.push(Q(leftCache));
        }
        if (!rightCache) {
            promises.push(new GetContentByIdRequest(this.contentId)
                .setVersion(rightVersion)
                .sendAndParse().then(content => {
                    const processedContent = this.processContent(content);
                    this.contentCache[rightVersion] = processedContent;
                    return processedContent;
                }));
        } else {
            promises.push(Q(rightCache));
        }
        this.comparisonContainer.addClass('loading');

        return Q.all(promises).spread((leftJson: Object, rightJson: Object) => {
            const delta: Delta = this.diffPatcher.diff(leftJson, rightJson);
            let text;
            let isEmpty = false;
            if (delta) {
                text = formatters.html.format(delta, leftJson);
            } else {
                isEmpty = true;
                text = `<h3>${i18n('dialog.compare.versionsIdentical')}</h3>`;
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
        if (this.revertLeftButton) {
            this.revertLeftButton.setEnabled(this.leftDropdown.getValue() !== this.activeVersion);
        }
        if (this.revertRightButton) {
            this.revertRightButton.setEnabled(this.rightDropdown.getValue() !== this.activeVersion);
        }
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
            publishFrom: content.getPublishFromTime(),
            publishTo: content.getPublishToTime(),
            publishFirstTime: content.getPublishFirstTime(),
            inheritPermissions: content.isInheritPermissionsEnabled(),
            overwritePermissions: content.isOverwritePermissionsEnabled(),
            permissions: content.getPermissions().toJson(),
            owner: content.getOwner() ? content.getOwner().toString() : undefined,
            createdTime: content.getCreatedTime(),
            modifier: content.getModifier(),
            modifiedTime: content.getModifiedTime(),
            language: content.getLanguage(),
            data: content.getContentData().toJson(),
            page: content.getPage() ? content.getPage().toJson() : undefined,
            extraData: allExtraData,
            attachments: attachments,
        };
    }
}
