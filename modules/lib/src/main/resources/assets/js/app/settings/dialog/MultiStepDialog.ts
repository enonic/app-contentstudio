import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ModalDialog, ModalDialogConfig} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {DialogStep} from './DialogStep';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import * as Q from 'q';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';

export interface MultiStepDialogConfig
    extends ModalDialogConfig {

    steps: DialogStep[];

    submitCallback?: { (): void; };

    closeOnSubmit?: boolean;
}

export class MultiStepDialog
    extends ModalDialog {

    protected steps: DialogStep[];

    protected config: MultiStepDialogConfig;

    protected currentStep: DialogStep;

    private stepsContainer: Element;

    private forwardButton: ActionButton;

    private backButton: ActionButton;

    private noStepsBlock?: Element;

    private stepCounter: Element;

    private currentStepDataChangedHandler: { (): void };

    protected constructor(config: MultiStepDialogConfig) {
        super(config);
    }

    protected initElements() {
        super.initElements();

        this.steps = (<MultiStepDialogConfig>this.config).steps;
        this.stepsContainer = this.createStepsContainer();
        this.stepCounter = new DivEl();
        this.backButton = this.addAction(new Action(i18n('dialog.multistep.previous')));
        this.getButtonRow().addElement(this.stepCounter);
        this.forwardButton = this.addAction(new Action(i18n('action.next')));
    }

    protected createStepsContainer(): Element {
        return new DivEl();
    }

    protected initListeners() {
        super.initListeners();

        this.whenShown(() => {
            this.handleShown();
        });

        this.onHidden(() => {
            this.handleHidden();
        });

        this.forwardButton.getAction().onExecuted(() => {
            if (this.forwardButton.isEnabled()) {
                this.forwardOrSubmit();
            }
        });

        this.backButton.getAction().onExecuted(() => {
            this.showPreviousStep();
        });

        this.currentStepDataChangedHandler = AppHelper.debounce(this.handleCurrentStepDataChanged.bind(this), 300);
    }

    protected forwardOrSubmit(): void {
        if (this.isLastStep()) {
            this.submit();
        } else {
            this.showNextStep();
        }
    }

    protected isLastStep(): boolean {
        return this.currentStep && this.currentStep === this.steps.slice().pop();
    }

    protected isFirstStep(): boolean {
        return this.currentStep === this.steps[0];
    }

    protected submit(): void {
        if (this.config.submitCallback) {
            this.config.submitCallback
        }

        if (this.config.closeOnSubmit) {
            this.close();
        }
    }

    protected handleShown(): void {
        if (this.steps.length > 0) {
            this.showNextStep();
        } else {
            this.handleNoSteps();
        }
    }

    protected showNextStep(): void {
        this.showStep(this.getNextStep());
    }

    protected showStep(step: DialogStep): void {
        this.unbindCurrentStepEvents()
        this.displayStep(step);
        this.updateButtonsState();
        this.bindCurrentStepEvents();
        this.updateStepCounter();
    }

    private unbindCurrentStepEvents(): void {
        this.currentStep?.unDataChanged(this.currentStepDataChangedHandler);
    }

    private bindCurrentStepEvents(): void {
        this.currentStep?.onDataChanged(this.currentStepDataChangedHandler);
    }

    private updateStepCounter(): void {
        let curIndex: number = null;

        const isFound: boolean = this.steps.some((step: DialogStep, index: number) => {
            if (step === this.currentStep) {
                curIndex = index;
                return true;
            }
            return false;
        });

        if (isFound) {
            this.stepCounter.setHtml(i18n('dialog.project.wizard.step', ++curIndex, this.steps.length));
            this.stepCounter.show();
        } else {
            this.stepCounter.hide();
        }
    }

    protected handleCurrentStepDataChanged(): void {
        this.updateForwardButtonLabel()
        this.updateForwardButtonEnabledState();
    }

    protected displayStep(step: DialogStep): void {
        this.currentStep?.getHtmlEl().hide();
        this.currentStep = step;

        const el: Element = step.getHtmlEl();

        if (!this.stepsContainer.hasChild(el)) {
            this.stepsContainer.appendChild(el);
        }

        el.show();
    }

    private getNextStep(): DialogStep {
        if (!this.currentStep) {
            return this.steps[0];
        }

        const nextStep: DialogStep = this.steps.find((step: DialogStep, index: number) => {
            return this.currentStep === this.steps[index - 1];
        });

        return nextStep || this.steps[0];
    }

    private updateButtonsState(): void {
        this.getButtonRow().toggleClass('first-step', this.isFirstStep());
        this.updateForwardButtonLabel();
        this.updateForwardButtonEnabledState();
    }

    private updateForwardButtonLabel(): void {
        this.forwardButton.setLabel(this.getForwardButtonLabel());
    }

    private getForwardButtonLabel(): string {
        if (this.isLastStep()) {
            return this.getSubmitActionLabel();
        }

        if (!this.currentStep.isOptional() || this.currentStep.hasData()) {
            return i18n('action.next');
        }

        return i18n('dialog.multistep.skip');
    }

    private updateForwardButtonEnabledState(): void {
        if (this.currentStep.isOptional()) {
            this.forwardButton.setEnabled(true);
        } else {
            this.forwardButton.setEnabled(false);
            this.lock();

            this.currentStep.isValid().then((isValid: boolean) => {
                this.forwardButton.setEnabled(isValid);
            })
                .catch(DefaultErrorHandler.handle)
                .finally(() => this.unlock());
        }
    }

    protected lock(): void {
        this.addClass('locked');
    }

    protected unlock(): void {
        this.removeClass('locked');
    }

    private getPreviousStep(): DialogStep {
        if (!this.currentStep) {
            return this.steps[0];
        }

        const previousStep: DialogStep = this.steps.find((step: DialogStep, index: number) => {
            return this.currentStep === this.steps[index + 1];
        });

        return previousStep || this.steps[0];
    }

    protected showPreviousStep(): void {
        this.showStep(this.getPreviousStep());
    }

    protected handleNoSteps(): void {
        if (!this.noStepsBlock) {
            this.noStepsBlock = new DivEl('no-steps-block').setHtml(i18n('dialog.multistep.no.steps'));
        }

        this.backButton.hide();
        this.forwardButton.hide();
        this.appendChildToContentPanel(this.noStepsBlock);
    }

    protected handleHidden(): void {
        //
    }

    protected getSubmitActionLabel(): string {
        return i18n('action.submit');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('multi-step-dialog');
            this.stepsContainer.addClass('steps-container');
            this.appendChildToContentPanel(this.stepsContainer);
            this.backButton.addClass('back');
            this.forwardButton.addClass('forward');
            this.stepCounter.addClass('step-counter')

            return rendered;
        });
    }
}
