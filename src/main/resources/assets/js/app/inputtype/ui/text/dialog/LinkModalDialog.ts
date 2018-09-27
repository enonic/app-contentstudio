import Form = api.ui.form.Form;
import FormItem = api.ui.form.FormItem;
import Panel = api.ui.panel.Panel;
import DockedPanel = api.ui.panel.DockedPanel;
import Validators = api.ui.form.Validators;
import InputAlignment = api.ui.InputAlignment;
import TextInput = api.ui.text.TextInput;
import Dropdown = api.ui.selector.dropdown.Dropdown;
import DropdownConfig = api.ui.selector.dropdown.DropdownConfig;
import Option = api.ui.selector.Option;
import i18n = api.util.i18n;
import ContentTreeSelectorItem = api.content.resource.ContentTreeSelectorItem;
import eventInfo = CKEDITOR.eventInfo;
import MediaUploaderEl = api.ui.uploader.MediaUploaderEl;
import FileUploadedEvent = api.ui.uploader.FileUploadedEvent;
import FileUploadStartedEvent = api.ui.uploader.FileUploadStartedEvent;
import UploadItem = api.ui.uploader.UploadItem;
import MediaSelectorDisplayValue = api.content.media.MediaSelectorDisplayValue;
import MediaTreeSelectorItem = api.content.media.MediaTreeSelectorItem;
import ContentSummary = api.content.ContentSummary;
import FileUploadFailedEvent = api.ui.uploader.FileUploadFailedEvent;
import BaseSelectedOptionsView = api.ui.selector.combobox.BaseSelectedOptionsView;
import ContentComboBox = api.content.ContentComboBox;
import ContentId = api.content.ContentId;
import Content = api.content.Content;
import AppHelper = api.util.AppHelper;
import {OverrideNativeDialog} from './OverrideNativeDialog';
import {HtmlAreaModalDialogConfig, ModalDialogFormItemBuilder} from './ModalDialog';
import {ImageModalDialogConfig} from './ImageModalDialog';

export class LinkModalDialog
    extends OverrideNativeDialog {

    private dockedPanel: DockedPanel;
    private link: string;
    private textFormItem: FormItem;
    private toolTipFormItem: FormItem;

    private contentId: ContentId;

    private tabNames: any;

    private static contentPrefix: string = 'content://';
    private static downloadPrefix: string = 'media://download/';
    private static emailPrefix: string = 'mailto:';
    private static anchorPrefix: string = '#';

    constructor(config: eventInfo, content: ContentSummary) {
        super(<HtmlAreaModalDialogConfig>{
            editor: config.editor,
            dialog: config.data,
            title: i18n('dialog.link.title'),
            cls: 'link-modal-dialog',
            content: content,
            confirmation: {
                yesCallback: () => this.getSubmitAction().execute(),
                noCallback: () => this.close(),
            }
        });

        this.createAnchorPanelIfNeeded();

        if (this.isOnlyTextSelected()) {
            this.setFirstFocusField(this.textFormItem.getInput());
        } else {
            this.setFirstFocusField(this.toolTipFormItem.getInput());
            this.textFormItem.hide();
            this.textFormItem.removeValidator();
        }
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

    protected initializeConfig(params: ImageModalDialogConfig) {
        super.initializeConfig(params);
        this.contentId = params.content.getContentId();
    }

    private createAnchorPanelIfNeeded() {
        const anchors: any[] = CKEDITOR.plugins.link.getEditorAnchors(this.getEditor())
            .filter((anchor: any) => !!anchor.id) // filter anchors with missing id's
            .map((anchor: any) => anchor.id)
            .filter((item, pos, self) => self.indexOf(item) === pos); // filter duplicates cke returns;

        if (anchors.length > 0) {
            this.dockedPanel.addItem(this.tabNames.anchor, true, this.createAnchorPanel(anchors), this.isAnchor());
        }
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
            this.link = api.util.StringHelper.isEmpty(val) ? api.util.StringHelper.EMPTY_STRING : protocol +
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
        return this.isAnchor() ? this.link : api.util.StringHelper.EMPTY_STRING;
    }

    protected layout() {
        super.layout();
        this.appendChildToContentPanel(this.dockedPanel = this.createDockedPanel());
    }

    private createContentPanel(): Panel {
        const getContentId: Function = () => {
            if (this.link && this.isContentLink()) {
                return this.link.replace(LinkModalDialog.contentPrefix, api.util.StringHelper.EMPTY_STRING);
            }
            return api.util.StringHelper.EMPTY_STRING;
        };

        return this.createFormPanel([
            this.createSelectorFormItem('contentId', i18n('dialog.link.formitem.target'), this.createContentSelector(getContentId),
                true),
            this.createTargetCheckbox('contentTarget', this.isContentLink)
        ]);
    }

    private createDownloadPanel(): Panel {
        const getDownloadId: Function = () => {
            return this.isDownloadLink()
                   ? this.link.replace(LinkModalDialog.downloadPrefix, api.util.StringHelper.EMPTY_STRING)
                   : api.util.StringHelper.EMPTY_STRING;
        };

        return this.createFormPanel([
            this.createSelectorFormItem('downloadId', i18n('dialog.link.formitem.target'),
                this.createContentSelector(getDownloadId, api.schema.content.ContentTypeName.getMediaTypes()))
        ]);
    }

    private createUrlPanel(): Panel {
        const getUrl: Function = () => {
            return this.isUrl() ? this.link : api.util.StringHelper.EMPTY_STRING;
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
                return api.util.StringHelper.EMPTY_STRING;
            }

            return this.link.replace(LinkModalDialog.emailPrefix, api.util.StringHelper.EMPTY_STRING);
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
            dropDown.addOption(<Option<string>>{value: LinkModalDialog.anchorPrefix + anchor, displayValue: anchor});
        });

        if (this.getAnchor()) {
            dropDown.setValue(this.getAnchor());
        }

        const formItemBuilder = new ModalDialogFormItemBuilder('anchor', i18n('dialog.link.tabname.anchor')).setValidator(
            Validators.required).setInputEl(dropDown);

        return this.createFormItem(formItemBuilder);
    }

    private static validationRequiredEmail(input: api.dom.FormInputEl): string {
        return Validators.required(input) || Validators.validEmail(input);
    }

    private static validationRequiredUrl(input: api.dom.FormInputEl): string {
        return Validators.required(input) || Validators.validUrl(input);
    }

    private getTarget(isTabSelected: boolean): boolean {
        return isTabSelected ? this.getOriginalTargetElem().getValue() === '_blank' : false;
    }

    private createTargetCheckbox(id: string, isTabSelectedFn: Function): FormItem {
        const checkbox = api.ui.Checkbox.create().setLabelText(i18n('dialog.link.formitem.openinnewtab')).setInputAlignment(
            InputAlignment.RIGHT).build();

        this.onAdded(() => {
            checkbox.setChecked(this.getTarget(isTabSelectedFn.call(this)));
        });

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

        this.onAdded(() => {
            dockedPanel.getDeck().getPanels().forEach((panel, index) => {
                if ((index === 1 && this.isContentLink()) ||
                    (index === 2 && this.isDownloadLink()) ||
                    (index === 3 && this.isEmail()) ||
                    (index === 4 && this.isAnchor())) {
                    dockedPanel.selectPanel(panel);
                    return false;
                }
            });
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

    protected initializeActions() {
        const submitAction = new api.ui.Action(this.link ? i18n('action.update') : i18n('action.insert'));
        this.setSubmitAction(submitAction);

        this.addAction(submitAction.onExecuted(() => {
            if (this.validate()) {
                this.updateOriginalDialogInputValues();
                this.ckeOriginalDialog.getButton('ok').click();
                this.close();
            }
        }));

        super.initializeActions();
    }

    private createContentSelector(getValueFn: Function, contentTypeNames?: api.schema.content.ContentTypeName[]) {
        const loaderBuilder = api.content.ContentSummaryOptionDataLoader.create();

        if (contentTypeNames) {
            loaderBuilder.setContentTypeNames(contentTypeNames.map(name => name.toString()));
        }

        const contentSelector = api.content.ContentComboBox.create().setLoader(loaderBuilder.build()).setMaximumOccurrences(1).build();

        this.onAdded(() => {
            contentSelector.setValue(getValueFn.call(this));
        });

        return contentSelector;
    }

    private createSelectorFormItem(id: string, label: string, contentSelector: api.content.ContentComboBox<ContentTreeSelectorItem>,
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
            operation: api.ui.uploader.MediaUploaderElOperation.create,
            name: 'media-selector-upload-el',
            showCancel: false,
            showResult: false,
            maximumOccurrences: 1,
            allowMultiSelection: false
        });

        mediaUploader.onUploadStarted((event: FileUploadStartedEvent<Content>) => {
            event.getUploadItems().forEach((uploadItem: UploadItem<Content>) => {
                const value = new MediaTreeSelectorItem(null).setDisplayValue(
                    MediaSelectorDisplayValue.fromUploadItem(uploadItem));

                const option = <api.ui.selector.Option<MediaTreeSelectorItem>>{
                    value: value.getId(),
                    displayValue: value
                };
                contentSelector.selectOption(option);
            });
        });

        mediaUploader.onFileUploaded((event: FileUploadedEvent<Content>) => {
            let item = event.getUploadItem();
            let createdContent = item.getModel();

            let selectedOption = contentSelector.getSelectedOptionView().getById(item.getId());
            let option = selectedOption.getOption();
            option.displayValue = new MediaTreeSelectorItem(createdContent);
            option.value = createdContent.getContentId().toString();

            selectedOption.getOptionView().setOption(option);
        });

        mediaUploader.onUploadFailed((event: FileUploadFailedEvent<Content>) => {
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
        const contentSelectorValue: string = (<api.content.ContentComboBox<ContentTreeSelectorItem>>this.getFieldById(
            'contentId')).getValue();
        const isOpenInNewTab: boolean = (<api.ui.Checkbox>this.getFieldById('contentTarget')).isChecked();
        const url: string = LinkModalDialog.contentPrefix + contentSelectorValue;
        const target: string = isOpenInNewTab ? '_blank' : '';

        this.getOriginalLinkTypeElem().setValue('url', false);
        this.getOriginalTargetElem().setValue(target, false);
        this.getOriginalProtocolElem().setValue('', false);
        this.getOriginalUrlElem().setValue(url, false);
    }

    private createDownloadLink() {
        const contentSelectorValue: string = (<api.content.ContentComboBox<ContentTreeSelectorItem>>this.getFieldById(
            'downloadId')).getValue();
        const url: string = LinkModalDialog.downloadPrefix + contentSelectorValue;

        this.getOriginalLinkTypeElem().setValue('url', false);
        this.getOriginalProtocolElem().setValue('', false);
        this.getOriginalUrlElem().setValue(url, false);
    }

    private createUrlLink() {
        const url: string = (<api.ui.text.TextInput>this.getFieldById('url')).getValue();
        const isOpenInNewTab: boolean = (<api.ui.Checkbox>this.getFieldById('urlTarget')).isChecked();
        const target: string = isOpenInNewTab ? '_blank' : '';

        this.getOriginalLinkTypeElem().setValue('url', false);
        this.getOriginalTargetElem().setValue(target, false);
        this.getOriginalUrlElem().setValue(url, false);
    }

    private createEmailLink() {
        const email = (<api.ui.text.TextInput>this.getFieldById('email')).getValue();
        const subject = (<api.ui.text.TextInput>this.getFieldById('subject')).getValue();

        this.getOriginalLinkTypeElem().setValue('email', false);
        this.getOriginalEmailElem().setValue(email, false);
        this.getOriginalSubjElem().setValue(subject, false);
    }

    private createAnchor() {
        const anchorName = (<api.ui.text.TextInput>this.getFieldById('anchor')).getValue().replace(LinkModalDialog.anchorPrefix,
            api.util.StringHelper.EMPTY_STRING);

        this.getOriginalLinkTypeElem().setValue('anchor', false);
        this.getOriginalAnchorElem().setValue(anchorName, false);
    }

    private updateOriginalDialogInputValues(): void {
        const deck = <api.ui.panel.NavigatedDeckPanel>this.dockedPanel.getDeck();
        const selectedTab = <api.ui.tab.TabBarItem>deck.getSelectedNavigationItem();
        const linkText: string = (<api.ui.text.TextInput>this.getFieldById('linkText')).getValue().trim();
        const toolTip: string = (<api.ui.text.TextInput>this.getFieldById('toolTip')).getValue().trim();

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

    protected createFormItemWithPostponedValue(id: string, label: string, getValueFn: Function,
                                               validator?: (input: api.dom.FormInputEl) => string, placeholder?: string): FormItem {

        const formItemBuilder = new ModalDialogFormItemBuilder(id, label);

        if (validator) {
            formItemBuilder.setValidator(validator);
        }

        if (placeholder) {
            formItemBuilder.setPlaceholder(placeholder);
        }

        const formItem = this.createFormItem(formItemBuilder);

        this.onAdded(() => {
            (<api.dom.InputEl>formItem.getInput()).setValue(getValueFn.call(this));
        });

        return formItem;
    }

    isDirty(): boolean {
        return (<TextInput>this.textFormItem.getInput()).isDirty() || (<TextInput>this.toolTipFormItem.getInput()).isDirty() ||
               AppHelper.isDirty(this.dockedPanel);
    }
}
