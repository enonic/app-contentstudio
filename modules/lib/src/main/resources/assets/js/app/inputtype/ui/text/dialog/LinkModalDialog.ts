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
import {
    ContentSummaryOptionDataLoader,
    ContentSummaryOptionDataLoaderBuilder
} from '../../selector/ContentSummaryOptionDataLoader';
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
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ValidationResult} from '@enonic/lib-admin-ui/ui/form/ValidationResult';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import eventInfo = CKEDITOR.eventInfo;
import {Project} from '../../../../settings/data/project/Project';
import {ContentPath} from '../../../../content/ContentPath';

export interface LinkModalDialogConfig
    extends HtmlAreaModalDialogConfig {
    contentId?: ContentId;
    project?: Project;
}

enum MediaContentRadioAction {
    OPEN = '1', DOWNLOAD = '2', LINK = '3'
}

interface UrlProtocol {
    title: string,
    prefix: string,
    validator: (input: FormItemEl) => string
}

interface ContentLinkParams {
    url: string,
    target: string
}

interface FormParam {
    keyId: string,
    valueId: string
}

export class LinkModalDialog
    extends OverrideNativeDialog {

    private dockedPanel: DockedPanel;
    private link: string;
    private textFormItem: FormItem;
    private toolTipFormItem: FormItem;
    private mediaOptionRadioFormItem: FormItem;
    private contentTargetCheckBoxFormItem: FormItem;
    private urlTargetCheckboxFormItem: FormItem;
    private showAllContentCheckboxFormItem: FormItem;
    private anchorFormItem: FormItem;
    private paramsFormItem: FormItem;
    private protocolsDropdownButton: MenuButton;

    private contentId?: ContentId;
    private parentSitePath?: string;

    private tabNames: any;

    private paramsFormIds: FormParam[];

    protected config: LinkModalDialogConfig;

    private static contentPrefix: string = 'content://';
    private static mediaDownloadPrefix: string = 'media://download/';
    private static mediaInlinePrefix: string = 'media://inline/';
    private static emailPrefix: string = 'mailto:';
    private static anchorPrefix: string = '#';
    private static fragmentPrefix: string = 'fragment=';
    private static queryParamsPrefix: string = 'query=';

    private readonly urlProtocols: UrlProtocol[];

    constructor(config: eventInfo, content: ContentSummary, project?: Project) {
        super(<LinkModalDialogConfig>{
            editor: config.editor,
            dialog: config.data,
            title: i18n('dialog.link.title'),
            class: 'link-modal-dialog',
            contentId: content?.getContentId(),
            allowOverflow: true,
            project: project,
            confirmation: {
                yesCallback: () => this.getSubmitAction().execute(),
                noCallback: () => this.close(),
            }
        });

        this.urlProtocols = [
            {title: 'Https', prefix: 'https://', validator: LinkModalDialog.validationRequiredUrl},
            {title: 'Http', prefix: 'http://', validator: LinkModalDialog.validationRequiredUrl},
            {title: 'Ftp', prefix: 'ftp://', validator: LinkModalDialog.validationRequiredFtpUrl},
            {title: i18n('dialog.link.urlprotocols.relative'), prefix: '', validator: LinkModalDialog.validationRequiredRelativeUrl}
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
        return super.doRender().then((rendered: boolean) => {
            this.addAction(this.submitAction);
            this.addCancelButtonToBottom();

            return this.fetchParentSite().then(() => {
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

    private fetchParentSite(): Q.Promise<void> {
        if (!this.contentId) {
            return Q.resolve();
        }

        return new GetNearestSiteRequest(this.contentId).sendAndParse().then((parentSite: Site) => {
            if (parentSite) {
                this.parentSitePath = parentSite.getPath().toString();
            }

            return Q.resolve();
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
        return this.link ? !(this.isContentLink() || this.isEmail() || this.isAnchor()) : false;
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
                const regex = new RegExp(/^(.*?)(\#|\?|$)/g);
                const regexResult = regex.exec(this.link);
                return (regexResult.length > 1 ? regexResult[1] : this.link)
                    .replace(LinkModalDialog.contentPrefix, StringHelper.EMPTY_STRING);
            }

            return StringHelper.EMPTY_STRING;
        };

        const contentSelectorBuilder = this.createContentSelectorBuilder(this.parentSitePath);
        const contentSelector = this.createContentSelector(getContentId, contentSelectorBuilder);
        const showAllContentToggler = (showAllContent: boolean) => {
            contentSelectorBuilder.setAllowedContentPaths([showAllContent ? '' : this.parentSitePath]);
            contentSelector.getLoader().initRequests(contentSelectorBuilder);
        };

        const contentPanel = this.createFormPanel([
            this.createSelectorFormItem('contentId', i18n('field.content'), contentSelector, true),
            this.createShowAllContentCheckboxFormItem('contentShowAll', showAllContentToggler),
            this.createMediaOptionRadio('contentMediaRadio'),
            this.createContentTargetCheckboxFormItem('contentTarget', this.isContentLink),
            this.createFragmentOption('contentFragment', i18n('dialog.link.fragment')),
            this.createParamsOptions('contentParams', i18n('dialog.link.parameters')),
        ]);

        contentPanel.addClass('content-panel');

        return contentPanel;
    }


    private createUrlPanel(): Panel {
        const urlFormItem = this.createUrlFormItem('url', i18n('dialog.link.formitem.url'));
        const urlInput = <TextInput>urlFormItem.getInput();
        this.protocolsDropdownButton = this.createProtocolsDropdownButton(urlFormItem, urlInput);
        urlFormItem.prependChild(this.protocolsDropdownButton);

        const urlPanel = this.createFormPanel([
            urlFormItem,
            this.createUrlTargetCheckboxFormItem('urlTarget', this.isUrl, true)
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

    private isQueryParamsValid(): boolean {
        const isValid = Array.from(this.paramsFormItem.getHTMLElement().getElementsByTagName('input'))
            .filter((input: HTMLInputElement) => input.className.indexOf('params-key') >= 0)
            .every((input: HTMLInputElement) => input.value !== '');

        return isValid;
    }

    private isMediaRadioValueOpenOrLink(selectedValue: string): boolean {
        return selectedValue === MediaContentRadioAction.OPEN || selectedValue === MediaContentRadioAction.LINK;
    }

    private static validationAlwaysValid(): string {
        return undefined;
    }

    private validationQueryParams(): string {
        return !this.isQueryParamsValid() ? i18n('dialog.link.queryparams.empty') : undefined;
    }

    private static validationRequiredEmail(input: FormInputEl): string {
        return Validators.required(input) || Validators.validEmail(input);
    }

    private static validationRequiredUrl(input: FormInputEl): string {
        return Validators.required(input) || Validators.validUrl(input);
    }

    private static validationRequiredFtpUrl(input: FormInputEl): string {
        return Validators.required(input) || Validators.validFtpUrl(input);
    }

    private static validationRequiredRelativeUrl(input: FormInputEl): string {
        return Validators.required(input) || Validators.validRelativeUrl(input);
    }

    private getTarget(isTabSelected: boolean): boolean {
        return isTabSelected ? this.getOriginalTargetElem().getValue() === '_blank' : false;
    }

    private createContentTargetCheckboxFormItem(id: string, isTabSelectedFn: Function, showOnCreate: boolean = false): FormItem {
        const checkbox = this.createCheckbox(isTabSelectedFn);

        const formItemBuilder = new ModalDialogFormItemBuilder(id).setInputEl(checkbox);
        this.contentTargetCheckBoxFormItem = this.createFormItem(formItemBuilder);

        if (!showOnCreate) {
            this.contentTargetCheckBoxFormItem.hide();
        }

        return this.contentTargetCheckBoxFormItem;
    }

    private createShowAllContentCheckboxFormItem(id: string, valueChangeHandler: (isChecked: boolean) => void): FormItem {
        const checkbox: Checkbox = Checkbox.create()
            .setLabelText(i18n('dialog.link.formitem.showallcontent'))
            .setInputAlignment(InputAlignment.LEFT).build();

        checkbox.onValueChanged(() => valueChangeHandler(checkbox.isChecked()));

        const formItemBuilder = new ModalDialogFormItemBuilder(id).setInputEl(checkbox);

        this.showAllContentCheckboxFormItem = this.createFormItem(formItemBuilder);

        if (!this.parentSitePath) {
            // No need to show the checkbox if we are outside a site,
            // as we already allow selecting content from the entire project
            this.showAllContentCheckboxFormItem.hide();
        }

        return this.showAllContentCheckboxFormItem;
    }

    private createUrlTargetCheckboxFormItem(id: string, isTabSelectedFn: Function, showOnCreate: boolean = false): FormItem {
        const checkbox = this.createCheckbox(isTabSelectedFn);

        const formItemBuilder = new ModalDialogFormItemBuilder(id).setInputEl(checkbox);
        this.urlTargetCheckboxFormItem = this.createFormItem(formItemBuilder);

        if (!showOnCreate) {
            this.urlTargetCheckboxFormItem.hide();
        }

        return this.urlTargetCheckboxFormItem;
    }

    private createCheckbox(isTabSelectedFn: Function): Checkbox {
        const checkbox: Checkbox = Checkbox.create().setLabelText(i18n('dialog.link.formitem.openinnewtab')).setInputAlignment(
            InputAlignment.LEFT).build();

        checkbox.setChecked(this.getTarget(isTabSelectedFn.call(this)));

        return checkbox;
    }

    private createHideButtonForFragment(addButton: Button): Button {
        const anchorInput: TextInput = <TextInput>this.anchorFormItem.getInput();
        const hideButton: Button = this.createRemoveButton();

        hideButton.onClicked(() => {
            anchorInput.setValue('');
            anchorInput.hide();
            addButton.show();
        });

        return hideButton;
    }

    private createAddButtonForFragment(): Button {
        const anchorInput: TextInput = <TextInput>this.anchorFormItem.getInput();
        const addButton: Button = new Button(i18n('action.add'));

        addButton.onClicked(() => {
            addButton.hide();
            anchorInput.show();
            anchorInput.giveFocus();
        });

        return addButton;
    }

    private initializeFragmentAnchorInputListeners(hideAnchorFormButton: Button): void {
        const anchorInput: TextInput = <TextInput>this.anchorFormItem.getInput();

        anchorInput.onShown(() => {
            this.anchorFormItem.setValidator(Validators.required);
            hideAnchorFormButton.show();
        });

        anchorInput.onValueChanged(() => {
            this.anchorFormItem.validate(new ValidationResult(), true);
        });

        anchorInput.onHidden(() => {
            this.anchorFormItem.setValidator(LinkModalDialog.validationAlwaysValid);
            this.anchorFormItem.validate(new ValidationResult(), true);
            hideAnchorFormButton.hide();
        });
    }

    private getFragment() {
        if (this.link.indexOf(LinkModalDialog.fragmentPrefix) === -1) {
            return StringHelper.EMPTY_STRING;
        }

        const fragmentUri: string =
            this.link.slice(this.link.indexOf(LinkModalDialog.fragmentPrefix) + LinkModalDialog.fragmentPrefix.length);

        return decodeURIComponent(fragmentUri);
    }

    private createFragmentOption(id: string, label: string): FormItem {

        this.anchorFormItem = this.createFormItemWithPostponedValue(id, label, this.getFragment, LinkModalDialog.validationAlwaysValid);
        this.anchorFormItem.addClass('anchor-form-item');

        const anchorInput = <TextInput>this.anchorFormItem.getInput();
        anchorInput.hide();

        const addButton: Button = this.createAddButtonForFragment();
        this.anchorFormItem.prependChild(addButton);

        const hideAnchorFormButton: Button = this.createHideButtonForFragment(addButton);
        this.anchorFormItem.appendChild(hideAnchorFormButton);

        this.initializeFragmentAnchorInputListeners(hideAnchorFormButton);

        if (this.getFragment()) {
            addButton.hide();
            anchorInput.show();
        }

        this.anchorFormItem.hide();

        return this.anchorFormItem;
    }

    private createParamsOptions(id: string, label: string): FormItem {
        this.paramsFormIds = [];

        const addButton: Button = new Button(i18n('action.add'));

        this.paramsFormItem = this.createFormItem(new ModalDialogFormItemBuilder(id, label)
            .setValidator(this.validationQueryParams.bind(this)));
        this.paramsFormItem.removeChild(this.paramsFormItem.getInput().getParentElement());
        this.paramsFormItem.addClass('params-form-item');

        addButton.onClicked(() => {
            this.paramsFormItem.removeChild(addButton);
            this.createParamsFormItems();
            this.paramsFormItem.appendChild(addButton);
        });

        const keyValueMap: Map<string, string> = this.getKeyValueMapFromLink();
        keyValueMap.forEach((value: string, key: string) => this.createParamsFormItems(key, value));

        this.paramsFormItem.appendChild(addButton);

        this.paramsFormItem.hide();

        return this.paramsFormItem;
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
            if (!this.mediaOptionRadioFormItem.isVisible()) {
                return;
            }

            if (this.isMediaRadioValueOpenOrLink(event.getNewValue())) {
                this.contentTargetCheckBoxFormItem.show();
            } else {
                this.contentTargetCheckBoxFormItem.hide();
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

        const urlFormItem: FormItem = this.createFormItemWithPostponedValue(textId, textLabel, getUrl, Validators.required);
        const urlInput: TextInput = <TextInput>urlFormItem.getInput();
        this.initUrlInputHandlers(urlFormItem, urlInput);

        urlFormItem.getLabel().addClass('required');

        return urlFormItem;
    }

    private initUrlInputHandlers(urlFormItem: FormItem, urlInput: TextInput) {
        urlInput.onRendered(() => {
            const urlValue = urlInput.getValue();
            const usedProtocol = this.getUsedProtocolFromValue(urlValue);
            const actionTitle = urlValue ? usedProtocol.title : 'Https';
            const action = this.protocolsDropdownButton.getMenuActions().find(action => action.getLabel() === actionTitle);
            if (action) {
                action.execute();
            }
        });

        urlInput.onValueChanged((event: ValueChangedEvent) => {
            const urlValue = event.getNewValue();
            const usedProtocol = this.getUsedProtocolFromValue(urlValue);

            urlFormItem.setValidator(usedProtocol.validator);

            this.protocolsDropdownButton.getMenuItems().forEach(menuItem => {
                menuItem.removeClass('menu-item-selected');
                if (menuItem.getEl().getInnerHtml() === usedProtocol.title) {
                    menuItem.addClass('menu-item-selected');
                }
            });
        });
    }

    private createProtocolsDropdownButton(formItem: FormItem, textInput: TextInput): MenuButton {
        const protocolsDropdownButton = new MenuButton(new Action(i18n('field.type')));
        protocolsDropdownButton.addClass('menu-button-type');

        const actions = this.urlProtocols.map(({title, prefix, validator}) => {
            const action = new Action(title);

            action.onExecuted(() => {
                const urlValue: string = textInput.getValue();
                const usedProtocol: UrlProtocol = this.getUsedProtocolFromValue(urlValue);
                const newUrlValue: string = !usedProtocol.prefix
                    ? prefix + urlValue
                    : urlValue.replace(usedProtocol.prefix, prefix);

                formItem.setValidator(validator);
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

    private getKeyValueMapFromLink(): Map<string, string> {
        const keyValueMap: Map<string, string> = new Map<string, string>();

        if (this.link.indexOf(LinkModalDialog.queryParamsPrefix) === -1) {
            return keyValueMap;
        }

        const keyValues: string[] = this.extractQueryStringFromLink().split('&');

        keyValues.forEach((keyValue: string) => {
            const [key, value] = keyValue.split('=');

            if (key) {
                keyValueMap.set(key, value || '');
            }
        });

        return keyValueMap;
    }

    private extractQueryStringFromLink(): string {
        const queryString: string = this.link.split(LinkModalDialog.queryParamsPrefix).pop();
        const fragmentPrefixIndex = queryString.indexOf(LinkModalDialog.fragmentPrefix);

        if (fragmentPrefixIndex >= 0) {
            return decodeURIComponent(queryString.slice(0, fragmentPrefixIndex));
        }

        return decodeURIComponent(queryString);
    }

    private getNewParamIdentifier(): number {
        if (this.paramsFormIds.length === 0) {
            return 0;
        }

        const lastParamsFormIdsElement: FormParam = this.paramsFormIds[this.paramsFormIds.length - 1];
        const lastKeyIdNumber: number = parseFloat(lastParamsFormIdsElement.keyId.split('-')[1]);
        const nextParamIdentifier = lastKeyIdNumber + 1;

        return nextParamIdentifier + 1;
    }

    private resetMediaRadioValue(): void {
        this.getMediaRadioGroup().setValue(MediaContentRadioAction.OPEN);
    }

    private createParamKeyFormItem(initialKey: string): [FormItem, string] {
        const id: string = `paramsKey-${this.getNewParamIdentifier()}`;
        const label: string = i18n('dialog.link.parameters.name');
        const formItem: FormItem = this.createFormItemWithPostponedValue(id, '', () => initialKey, null, label);
        formItem.getInput().addClass('params-key');

        (<TextInput>formItem.getInput()).onValueChanged(() => {
            this.paramsFormItem.validate(new ValidationResult(), true);
        });

        return [formItem, id];
    }

    private createParamValueFormItem(initialValue: string): [FormItem, string] {
        const id: string = `paramsValue-${this.getNewParamIdentifier()}`;
        const label: string = i18n('dialog.link.parameters.value');
        const formItem: FormItem = this.createFormItemWithPostponedValue(id, '', () => initialValue, null, label);

        return [formItem, id];
    }

    private createRemoveButtonForParams(keyFormItemId: string, valueFormItemId: string, divParamsWrapper: DivEl): Button {
        const removeButton: Button = this.createRemoveButton();

        removeButton.onClicked(() => {
            this.paramsFormIds = this.paramsFormIds.filter(
                (formParam: FormParam) => formParam.keyId !== keyFormItemId && formParam.valueId !== valueFormItemId);
            this.removeFieldById(keyFormItemId);
            this.removeFieldById(valueFormItemId);
            this.paramsFormItem.removeChild(divParamsWrapper);
            this.paramsFormItem.validate(new ValidationResult(), true);
        });

        return removeButton;
    }

    private createParamsFormItems(initialKey: string = '', initialValue: string = ''): void {
        const divWrapper: DivEl = new DivEl('params-wrapper');

        const [keyFormItem, keyFormItemId]: [FormItem, string] = this.createParamKeyFormItem(initialKey);
        const [valueFormItem, valueFormItemId]: [FormItem, string] = this.createParamValueFormItem(initialValue);
        const removeButton: Button = this.createRemoveButtonForParams(keyFormItemId, valueFormItemId, divWrapper);

        divWrapper.appendChildren<FormItem | Button>(keyFormItem, valueFormItem, removeButton);
        this.paramsFormIds.push({keyId: keyFormItemId, valueId: valueFormItemId});
        this.paramsFormItem.appendChild(divWrapper);

        keyFormItem.getInput().giveFocus();
    }

    private createRemoveButton(): Button {
        const button: Button = new Button();
        button.addClass('remove-button transparent icon-close');
        return button;
    }

    private getMediaRadioGroup(): RadioGroup {
        return <RadioGroup>this.getFieldById('contentMediaRadio');
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

        const dockedPanel: DockedPanel = new DockedPanel();
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

    private filterContentByParentPath(contentItem: ContentSummary | ContentTreeSelectorItem): boolean {
        if (!this.parentSitePath || (<Checkbox>this.showAllContentCheckboxFormItem.getInput()).isChecked()) {
            return true;
        }

        const contentSummary = contentItem instanceof ContentSummary ? contentItem : contentItem.getContent();
        const contentPath = contentSummary.getPath().toString();

        return contentPath === this.parentSitePath || contentPath.startsWith(`${this.parentSitePath}/`);
    }

    private createContentSelector(getValueFn: Function,
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

    private createContentSelectorBuilder(parentSitePath: string): ContentSummaryOptionDataLoaderBuilder {
        return ContentSummaryOptionDataLoader
            .create()
            .setProject(this.config.project)
            .setPostFilterFn((contentItem) => this.filterContentByParentPath(contentItem))
            .setAllowedContentPaths([parentSitePath || '']);
    }

    private createSelectorFormItem(id: string, label: string, contentSelector: ContentComboBox<ContentTreeSelectorItem>,
                                   addValueValidation: boolean = false): FormItem {
        const formItemBuilder: ModalDialogFormItemBuilder =
            new ModalDialogFormItemBuilder(id, label).setValidator(Validators.required).setInputEl(contentSelector);
        const formItem: FormItem = this.createFormItem(formItemBuilder);

        const mediaUploader: MediaUploaderEl = this.createMediaUploader(contentSelector);
        mediaUploader.insertAfterEl(contentSelector);

        if (!addValueValidation) {
            return formItem;
        }

        const callHandleSelectorValueChanged = () =>
            this.handleSelectorValueChanged(contentSelector.getSelectedContent(), formItem);

        contentSelector.onValueLoaded(callHandleSelectorValueChanged);
        contentSelector.onValueChanged(callHandleSelectorValueChanged);

        return formItem;
    }

    private handleSelectorValueChanged(selectedContent: ContentSummary, formItem: FormItem): void {
        if (!selectedContent) {
            formItem.setValidator(Validators.required);
            this.resetMediaRadioValue();
            if (this.parentSitePath) {
                this.showAllContentCheckboxFormItem.show();
            }
            this.mediaOptionRadioFormItem.hide();
            this.contentTargetCheckBoxFormItem.hide();
            this.anchorFormItem.hide();
            this.paramsFormItem.hide();
            return;
        }

        this.showAllContentCheckboxFormItem.hide();

        if (selectedContent.getType().isDescendantOfMedia()) {
            this.mediaOptionRadioFormItem.show();
            this.anchorFormItem.hide();
            this.paramsFormItem.hide();
            if (this.isMediaRadioValueOpenOrLink(this.getMediaRadioGroup().doGetValue())) {
                this.contentTargetCheckBoxFormItem.show();
            }
        } else {
            this.mediaOptionRadioFormItem.hide();
            this.contentTargetCheckBoxFormItem.show();
            this.anchorFormItem.show();
            this.paramsFormItem.show();
        }
    }

    private createMediaUploader(contentSelector: ContentComboBox<ContentTreeSelectorItem>): MediaUploaderEl {
        const mediaUploader: MediaUploaderEl = new MediaUploaderEl({
            params: {
                parent: this.contentId?.toString() || ContentPath.getRoot().toString()
            },
            operation: MediaUploaderElOperation.create,
            name: 'media-selector-upload-el',
            showCancel: false,
            showResult: false,
            allowMultiSelection: false,
            project: this.config.project
        });

        mediaUploader.onUploadStarted((event: UploadStartedEvent<Content>) => {
            event.getUploadItems().forEach((uploadItem: UploadItem<Content>) => {
                const value: MediaTreeSelectorItem = new MediaTreeSelectorItem(null).setDisplayValue(
                    MediaSelectorDisplayValue.fromUploadItem(uploadItem));

                const option: Option<MediaTreeSelectorItem> = Option.create<MediaTreeSelectorItem>()
                    .setValue(value.getId())
                    .setDisplayValue(value)
                    .build();
                contentSelector.selectOption(option);
            });
        });

        mediaUploader.onFileUploaded((event: UploadedEvent<Content>) => {
            this.showAllContentCheckboxFormItem.hide();
            this.mediaOptionRadioFormItem.show();

            if (this.isMediaRadioValueOpenOrLink(this.getMediaRadioGroup().doGetValue())) {
                this.contentTargetCheckBoxFormItem.show();
            }

            const item: UploadItem<Content> = event.getUploadItem();
            const createdContent: Content = item.getModel();

            const selectedOption: SelectedOption<ContentTreeSelectorItem> = contentSelector.getSelectedOptionView().getById(item.getId());
            const option: Option<ContentTreeSelectorItem> = selectedOption.getOption();
            option.setDisplayValue(new MediaTreeSelectorItem(createdContent));
            option.setValue(createdContent.getContentId().toString());

            selectedOption.getOptionView().setOption(option);
        });

        mediaUploader.onUploadFailed((event: UploadFailedEvent<Content>) => {
            const item: UploadItem<Content> = event.getUploadItem();
            const selectedOption: SelectedOption<ContentTreeSelectorItem> = contentSelector.getSelectedOptionView().getById(item.getId());

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
        const form: Form = <Form>this.dockedPanel.getDeck().getPanelShown().getFirstChild();
        return form.validate(true).isValid();
    }

    protected validate(): boolean {
        const isMainFormValid: boolean = super.validate();
        const isDockPanelValid: boolean = this.validateDockPanel();

        return isMainFormValid && isDockPanelValid;
    }

    private getContentLinkQueryParams(): string {
        const queryParamsString: string = this.paramsFormIds.reduce((prev, formParam: FormParam) => {
            const key: string = (<TextInput>this.getFieldById(formParam.keyId)).getValue().trim();
            const value: string = (<TextInput>this.getFieldById(formParam.valueId)).getValue().trim();
            return prev === '' ? `${key}=${value}` : `${prev}&${key}=${value}`;
        }, '');

        if (!queryParamsString) {
            return StringHelper.EMPTY_STRING;
        }

        return `?${LinkModalDialog.queryParamsPrefix}${encodeURIComponent(queryParamsString)}`;
    }

    private getContentLinkFragment(hasQueryParams: boolean): string {
        const anchorString: string = encodeURIComponent((<TextInput>this.getFieldById('contentFragment')).getValue().trim());
        const fragment: string = anchorString ? `${LinkModalDialog.fragmentPrefix}${anchorString}` : '';

        if (!fragment) {
            return StringHelper.EMPTY_STRING;
        }

        return hasQueryParams ? `&${fragment}` : `?${fragment}`;
    }

    private getContentLinkUrl(contentSelectorValue: string, queryParams?: string, fragment?: string): string {
        return `${LinkModalDialog.contentPrefix}${contentSelectorValue}${queryParams || ''}${fragment || ''}`;
    }

    private getContentLinkTarget(): string {
        const isOpenInNewTab: boolean = (<Checkbox>this.contentTargetCheckBoxFormItem.getInput()).isChecked();
        return isOpenInNewTab ? '_blank' : '';
    }

    private createContentLink() {
        const urlParams: ContentLinkParams = this.generateUrlParams();

        this.getOriginalLinkTypeElem().setValue('url', false);
        this.getOriginalProtocolElem().setValue('', false);
        this.getOriginalUrlElem().setValue(urlParams.url, false);
        this.getOriginalTargetElem().setValue(urlParams.target, false);
    }

    private generateUrlParams(): ContentLinkParams {
        if (this.mediaOptionRadioFormItem.isVisible()) {
            return this.generateUrlParamsForMedia();
        }

        return this.generateUrlParamsForNonMedia();
    }

    private getContentIdFormItemEl(): ContentComboBox<ContentTreeSelectorItem> {
        return <ContentComboBox<ContentTreeSelectorItem>>this.getFieldById('contentId');
    }

    private generateUrlParamsForMedia(): ContentLinkParams {
        const mediaContentRadioSelectedOption: string = this.getMediaRadioGroup().doGetValue();
        const contentSelectorValue: string = this.getContentSelectorValue();

        if (mediaContentRadioSelectedOption === MediaContentRadioAction.OPEN) {
            return {
                url: LinkModalDialog.mediaInlinePrefix + contentSelectorValue,
                target: this.getContentLinkTarget()
            };
        }

        if (mediaContentRadioSelectedOption === MediaContentRadioAction.DOWNLOAD) {
            return {
                url: LinkModalDialog.mediaDownloadPrefix + contentSelectorValue,
                target: ''
            };
        }

        if (mediaContentRadioSelectedOption === MediaContentRadioAction.LINK) {
            return {
                url: this.getContentLinkUrl(contentSelectorValue),
                target: this.getContentLinkTarget()
            };
        }

        return {
            url: '',
            target: ''
        };
    }

    private getContentSelectorValue(): string {
        return this.getContentIdFormItemEl().getValue();
    }

    private generateUrlParamsForNonMedia(): ContentLinkParams {
        const contentSelectorValue: string = this.getContentSelectorValue();
        const queryParams: string = this.getContentLinkQueryParams();
        const fragment: string = this.getContentLinkFragment(!!queryParams);

        return {
            url: this.getContentLinkUrl(contentSelectorValue, queryParams, fragment),
            target: this.getContentLinkTarget()
        };
    }

    private createUrlLink(): void {
        const url: string = (<TextInput>this.getFieldById('url')).getValue().trim();
        const isOpenInNewTab: boolean = (<Checkbox>this.getFieldById('urlTarget')).isChecked();
        const target: string = isOpenInNewTab ? '_blank' : '';

        this.getOriginalLinkTypeElem().setValue('url', false);
        this.getOriginalProtocolElem().setValue('', false);
        this.getOriginalTargetElem().setValue(target, false);
        this.getOriginalUrlElem().setValue(url, false);
    }

    private createEmailLink(): void {
        const email = (<TextInput>this.getFieldById('email')).getValue().trim();
        const subject = (<TextInput>this.getFieldById('subject')).getValue().trim();

        this.getOriginalLinkTypeElem().setValue('email', false);
        this.getOriginalEmailElem().setValue(email, false);
        this.getOriginalSubjElem().setValue(subject, false);
    }

    private createAnchor(): void {
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
