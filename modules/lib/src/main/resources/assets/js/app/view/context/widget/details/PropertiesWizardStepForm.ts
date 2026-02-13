import {WizardStepForm} from '@enonic/lib-admin-ui/app/wizard/WizardStepForm';
import {type ContentSummary} from '../../../../content/ContentSummary';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {type UpdateContentRequest} from '../../../../resource/UpdateContentRequest';
import {type UpdateContentMetadataRequest} from '../../../../resource/UpdateContentMetadataRequest';

export class PropertiesWizardStepForm
    extends WizardStepForm {

    protected content: ContentSummary;

    protected changeListener: () => void;

    constructor(className?: string) {
        super(`properties-wizard-step-form ${className || ''}`);

        this.addHeader();
        this.initElements();
        this.initListener();
    }

    private addHeader(): void {
        const headerText: string = this.getHeaderText();

        if (headerText) {
            this.appendChild(new DivEl('properties-wizard-step-form-header').appendChild(
                new SpanEl('properties-wizard-step-form-header-text').setHtml(headerText)));
        }
    }

    protected initElements(): void {
        //
    }

    protected getHeaderText(): string {
        return null;
    }

    protected initListener(): void {
        //
    }

    layout(content: ContentSummary): void {
        this.content = content;
    }

    setChangeListener(handler: () => void): void {
        this.changeListener = handler;
    }

    isChanged(): boolean {
        return false;
    }

    isMetadataChanged(): boolean {
        return false;
    }

    applyChange(request: UpdateContentRequest): UpdateContentRequest {
        return request;
    }

    applyMetadataChange(request: UpdateContentMetadataRequest): UpdateContentMetadataRequest {
        return request;
    }
}
