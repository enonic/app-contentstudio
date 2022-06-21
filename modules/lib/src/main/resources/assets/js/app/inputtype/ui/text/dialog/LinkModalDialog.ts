import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {Form} from '@enonic/lib-admin-ui/ui/form/Form';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {DockedPanel} from '@enonic/lib-admin-ui/ui/panel/DockedPanel';
import {Validators} from '@enonic/lib-admin-ui/ui/form/Validators';
import {TextInput} from '@enonic/lib-admin-ui/ui/text/TextInput';
import {Dropdown, DropdownConfig} from '@enonic/lib-admin-ui/ui/selector/dropdown/Dropdown';
import {UploadItem} from '@enonic/lib-admin-ui/ui/uploader/UploadItem';
import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {UploadStartedEvent} from '@enonic/lib-admin-ui/ui/uploader/UploadStartedEvent';
import {UploadedEvent} from '@enonic/lib-admin-ui/ui/uploader/UploadedEvent';
import {UploadFailedEvent} from '@enonic/lib-admin-ui/ui/uploader/UploadFailedEvent';
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
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {FormInputEl} from '@enonic/lib-admin-ui/dom/FormInputEl';
import {Checkbox, InputAlignment} from '@enonic/lib-admin-ui/ui/Checkbox';
import {NavigatedDeckPanel} from '@enonic/lib-admin-ui/ui/panel/NavigatedDeckPanel';
import {TabBarItem} from '@enonic/lib-admin-ui/ui/tab/TabBarItem';
import {InputEl} from '@enonic/lib-admin-ui/dom/InputEl';
import {ContentSummary} from '../../../../content/ContentSummary';
import {ContentId} from '../../../../content/ContentId';
import {RadioGroup} from '@enonic/lib-admin-ui/ui/RadioGroup';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import {MenuButton} from '@enonic/lib-admin-ui/ui/button/MenuButton';
import {FormItemEl} from '@enonic/lib-admin-ui/dom/FormItemEl';

import eventInfo = CKEDITOR.eventInfo;

export interface LinkModalDialogConfig
    extends HtmlAreaModalDialogConfig {
    contentId: ContentId;
}

enum MediaContentRadioAction {
    OPEN = '1', DOWNLOAD = '2', LINK = '3'
}

interface UrlProtocol {
    title: string,
    prefix: string,
    validator: (input: FormItemEl) => string
}

export class LinkModalDialog
    extends OverrideNativeDialog {

    private dockedPanel: DockedPanel;
    private link: string;
    private textFormItem: FormItem;
    private toolTipFormItem: FormItem;
    private mediaOptionRadioFormItem: FormItem;
    private protocolsDropdownButton: MenuButton;

    private contentId: ContentId;
    private parentSitePath: string;

    private tabNames: any;

    protected config: LinkModalDialogConfig;

    private static contentPrefix: string = 'content://';
    private static mediaDownloadPrefix: string = 'media://download/';
    private static mediaInlinePrefix: string = 'media://inline/';
    private static emailPrefix: string = 'mailto:';
    private static anchorPrefix: string = '#';

    private readonly urlProtocols: UrlProtocol[];

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

        this.urlProtocols = [
            {title: 'Https', prefix: 'https://', validator: LinkModalDialog.validationRequiredUrl},
            {title: 'Http', prefix: 'http://', validator: LinkModalDialog.validationRequiredUrl},
            {title: 'Ftp', prefix: 'ftp://', validator: LinkModalDialog.validationRequiredUrl},
            {title: i18n('dialog.link.urlprotocols.relative'), prefix: '', validator: LinkModalDialog.validationRequiredUrl}
        ];
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
        default: {
            const val = this.getOriginalUrlElem().getValue();
            const protocol: string = this.getOriginalProtocolElem().getValue();
            this.link = StringHelper.isEmpty(val) ?
                        StringHelper.EMPTY_STRING :
                        protocol + this.getOriginalUrlElem().getValue();
        }
        }
    }

    private isContentLink(): boolean {
        return this.isInlineLink() || this.isDownloadLink() || this.link.indexOf(LinkModalDialog.contentPrefix) === 0;
    }

    private isInlineLink(): boolean {
        return this.link.indexOf(LinkModalDialog.mediaInlinePrefix) === 0;
    }

    private isDownloadLink(): boolean {
        return this.link.indexOf(LinkModalDialog.mediaDownloadPrefix) === 0;
    }

    private isUrl(): boolean {
        return this.link ? !(this.isContentLink() || this.isEmail()) : false;
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
            if (!this.link) {
                return StringHelper.EMPTY_STRING;
            }

            if (this.isInlineLink()) {
                return this.link.replace(LinkModalDialog.mediaInlinePrefix, StringHelper.EMPTY_STRING);
            }

            if (this.isDownloadLink()) {
                return this.link.replace(LinkModalDialog.mediaDownloadPrefix, StringHelper.EMPTY_STRING);
            }

            if (this.isContentLink()) {
                return this.link.replace(LinkModalDialog.contentPrefix, StringHelper.EMPTY_STRING);
            }

            return StringHelper.EMPTY_STRING;
        };

        return this.createFormPanel([
            this.createSelectorFormItem('contentId', i18n('dialog.link.formitem.target'),
                this.createSelector(getContentId, this.createContentSelectorBuilder()),
                true),
            this.createMediaOptionRadio('contentMediaRadio'),
            this.createTargetCheckbox('contentTarget', this.isContentLink)
        ]);
    }


    private createUrlPanel(): Panel {
        const urlFormItem = this.createUrlFormItem('url', 'Link');
        const urlInput = <TextInput>urlFormItem.getInput();
        this.protocolsDropdownButton = this.createProtocolsDropdownButton(urlInput);
        urlFormItem.prependChild(this.protocolsDropdownButton);

        const urlPanel = this.createFormPanel([
            urlFormItem,
            this.createTargetCheckbox('urlTarget', this.isUrl, true)
        ]);

        urlPanel.onRendered(() => urlInput.forceChangedEvent());
        urlPanel.addClass('url-panel');

        return urlPanel;
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

    private createTargetCheckbox(id: string, isTabSelectedFn: Function, showOnCreate: boolean = false): FormItem {
        const checkbox = Checkbox.create().setLabelText(i18n('dialog.link.formitem.openinnewtab')).setInputAlignment(
            InputAlignment.LEFT).build();

        if (!showOnCreate) {
            checkbox.hide();
        }

        checkbox.setChecked(this.getTarget(isTabSelectedFn.call(this)));

        const formItemBuilder = new ModalDialogFormItemBuilder(id).setInputEl(checkbox);

        return this.createFormItem(formItemBuilder);
    }

    private createMediaOptionRadio(id: string): FormItem {
        const mediaRadio = new RadioGroup('radio');

        mediaRadio.addOption(MediaContentRadioAction.OPEN, i18n('dialog.link.radio.options.open'));
        mediaRadio.addOption(MediaContentRadioAction.DOWNLOAD, i18n('dialog.link.radio.options.download'));
        mediaRadio.addOption(MediaContentRadioAction.LINK, i18n('dialog.link.radio.options.link'));

        mediaRadio.onRendered(() => {
            if (!this.link || this.isInlineLink()) {
                mediaRadio.setValue(MediaContentRadioAction.OPEN);
            } else if (this.isDownloadLink()) {
                mediaRadio.setValue(MediaContentRadioAction.DOWNLOAD);
            } else if (this.isContentLink()) {
                mediaRadio.setValue(MediaContentRadioAction.LINK);
            }
        });

        mediaRadio.onValueChanged((event: ValueChangedEvent) => {
            const radioValue = event.getNewValue() ;
            const checkbox = <Checkbox>this.getFieldById('contentTarget');

            if (radioValue === MediaContentRadioAction.LINK) {
                checkbox.show();
            } else {
                checkbox.hide();
            }
        });

        const formItemBuilder = new ModalDialogFormItemBuilder(id, i18n('dialog.link.radio.label')).setInputEl(mediaRadio);

        this.mediaOptionRadioFormItem = this.createFormItem(formItemBuilder);
        this.mediaOptionRadioFormItem.setVisible(false);
        this.mediaOptionRadioFormItem.getLabel().addClass('required');

        return this.mediaOptionRadioFormItem;
    }

    private createUrlFormItem(textId: string, textLabel: string): FormItem {
        const getUrl = () => this.isUrl() ? this.link : '';

        const urlFormItem: FormItem = this.createFormItemWithPostponedValue(textId, textLabel, getUrl);
        const urlInput: TextInput = <TextInput>urlFormItem.getInput();
        this.initUrlInputHandlers(urlInput);

        urlFormItem.getLabel().addClass('required');

        return urlFormItem;
    }

    private initUrlInputHandlers(urlInput: TextInput) {
        urlInput.onRendered(() => {
            const urlValue = urlInput.getValue();
            const usedProtocol = this.getUsedProtocolFromValue(urlValue);
            const actionTitle = urlValue ? usedProtocol.title : 'Https';
            const action = this.protocolsDropdownButton.getMenuActions().find(action => action.getLabel() === actionTitle);
            if (action) { action.execute(); }
        });

        urlInput.onValueChanged((event: ValueChangedEvent) => {
            const urlValue = event.getNewValue();
            const usedProtocol = this.getUsedProtocolFromValue(urlValue);

            this.protocolsDropdownButton.getMenuItems().forEach(menuItem => {
                menuItem.removeClass('menu-item-selected');
                if (menuItem.getEl().getInnerHtml() === usedProtocol.title) {
                    menuItem.addClass('menu-item-selected');
                }
            });
        });
    }

    private createProtocolsDropdownButton(textInput: TextInput): MenuButton {
        const protocolsDropdownButton = new MenuButton(new Action('Type'));
        protocolsDropdownButton.addClass('menu-button-type');

        const actions = this.urlProtocols.map(({title, prefix}) => {
            const action = new Action(title);

            action.onExecuted(() => {
                const urlValue: string = textInput.getValue();
                const usedProtocol: UrlProtocol = this.getUsedProtocolFromValue(urlValue);
                const newUrlValue: string = !usedProtocol.prefix
                    ? prefix + urlValue
                    : urlValue.replace(usedProtocol.prefix, prefix);

                textInput.setValue(newUrlValue);
                textInput.updateValue();
                textInput.giveFocus();
             });

            return action;
        });

        protocolsDropdownButton.addMenuActions(actions);
        protocolsDropdownButton.addClass('transparent');
        protocolsDropdownButton.setToggleMenuOnAction(true);

        return protocolsDropdownButton;
    }

    private getUsedProtocolFromValue(value: string) {
        let usedProtocol: UrlProtocol;

        this.urlProtocols.some(protocol => {
            const valueProtocolSplit = value.split(protocol.prefix);

            if (valueProtocolSplit.length > 1 && valueProtocolSplit[0] === '') {
                usedProtocol = protocol;
                return true;
            }
        });

        if (!usedProtocol) {
            usedProtocol = this.urlProtocols.find(protocol => protocol.title === i18n('dialog.link.urlprotocols.relative'));
        }

        return usedProtocol;
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
        dockedPanel.addItem(this.tabNames.content, true, this.createContentPanel());
        dockedPanel.addItem(this.tabNames.url, true, this.createUrlPanel());
        dockedPanel.addItem(this.tabNames.email, true, this.createEmailPanel());

        const anchors: any[] = this.getAnchors();

        if (anchors.length > 0) {
            dockedPanel.addItem(this.tabNames.anchor, true, this.createAnchorPanel(anchors), this.isAnchor());
        }

        dockedPanel.getDeck().getPanels().some((panel, index) => {
            if ((index === 0 && this.isContentLink()) ||
                (index === 1 && this.isUrl()) ||
                (index === 2 && this.isEmail()) ||
                (index === 3 && this.isAnchor())) {
                dockedPanel.selectPanel(panel);
                return true;
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

    private createSelector(getValueFn: Function,
                           loaderBuilder: ContentSummaryOptionDataLoaderBuilder
    ): ContentComboBox<ContentTreeSelectorItem> {
        const selector = ContentComboBox.create()
            .setTreegridDropdownEnabled(true)
            .setMaximumOccurrences(1)
            .setLoader(loaderBuilder.build())
            .build();

        selector.setValue(getValueFn.call(this));

        return selector;
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

        const callbackFn = (selectedContent: ContentSummary) => {
            const mediaRadio = <RadioGroup>this.getFieldById('contentMediaRadio');
            const checkbox = <Checkbox>this.getFieldById('contentTarget');

            if (!selectedContent) {
                formItem.setValidator(Validators.required);
                this.mediaOptionRadioFormItem.hide();
                checkbox.hide();
                return;
            }

            if (selectedContent.getType().isDescendantOfMedia()) {
                this.mediaOptionRadioFormItem.show();
                if (mediaRadio.doGetValue() === MediaContentRadioAction.LINK) {
                    checkbox.show();
                }
            } else {
                this.mediaOptionRadioFormItem.hide();
                checkbox.show();
            }
        };

        contentSelector.onLoaded((items: ContentTreeSelectorItem[]) => {
            const selectedContent = items.length === 1 ? items[0].getContent() : undefined;
            callbackFn(selectedContent);
        });

        contentSelector.onValueChanged(() => {
            const selectedContent = contentSelector.getSelectedContent();
            callbackFn(selectedContent);
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
            mediaUploader.setDefaultDropzoneVisible(true);
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
        let isOpenInNewTab: boolean = false;
        let url: string = '';
        let target: string = '';

        const contentSelector = <ContentComboBox<ContentTreeSelectorItem>>this.getFieldById('contentId');

        const contentSelectorValue = contentSelector.getValue();
        const contentSelectorSelectedContent = contentSelector.getSelectedContent();

        const setTargetAndUrl = () => {
            isOpenInNewTab = (<Checkbox>this.getFieldById('contentTarget')).isChecked();
            target = isOpenInNewTab ? '_blank' : '';
            url = LinkModalDialog.contentPrefix + contentSelectorValue;
        };

        if (contentSelectorSelectedContent.getType().isDescendantOfMedia()) {
            switch ((<RadioGroup>this.getFieldById('contentMediaRadio')).doGetValue()) {
                case MediaContentRadioAction.OPEN:
                    url = LinkModalDialog.mediaInlinePrefix + contentSelectorValue;
                    isOpenInNewTab = true;
                    break;
                case MediaContentRadioAction.DOWNLOAD:
                    url = LinkModalDialog.mediaDownloadPrefix + contentSelectorValue;
                    break;
                case MediaContentRadioAction.LINK:
                    setTargetAndUrl();
                    break;
                default:
                    break;
            }
        } else {
            setTargetAndUrl();
        }

        this.getOriginalLinkTypeElem().setValue('url', false);
        this.getOriginalTargetElem().setValue(target, false);
        this.getOriginalProtocolElem().setValue('', false);
        this.getOriginalUrlElem().setValue(url, false);
    }


    private createUrlLink() {
        const url: string = (<TextInput>this.getFieldById('url')).getValue();
        const isOpenInNewTab: boolean = (<Checkbox>this.getFieldById('urlTarget')).isChecked();
        const target: string = isOpenInNewTab ? '_blank' : '';

        this.getOriginalLinkTypeElem().setValue('url', false);
        this.getOriginalProtocolElem().setValue('', false);
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
