import {DefaultModalDialogHeader} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type ContentSummary} from '../../../../content/ContentSummary';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {GetContentByIdRequest} from '../../../../resource/GetContentByIdRequest';
import {type Content} from '../../../../content/Content';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {UpdateContentLanguageRequest} from '../../../../resource/UpdateContentLanguageRequest';
import {UpdateContentMetadataRequest} from '../../../../resource/UpdateContentMetadataRequest';
import {type PropertiesWizardStepForm} from './PropertiesWizardStepForm';
import Q from 'q';
import {ModalDialogWithConfirmation} from '@enonic/lib-admin-ui/ui/dialog/ModalDialogWithConfirmation';

export interface EditPropertiesDialogParams {
    title: string,
    updatedHandler?: (updatedContent: Content) => void;
}

export class EditPropertiesDialog
    extends ModalDialogWithConfirmation {

    private allowedForms: PropertiesWizardStepForm[];

    private content: ContentSummary;

    private updateAction: Action;

    private readonly changeHandler: () => void;

    private updatedHandler?: (updatedContent: Content) => void;

    constructor(params: EditPropertiesDialogParams) {
        super({
            class: 'edit-details-dialog'
        });

        this.setHeading(params.title);
        this.updatedHandler = params.updatedHandler;
        this.changeHandler = this.handleChange.bind(this);
    }

    protected initElements(): void {
        super.initElements();

        this.updateAction = new Action(i18n('action.apply'));
    }

    protected postInitElements(): void {
        super.postInitElements();

        this.addAction(this.updateAction, true);
        this.setElementToFocusOnShow(this.addCancelButtonToBottom());
    }

    protected initListeners() {
        super.initListeners();

        this.updateAction.onExecuted(() => {
            this.updateContent();
        });
    }

    private updateContent(): Q.Promise<void> {
        this.updateAction.setEnabled(false);

        return new GetContentByIdRequest(this.content.getContentId()).sendAndParse().then((content: Content) => {
            const requests: Q.Promise<Content>[] = [];

            if (this.isAnyFormMetadataChanged()) {
                const metadataRequest: UpdateContentMetadataRequest = UpdateContentMetadataRequest.create(content);
                this.allowedForms.forEach((form: PropertiesWizardStepForm) => form.applyMetadataChange(metadataRequest));
                requests.push(metadataRequest.sendAndParse());
            }

            if (this.isAnyFormLanguageChanged()) {
                const languageRequest: UpdateContentLanguageRequest = UpdateContentLanguageRequest.create(content);
                this.allowedForms.forEach((form: PropertiesWizardStepForm) => form.applyLanguageChange(languageRequest));
                requests.push(languageRequest.sendAndParse());
            }

            if (requests.length === 0) {
                this.close();
                return;
            }

            return Q.all(requests).then((updatedContents: Content[]) => {
                this.updatedHandler?.(updatedContents[updatedContents.length - 1]);
                this.close();
            });
        }).catch((e: unknown) => {
            DefaultErrorHandler.handle(e);
        }).finally(() => {
            this.updateAction.setEnabled(true);
        });
    }

    protected createHeader(title: string): EditDetailsDialogHeader {
        return new EditDetailsDialogHeader(title);
    }

    setFormsAllowed(allowedForms: PropertiesWizardStepForm[]): this {
        this.allowedForms = allowedForms || [];
        return this;
    }

    setItem(item: ContentSummary): this {
        this.content = item;
        return this;
    }

    open() {
        super.open();
        this.layout();
    }

    private layout(): void {
        this.updateAction.setEnabled(false);
        this.getContentPanel().removeChildren();

        this.allowedForms.forEach((form: PropertiesWizardStepForm) => {
            form.layout(this.content);
            form.setChangeListener(this.changeHandler);
            this.appendChildToContentPanel(form);
        });

        (this.header as EditDetailsDialogHeader).setPath(this.content.getPath().toString());
    }

    private handleChange(): void {
        const hasChanges = this.isAnyFormMetadataChanged() || this.isAnyFormLanguageChanged();
        this.updateAction.setEnabled(hasChanges && this.isEveryFormValid());
    }

    private isAnyFormMetadataChanged(): boolean {
        return this.allowedForms.some((form: PropertiesWizardStepForm) => form.isMetadataChanged());
    }

    private isAnyFormLanguageChanged(): boolean {
        return this.allowedForms.some((form: PropertiesWizardStepForm) => form.isLanguageChanged());
    }

    private isEveryFormValid(): boolean {
        return this.allowedForms.every((form: PropertiesWizardStepForm) => form.isValid());
    }

    isDirty(): boolean {
        return this.updateAction.isEnabled();
    }
}

class EditDetailsDialogHeader
    extends DefaultModalDialogHeader {

    private readonly pathEl: H6El;

    constructor(title: string) {
        super(title);

        this.pathEl = new H6El('content-path');
        this.appendChild(this.pathEl);
    }

    setPath(path: string) {
        this.pathEl.setHtml(path);
    }
}
