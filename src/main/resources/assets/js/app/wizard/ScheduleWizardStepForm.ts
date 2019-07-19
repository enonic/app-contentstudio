import FormView = api.form.FormView;
import PropertySet = api.data.PropertySet;
import WizardStepValidityChangedEvent = api.app.wizard.WizardStepValidityChangedEvent;
import i18n = api.util.i18n;
import DateTimeRange = api.form.inputtype.time.DateTimeRange;
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
            .addFormItem(
                new api.form.InputBuilder()
                    .setName('publish')
                    .setInputType(DateTimeRange.getName())
                    .setOccurrences(new api.form.OccurrencesBuilder().setMinimum(0).setMaximum(1).build())
                    .setInputTypeConfig({
                        labelStart: i18n('field.onlineFrom'),
                        labelEnd: i18n('field.onlineTo')
                    })
                    .setHelpText(i18n('field.onlineFrom.help'))
                    .setMaximizeUIInputWidth(true)
                    .build()
            );

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
        let pSet = this.propertySet.getPropertySet('publish');
        if (!pSet) {
            pSet = new PropertySet();
            this.propertySet.setPropertySet('publish', 0, pSet);
        }
        const publishFromDate = content.getPublishFromTime();
        if (publishFromDate) {
            pSet.setLocalDateTime('from', 0, api.util.LocalDateTime.fromDate(publishFromDate));
        }
        const publishToDate = content.getPublishToTime();
        if (publishToDate) {
            pSet.setLocalDateTime('to', 0, api.util.LocalDateTime.fromDate(publishToDate));
        }
    }

    getPublishStatus(): PublishStatus {
        const pSet = this.propertySet.getPropertySet('publish');
        if (pSet) {
            const publishFrom = pSet.getDateTime('from');
            if (publishFrom && publishFrom.toDate() > new Date()) {
                return PublishStatus.PENDING;
            }

            const publishTo = pSet.getDateTime('publish.to');
            if (publishTo && publishTo.toDate() < new Date()) {
                return PublishStatus.EXPIRED;
            }
        }

        return PublishStatus.ONLINE;
    }

    apply(builder: ContentBuilder) {
        const pSet = this.propertySet.getPropertySet('publish');
        if (pSet) {
            const publishFrom = pSet.getDateTime('from');
            builder.setPublishFromTime(publishFrom && publishFrom.toDate());
            const publishTo = pSet.getDateTime('to');
            builder.setPublishToTime(publishTo && publishTo.toDate());
        }
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
