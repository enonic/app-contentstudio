import ModalDialog = api.ui.dialog.ModalDialog;
import i18n = api.util.i18n;
import ModalDialogConfig = api.ui.dialog.ModalDialogConfig;
import DivEl = api.dom.DivEl;
import ContentId = api.content.ContentId;
import Dropdown = api.ui.selector.dropdown.Dropdown;
import {ContentVersion} from '../ContentVersion';
import {ContentVersionViewer} from '../view/context/widget/version/ContentVersionViewer';
import {SetActiveContentVersionRequest} from '../resource/SetActiveContentVersionRequest';
import {ActiveContentVersionSetEvent} from '../event/ActiveContentVersionSetEvent';
import {Content} from '../content/Content';
import {GetContentByIdRequest} from '../resource/GetContentByIdRequest';
import {Delta, DiffContext, DiffPatcher, formatters} from 'jsondiffpatch';
import {GetContentVersionsForViewRequest} from '../resource/GetContentVersionsForViewRequest';
import {ContentVersions} from '../ContentVersions';


export class CompareContentVersionsDialog
    extends ModalDialog {

    private static INSTANCE: CompareContentVersionsDialog;

    private leftVersion: string;

    private rightVersion: string;

    private activeVersion: string;

    private contentId: ContentId;

    private toolbar: DivEl;

    private leftDropdown: api.ui.selector.dropdown.Dropdown<ContentVersion>;

    private rightDropdown: api.ui.selector.dropdown.Dropdown<ContentVersion>;

    private comparisonContainer: DivEl;

    private revertLeftButton: api.ui.button.Button;

    private revertRightButton: api.ui.button.Button;

    private contentCache: { [key: string]: Content };

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
            this.revertLeftButton = new api.ui.button.Button(i18n('dialog.compare.revertThis'));
            this.leftDropdown.onValueChanged(event => {
                this.leftVersion = event.getNewValue();
                this.updateButtonsState();
                this.displayDiff(this.leftVersion, this.rightVersion);
            });
            this.revertLeftButton.onClicked(event => this.restoreVersion(this.leftVersion));
            const leftContainer = new DivEl('left');
            leftContainer.appendChildren<api.dom.Element>(this.revertLeftButton, this.leftDropdown);


            this.rightDropdown = new Dropdown('right-version', {
                optionDisplayValueViewer: new ContentVersionViewer(),
                dataIdProperty: 'value',
                disableFilter: true,
                value: this.rightVersion
            });
            this.revertRightButton = new api.ui.button.Button(i18n('dialog.compare.revertThis'));
            this.rightDropdown.onValueChanged(event => {
                this.rightVersion = event.getNewValue();
                this.updateButtonsState();
                this.displayDiff(this.leftVersion, this.rightVersion);
            });
            this.revertRightButton.onClicked(event => this.restoreVersion(this.rightVersion));
            const rightContainer = new DivEl('right');
            rightContainer.appendChildren<api.dom.Element>(this.rightDropdown, this.revertRightButton);

            this.toolbar.appendChildren(leftContainer, rightContainer);

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
            new GetContentVersionsForViewRequest(this.contentId).setSize(-1).sendAndParse()
                .then((contentVersions: ContentVersions) => {

                    if (this.leftDropdown) {
                        this.leftDropdown.removeAllOptions();
                    }
                    if (this.rightDropdown) {
                        this.rightDropdown.removeAllOptions();
                    }

                    let options: api.ui.selector.Option<ContentVersion>[] = [];
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

                    this.displayDiff(this.leftVersion, this.rightVersion);
                });
        }
    }

    close() {
        super.close();
    }

    private displayDiff(leftVersion: string, rightVersion: string): wemQ.Promise<void> {
        let leftCache = this.contentCache[leftVersion];
        let rightCache = this.contentCache[rightVersion];

        const promises = [];
        if (!leftCache) {
            promises.push(new GetContentByIdRequest(this.contentId)
                .setVersion(leftVersion)
                .sendAndParse().then(content => {
                    this.contentCache[leftVersion] = content;
                    return content;
                }));
        } else {
            promises.push(wemQ(leftCache));
        }
        if (!rightCache) {
            promises.push(new GetContentByIdRequest(this.contentId)
                .setVersion(rightVersion)
                .sendAndParse().then(content => {
                    this.contentCache[rightVersion] = content;
                    return content;
                }));
        } else {
            promises.push(wemQ(rightCache));
        }
        this.comparisonContainer.addClass('loading');

        return wemQ.all(promises).spread((leftContent: Content, rightContent: Content) => {
            const delta: Delta = this.diffPatcher.diff(leftContent, rightContent);
            let text;
            let isEmpty = false;
            if (delta) {
                text = formatters.html.format(delta, leftContent);
            } else {
                isEmpty = true;
                text = `<h3>${i18n('dialog.compare.versionsIdentical')}</h3>`;
            }
            this.comparisonContainer.removeClass('loading');
            this.comparisonContainer.setHtml(text, false).toggleClass('empty', isEmpty);
        });
    }

    private restoreVersion(version: string): wemQ.Promise<void> {
        return new SetActiveContentVersionRequest(version, this.contentId).sendAndParse()
            .then((contentId: ContentId) => {
                api.notify.NotifyManager.get().showFeedback(i18n('notify.version.changed', version));
                new ActiveContentVersionSetEvent(this.contentId, version).fire();
                this.activeVersion = version;
                this.updateButtonsState();
            });
    }

    private updateButtonsState() {
        if (this.revertLeftButton) {
            this.revertLeftButton.setEnabled(this.leftVersion !== this.activeVersion);
        }
        if (this.revertRightButton) {
            this.revertRightButton.setEnabled(this.rightVersion !== this.activeVersion);
        }
    }
}
