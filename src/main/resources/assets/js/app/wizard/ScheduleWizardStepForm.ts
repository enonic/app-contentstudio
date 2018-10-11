import FormView = api.form.FormView;
import PropertySet = api.data.PropertySet;
import WizardStepValidityChangedEvent = api.app.wizard.WizardStepValidityChangedEvent;
import i18n = api.util.i18n;
import {PublishFrom} from '../inputtype/publish/PublishFrom';
import {PublishToFuture} from '../inputtype/publish/PublishToFuture';
import {Content, ContentBuilder} from '../content/Content';
import {PublishStatus} from '../publish/PublishStatus';

export class ScheduleWizardStepForm
    extends api.app.wizard.WizardStepForm {

    private content: Content;
    private updateUnchangedOnly: boolean = false;

    private formView: FormView;
    private propertySet: PropertySet = new api.data.PropertyTree().getRoot();

    constructor() {
        super('schedule-wizard-step-form');
    }

    layout(content: Content) {
        this.content = content;
        this.initFormView(content);
    }

    update(content: Content, unchangedOnly: boolean = true) {
        this.updateUnchangedOnly = unchangedOnly;
        this.propertySet.reset();
        this.initPropertySet(content);
        this.formView.update(this.propertySet, unchangedOnly);
    }

    reset() {
        this.formView.reset();
    }

    onPropertyChanged(listener: { (): void; }) {
        this.propertySet.onChanged(listener);
    }

    unPropertyChanged(listener: { (): void; }) {
        this.propertySet.unChanged(listener);
    }

    private initFormView(content: Content) {
        let formBuilder = new api.form.FormBuilder()
            .addFormItem(new api.form.InputBuilder()
                .setName('from')
                .setInputType(PublishFrom.getName())
                .setLabel(i18n('field.onlineFrom'))
                .setHelpText(i18n('field.onlineFrom.help'))
                .setOccurrences(new api.form.OccurrencesBuilder().setMinimum(0).setMaximum(1).build())
                .setInputTypeConfig({})
                .setMaximizeUIInputWidth(true)
                .build())
            .addFormItem(new api.form.InputBuilder()
                .setName('to')
                .setInputType(PublishToFuture.getName())
                .setLabel(i18n('field.onlineTo'))
                .setHelpText(i18n('field.onlineTo.help'))
                .setOccurrences(new api.form.OccurrencesBuilder().setMinimum(0).setMaximum(1).build())
                .setInputTypeConfig({})
                .setMaximizeUIInputWidth(true)
                .build());

        this.initPropertySet(content);
        this.formView = new api.form.FormView(api.form.FormContext.create().build(), formBuilder.build(), this.propertySet);
        this.formView.displayValidationErrors(true);
        this.formView.layout().then(() => {
            this.formView.onFocus((event) => {
                this.notifyFocused(event);
            });
            this.formView.onBlur((event) => {
                this.notifyBlurred(event);
            });

            this.appendChild(this.formView);

            this.formView.onValidityChanged((event: api.form.FormValidityChangedEvent) => {
                this.previousValidation = event.getRecording();
                this.notifyValidityChanged(new WizardStepValidityChangedEvent(event.isValid()));
            });

            this.propertySet.onChanged(() => {
                this.formView.validate();
            });
        });
    }

    private initPropertySet(content: Content) {
        let publishFromDate = content.getPublishFromTime();
        if (publishFromDate) {
            this.propertySet.setLocalDateTime('from', 0, api.util.LocalDateTime.fromDate(publishFromDate));
        }
        let publishToDate = content.getPublishToTime();
        if (publishToDate) {
            this.propertySet.setLocalDateTime('to', 0, api.util.LocalDateTime.fromDate(publishToDate));
        }
    }

    getPublishStatus(): PublishStatus {
        let publishFrom = this.propertySet.getDateTime('from');
        if (publishFrom && publishFrom.toDate() > new Date()) {
            return PublishStatus.PENDING;
        }

        let publishTo = this.propertySet.getDateTime('to');
        if (publishTo && publishTo.toDate() < new Date()) {
            return PublishStatus.EXPIRED;
        }

        return PublishStatus.ONLINE;
    }

    apply(builder: ContentBuilder) {
        let publishFrom = this.propertySet.getDateTime('from');
        builder.setPublishFromTime(publishFrom && publishFrom.toDate());
        let publishTo = this.propertySet.getDateTime('to');
        builder.setPublishToTime(publishTo && publishTo.toDate());
    }

    giveFocus(): boolean {
        return this.formView.giveFocus();
    }

    toggleHelpText(show?: boolean) {
        this.formView.toggleHelpText(show);
    }

    hasHelpText(): boolean {
        return this.isVisible() && this.formView.hasHelpText();
    }

}
