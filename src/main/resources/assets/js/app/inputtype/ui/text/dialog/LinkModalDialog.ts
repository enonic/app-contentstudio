import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {Form} from 'lib-admin-ui/ui/form/Form';
import {FormItem} from 'lib-admin-ui/ui/form/FormItem';
import {Panel} from 'lib-admin-ui/ui/panel/Panel';
import {DockedPanel} from 'lib-admin-ui/ui/panel/DockedPanel';
import {Validators} from 'lib-admin-ui/ui/form/Validators';
import {TextInput} from 'lib-admin-ui/ui/text/TextInput';
import {Dropdown, DropdownConfig} from 'lib-admin-ui/ui/selector/dropdown/Dropdown';
import {UploadItem} from 'lib-admin-ui/ui/uploader/UploadItem';
import {BaseSelectedOptionsView} from 'lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {UploadStartedEvent} from 'lib-admin-ui/ui/uploader/UploadStartedEvent';
import {UploadedEvent} from 'lib-admin-ui/ui/uploader/UploadedEvent';
import {UploadFailedEvent} from 'lib-admin-ui/ui/uploader/UploadFailedEvent';
import {OverrideNativeDialog} from './OverrideNativeDialog';
import {HtmlAreaModalDialogConfig, ModalDialogFormItemBuilder} from './ModalDialog';
import {MediaTreeSelectorItem} from '../../selector/media/MediaTreeSelectorItem';
import {MediaSelectorDisplayValue} from '../../selector/media/MediaSelectorDisplayValue';
import {ContentComboBox} from '../../selector/ContentComboBox';
import {MediaUploaderEl, MediaUploaderElOperation} from '../../upload/MediaUploaderEl';
import {ContentSummaryOptionDataLoader, ContentSummaryOptionDataLoaderBuilder} from '../../selector/ContentSummaryOptionDataLoader';
import {ContentTreeSelectorItem} from '../../../../item/ContentTreeSelectorItem';
import {Content} from '../../../../content/Content';
import {Site} from '../../../../content/Site';
import {GetNearestSiteRequest} from '../../../../resource/GetNearestSiteRequest';
import {Action} from 'lib-admin-ui/ui/Action';
import {FormInputEl} from 'lib-admin-ui/dom/FormInputEl';
import {Checkbox, InputAlignment} from 'lib-admin-ui/ui/Checkbox';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {NavigatedDeckPanel} from 'lib-admin-ui/ui/panel/NavigatedDeckPanel';
import {TabBarItem} from 'lib-admin-ui/ui/tab/TabBarItem';
import {InputEl} from 'lib-admin-ui/dom/InputEl';
import eventInfo = CKEDITOR.eventInfo;

export interface LinkModalDialogConfig
    extends HtmlAreaModalDialogConfig {
    contentId: ContentId;
}

export class LinkModalDialog
    extends OverrideNativeDialog {

    private dockedPanel: DockedPanel;
    private link: string;
    private textFormItem: FormItem;
    private toolTipFormItem: FormItem;

    private contentId: ContentId;
    private parentSitePath: string;

    private tabNames: any;

    protected config: LinkModalDialogConfig;

    private static contentPrefix: string = 'content://';
    private static downloadPrefix: string = 'media://download/';
    private static emailPrefix: string = 'mailto:';
    private static anchorPrefix: string = '#';

    constructor(config: eventInfo, content: ContentSummary) {
        super(<LinkModalDialogConfig>{
            editor: config.editor,
            dialog: config.data,
            title: i18n('dialog.link.title'),
            class: 'link-modal-dialog',
            contentId: content.getContentId(),
            allowOverflow: true,
            confirmation: {
                yesCallback: () => this.getSubmitAction().execute(),
                noCallback: () => this.close(),
            }
        });
    }

    protected initElements() {
        super.initElements();

        this.contentId = this.config.contentId;
        this.setSubmitAction(new Action(this.link ? i18n('action.update') : i18n('action.insert')));
    }

    protected initListeners() {
        super.initListeners();

        this.submitAction.onExecuted(() => {
            if (this.validate()) {
                this.updateOriginalDialogInputValues();
                this.ckeOriginalDialog.getButton('ok').click();
                this.close();
            }
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addAction(this.submitAction);
            this.addCancelButtonToBottom();

            return new GetNearestSiteRequest(this.contentId).sendAndParse().then((parentSite: Site) => {
                    if (parentSite) {
                        this.parentSitePath = parentSite.getPath().toString();
                    }

                    this.appendChildToContentPanel(this.dockedPanel = this.createDockedPanel());

                    if (this.isNothingSelected()) {
                        this.setElementToFocusOnShow(this.textFormItem.getInput());
                    } else if (this.isOnlyTextSelected()) {
                        this.setElementToFocusOnShow((<TextInput>this.getFieldById('url')));
                    } else {
                        this.setElementToFocusOnShow((<TextInput>this.getFieldById('url')));
                        this.textFormItem.hide();
                        this.textFormItem.removeValidator();
                    }

                    return rendered;
                }
            );
        });
    }

    private isNothingSelected(): boolean {
        const selection = this.getEditor().getSelection();
        const selectedElement: CKEDITOR.dom.element = selection.getSelectedElement();
        const selectedText = selection.getSelectedText();

        return (!selectedElement && selectedText === '');
    }

    private isOnlyTextSelected(): boolean {
        const selectedElement: CKEDITOR.dom.element = this.getEditor().getSelection().getSelectedElement();

        if (!selectedElement) {
            return true;
        }

        if (selectedElement.is('a')) {
            return true;
        }

        return false;
    }

    private getAnchors(): any[] {
        const anchors: any[] = CKEDITOR.plugins.link.getEditorAnchors(this.getEditor())
            .filter((anchor: any) => !!anchor.id) // filter anchors with missing id's
            .map((anchor: any) => anchor.id)
            .filter((item, pos, self) => self.indexOf(item) === pos); // filter duplicates cke returns;

        return anchors;
    }

    protected setDialogInputValues() {
        switch (this.getOriginalLinkTypeElem().getValue()) {
        case 'email':
            this.link = LinkModalDialog.emailPrefix + this.getOriginalEmailElem().getValue();
            break;
        case 'anchor':
            this.link = LinkModalDialog.anchorPrefix + this.getOriginalAnchorElem().getValue();
            break;
        default:
            const val = this.getOriginalUrlElem().getValue();
            const protocol: string = this.getOriginalProtocolElem().getValue();
            this.link = StringHelper.isEmpty(val) ? StringHelper.EMPTY_STRING : protocol +
                                                                                this.getOriginalUrlElem().getValue();
        }
    }

    private isContentLink(): boolean {
        return this.link.indexOf(LinkModalDialog.contentPrefix) === 0;
    }

    private isDownloadLink(): boolean {
        return this.link.indexOf(LinkModalDialog.downloadPrefix) === 0;
    }

    private isUrl(): boolean {
        return this.link ? !(this.isContentLink() || this.isDownloadLink() || this.isEmail()) : false;
    }

    private isEmail(): boolean {
        return this.link.indexOf(LinkModalDialog.emailPrefix) === 0;
    }

    private isAnchor(): boolean {
        return this.link.indexOf(LinkModalDialog.anchorPrefix) === 0;
    }

    private getAnchor(): string {
        return this.isAnchor() ? this.link : StringHelper.EMPTY_STRING;
    }

    private createContentPanel(): Panel {
        const getContentId: Function = () => {
            if (this.link && this.isContentLink()) {
                return this.link.replace(LinkModalDialog.contentPrefix, StringHelper.EMPTY_STRING);
            }
            return StringHelper.EMPTY_STRING;
        };

        return this.createFormPanel([
            this.createSelectorFormItem('contentId', i18n('dialog.link.formitem.target'),
                this.createSelector(getContentId, this.createContentSelectorBuilder()),
                true),
            this.createTargetCheckbox('contentTarget', this.isContentLink)
        ]);
    }

    private createDownloadPanel(): Panel {
        const getDownloadId: Function = () => {
            return this.isDownloadLink()
                   ? this.link.replace(LinkModalDialog.downloadPrefix, StringHelper.EMPTY_STRING)
                   : StringHelper.EMPTY_STRING;
        };

        return this.createFormPanel([
            this.createSelectorFormItem('downloadId', i18n('dialog.link.formitem.target'),
                this.createSelector(getDownloadId, this.createMediaSelectorBuilder()))
        ]);
    }

    private createUrlPanel(): Panel {
        const getUrl: Function = () => {
            return this.isUrl() ? this.link : StringHelper.EMPTY_STRING;
        };

        return this.createFormPanel([
            this.createFormItemWithPostponedValue('url', i18n('dialog.link.formitem.url'), getUrl,
                LinkModalDialog.validationRequiredUrl, 'https://example.com/mypage'),
            this.createTargetCheckbox('urlTarget', this.isUrl)
        ]);
    }

    private createEmailPanel(): Panel {
        const getEmail: Function = () => {
            if (!this.isEmail()) {
                return StringHelper.EMPTY_STRING;
            }

            return this.link.replace(LinkModalDialog.emailPrefix, StringHelper.EMPTY_STRING);
        };

        const getSubject: Function = () => {
            return this.getOriginalSubjElem().getValue();
        };

        const emailFormItem: FormItem = this.createFormItemWithPostponedValue('email', i18n('dialog.link.formitem.email'), getEmail,
            LinkModalDialog.validationRequiredEmail);

        emailFormItem.getLabel().addClass('required');

        return this.createFormPanel([
            emailFormItem,
            this.createFormItemWithPostponedValue('subject', i18n('dialog.link.formitem.subject'), getSubject)
        ]);
    }

    private createAnchorPanel(anchorList: string[]): Panel {
        return this.createFormPanel([
            this.createAnchorDropdown(anchorList)
        ]);
    }

    private createAnchorDropdown(anchorList: string[]): FormItem {
        const dropDown = new Dropdown<string>('anchor', <DropdownConfig<string>>{});

        anchorList.forEach((anchor: string) => {
            dropDown.addOption(Option.create<string>()
                .setValue(LinkModalDialog.anchorPrefix + anchor)
                .setDisplayValue(anchor)
                .build());
        });

        if (this.getAnchor()) {
            dropDown.setValue(this.getAnchor());
        }

        const formItemBuilder = new ModalDialogFormItemBuilder('anchor', i18n('dialog.link.tabname.anchor')).setValidator(
            Validators.required).setInputEl(dropDown);

        return this.createFormItem(formItemBuilder);
    }

    private static validationRequiredEmail(input: FormInputEl): string {
        return Validators.required(input) || Validators.validEmail(input);
    }

    private static validationRequiredUrl(input: FormInputEl): string {
        return Validators.required(input) || Validators.validUrl(input);
    }

    private getTarget(isTabSelected: boolean): boolean {
        return isTabSelected ? this.getOriginalTargetElem().getValue() === '_blank' : false;
    }

    private createTargetCheckbox(id: string, isTabSelectedFn: Function): FormItem {
        const checkbox = Checkbox.create().setLabelText(i18n('dialog.link.formitem.openinnewtab')).setInputAlignment(
            InputAlignment.LEFT).build();

        checkbox.setChecked(this.getTarget(isTabSelectedFn.call(this)));

        const formItemBuilder = new ModalDialogFormItemBuilder(id).setInputEl(checkbox);
        return this.createFormItem(formItemBuilder);
    }

    protected getMainFormItems(): FormItem [] {
        const getLinkText: Function = () => {
            return <string>this.ckeOriginalDialog.getValueOf('info', 'linkDisplayText');
        };

        const getTooltip: Function = () => {
            return this.getOriginalTitleElem().getValue();
        };

        this.textFormItem =
            this.createFormItemWithPostponedValue('linkText', i18n('dialog.link.formitem.text'), getLinkText, Validators.required);
        this.toolTipFormItem = this.createFormItemWithPostponedValue('toolTip', i18n('dialog.link.formitem.tooltip'), getTooltip);

        return [this.textFormItem, this.toolTipFormItem];
    }

    private createDockedPanel(): DockedPanel {
        this.initTabNames();

        const dockedPanel = new DockedPanel();
        dockedPanel.addItem(this.tabNames.url, true, this.createUrlPanel());
        dockedPanel.addItem(this.tabNames.content, true, this.createContentPanel());
        dockedPanel.addItem(this.tabNames.download, true, this.createDownloadPanel());
        dockedPanel.addItem(this.tabNames.email, true, this.createEmailPanel());

        const anchors: any[] = this.getAnchors();

        if (anchors.length > 0) {
            dockedPanel.addItem(this.tabNames.anchor, true, this.createAnchorPanel(anchors), this.isAnchor());
        }

        dockedPanel.getDeck().getPanels().forEach((panel, index) => {
            if ((index === 1 && this.isContentLink()) ||
                (index === 2 && this.isDownloadLink()) ||
                (index === 3 && this.isEmail()) ||
                (index === 4 && this.isAnchor())) {
                dockedPanel.selectPanel(panel);
                return false;
            }
        });

        return dockedPanel;
    }

    private initTabNames() {
        this.tabNames = {
            url: i18n('dialog.link.tabname.url'),
            content: i18n('dialog.link.tabname.content'),
            download: i18n('dialog.link.tabname.download'),
            email: i18n('dialog.link.tabname.email'),
            anchor: i18n('dialog.link.tabname.anchor')
        };
    }

    private createSelector( getValueFn: Function,
                            loaderBuilder: ContentSummaryOptionDataLoaderBuilder
                            ): ContentComboBox<ContentTreeSelectorItem> {
        const selector = ContentComboBox.create()
            .setTreegridDropdownEnabled(true)
            .setShowStatus(true)
            .setMaximumOccurrences(1)
            .setLoader(loaderBuilder.setLoadStatus(true).build())
            .build();

        selector.setValue(getValueFn.call(this));

        return selector;
    }

    private createMediaSelectorBuilder(): ContentSummaryOptionDataLoaderBuilder {
        return ContentSummaryOptionDataLoader
            .create()
            .setAllowedContentPaths(['*'])
            .setContentTypeNames(ContentTypeName.getMediaTypes().map(name => name.toString()));
    }

    private createContentSelectorBuilder(): ContentSummaryOptionDataLoaderBuilder {
        return ContentSummaryOptionDataLoader
            .create()
            .setAllowedContentPaths([this.parentSitePath || '']);
    }

    private createSelectorFormItem(id: string, label: string, contentSelector: ContentComboBox<ContentTreeSelectorItem>,
                                   addValueValidation: boolean = false): FormItem {

        const formItemBuilder = new ModalDialogFormItemBuilder(id, label).setValidator(Validators.required).setInputEl(contentSelector);
        const formItem = this.createFormItem(formItemBuilder);

        const mediaUploader = this.createMediaUploader(contentSelector);
        mediaUploader.insertAfterEl(contentSelector);

        if (!addValueValidation) {
            return formItem;
        }

        contentSelector.onValueChanged((event) => {
            if (contentSelector.getLoader().isLoaded()) {

                if (!event.getNewValue()) {
                    formItem.setValidator(Validators.required);
                }
            }
        });

        return formItem;
    }

    private createMediaUploader(contentSelector: ContentComboBox<ContentTreeSelectorItem>): MediaUploaderEl {
        const mediaUploader = new MediaUploaderEl({
            params: {
                parent: this.contentId.toString()
            },
            operation: MediaUploaderElOperation.create,
            name: 'media-selector-upload-el',
            showCancel: false,
            showResult: false,
            allowMultiSelection: false
        });

        mediaUploader.onUploadStarted((event: UploadStartedEvent<Content>) => {
            event.getUploadItems().forEach((uploadItem: UploadItem<Content>) => {
                const value = new MediaTreeSelectorItem(null).setDisplayValue(
                    MediaSelectorDisplayValue.fromUploadItem(uploadItem));

                const option = Option.create<MediaTreeSelectorItem>()
                        .setValue(value.getId())
                        .setDisplayValue(value)
                        .build();
                contentSelector.selectOption(option);
            });
        });

        mediaUploader.onFileUploaded((event: UploadedEvent<Content>) => {
            let item = event.getUploadItem();
            let createdContent = item.getModel();

            let selectedOption = contentSelector.getSelectedOptionView().getById(item.getId());
            let option = selectedOption.getOption();
            option.setDisplayValue(new MediaTreeSelectorItem(createdContent));
            option.setValue(createdContent.getContentId().toString());

            selectedOption.getOptionView().setOption(option);
        });

        mediaUploader.onUploadFailed((event: UploadFailedEvent<Content>) => {
            let item = event.getUploadItem();

            let selectedOption = contentSelector.getSelectedOptionView().getById(item.getId());
            if (!!selectedOption) {
                (<BaseSelectedOptionsView<ContentTreeSelectorItem>>contentSelector.getSelectedOptionView()).removeOption(
                    selectedOption.getOption());
            }
        });

        this.onDragEnter((event: DragEvent) => {
            event.stopPropagation();
            mediaUploader.giveFocus();
            mediaUploader.setDefaultDropzoneVisible(true, true);
        });

        mediaUploader.onDropzoneDragLeave(() => {
            mediaUploader.giveBlur();
            mediaUploader.setDefaultDropzoneVisible(false);
        });

        mediaUploader.onDropzoneDrop(() => {
            mediaUploader.setDefaultDropzoneVisible(false);
        });

        contentSelector.getComboBox().onHidden(() => {
            mediaUploader.hide();
        });
        contentSelector.getComboBox().onShown(() => {
            mediaUploader.show();
        });

        return mediaUploader;
    }

    private validateDockPanel(): boolean {
        const form = <Form>this.dockedPanel.getDeck().getPanelShown().getFirstChild();

        return form.validate(true).isValid();
    }

    protected validate(): boolean {
        const mainFormValid = super.validate();
        const dockPanelValid = this.validateDockPanel();

        return mainFormValid && dockPanelValid;
    }

    private createContentLink() {
        const contentSelectorValue: string = (<ContentComboBox<ContentTreeSelectorItem>>this.getFieldById(
            'contentId')).getValue();
        const isOpenInNewTab: boolean = (<Checkbox>this.getFieldById('contentTarget')).isChecked();
        const url: string = LinkModalDialog.contentPrefix + contentSelectorValue;
        const target: string = isOpenInNewTab ? '_blank' : '';

        this.getOriginalLinkTypeElem().setValue('url', false);
        this.getOriginalTargetElem().setValue(target, false);
        this.getOriginalProtocolElem().setValue('', false);
        this.getOriginalUrlElem().setValue(url, false);
    }

    private createDownloadLink() {
        const contentSelectorValue: string = (<ContentComboBox<ContentTreeSelectorItem>>this.getFieldById(
            'downloadId')).getValue();
        const url: string = LinkModalDialog.downloadPrefix + contentSelectorValue;

        this.getOriginalLinkTypeElem().setValue('url', false);
        this.getOriginalProtocolElem().setValue('', false);
        this.getOriginalUrlElem().setValue(url, false);
    }

    private createUrlLink() {
        const url: string = (<TextInput>this.getFieldById('url')).getValue();
        const isOpenInNewTab: boolean = (<Checkbox>this.getFieldById('urlTarget')).isChecked();
        const target: string = isOpenInNewTab ? '_blank' : '';

        this.getOriginalLinkTypeElem().setValue('url', false);
        this.getOriginalTargetElem().setValue(target, false);
        this.getOriginalUrlElem().setValue(url, false);
    }

    private createEmailLink() {
        const email = (<TextInput>this.getFieldById('email')).getValue();
        const subject = (<TextInput>this.getFieldById('subject')).getValue();

        this.getOriginalLinkTypeElem().setValue('email', false);
        this.getOriginalEmailElem().setValue(email, false);
        this.getOriginalSubjElem().setValue(subject, false);
    }

    private createAnchor() {
        const anchorName = (<TextInput>this.getFieldById('anchor')).getValue().replace(LinkModalDialog.anchorPrefix,
            StringHelper.EMPTY_STRING);

        this.getOriginalLinkTypeElem().setValue('anchor', false);
        this.getOriginalAnchorElem().setValue(anchorName, false);
    }

    private updateOriginalDialogInputValues(): void {
        const deck = <NavigatedDeckPanel>this.dockedPanel.getDeck();
        const selectedTab = <TabBarItem>deck.getSelectedNavigationItem();
        const linkText: string = (<TextInput>this.getFieldById('linkText')).getValue().trim();
        const toolTip: string = (<TextInput>this.getFieldById('toolTip')).getValue().trim();

        this.ckeOriginalDialog.setValueOf('info', 'linkDisplayText', linkText);
        this.getOriginalTitleElem().setValue(toolTip, false);

        switch (selectedTab.getLabel()) {
        case (this.tabNames.content):
            this.createContentLink();
            break;
        case (this.tabNames.url):
            this.createUrlLink();
            break;
        case (this.tabNames.download):
            this.createDownloadLink();
            break;
        case (this.tabNames.email):
            this.createEmailLink();
            break;
        case (this.tabNames.anchor):
            this.createAnchor();
            break;
        }
    }

    private getOriginalLinkTypeElem(): CKEDITOR.ui.dialog.uiElement {
        return this.getElemFromOriginalDialog('info', 'linkType');
    }

    private getOriginalTargetElem(): CKEDITOR.ui.dialog.uiElement {
        return this.getElemFromOriginalDialog('target', 'linkTargetType');
    }

    private getOriginalUrlElem(): CKEDITOR.ui.dialog.uiElement {
        return (<any>this.getElemFromOriginalDialog('info', 'urlOptions')).getChild([0, 1]);
    }

    private getOriginalEmailElem(): CKEDITOR.ui.dialog.uiElement {
        return (<any>this.getElemFromOriginalDialog('info', 'emailOptions')).getChild(0);
    }

    private getOriginalSubjElem(): CKEDITOR.ui.dialog.uiElement {
        return (<any>this.getElemFromOriginalDialog('info', 'emailOptions')).getChild(1);
    }

    private getOriginalTitleElem(): CKEDITOR.ui.dialog.uiElement {
        return this.getElemFromOriginalDialog('advanced', 'advTitle');
    }

    private getOriginalAnchorElem(): CKEDITOR.ui.dialog.uiElement {
        return (<any>this.getElemFromOriginalDialog('info', 'anchorOptions')).getChild([0, 0, 0]);
    }

    private getOriginalProtocolElem(): CKEDITOR.ui.dialog.uiElement {
        return (<any>this.getElemFromOriginalDialog('info', 'urlOptions')).getChild([0, 0]);
    }

    private createFormItemWithPostponedValue(id: string, label: string, getValueFn: Function,
                                             validator?: (input: FormInputEl) => string, placeholder?: string): FormItem {

        const formItemBuilder = new ModalDialogFormItemBuilder(id, label);

        if (validator) {
            formItemBuilder.setValidator(validator);
        }

        if (placeholder) {
            formItemBuilder.setPlaceholder(placeholder);
        }

        const formItem = this.createFormItem(formItemBuilder);

        (<InputEl>formItem.getInput()).setValue(getValueFn.call(this));

        return formItem;
    }

    isDirty(): boolean {
        return (<TextInput>this.textFormItem.getInput()).isDirty() || (<TextInput>this.toolTipFormItem.getInput()).isDirty() ||
               AppHelper.isDirty(this.dockedPanel);
    }
}
