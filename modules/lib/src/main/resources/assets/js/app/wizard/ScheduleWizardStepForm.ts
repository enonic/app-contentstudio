import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {FormView} from '@enonic/lib-admin-ui/form/FormView';
import {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {WizardStepValidityChangedEvent} from '@enonic/lib-admin-ui/app/wizard/WizardStepValidityChangedEvent';
import {DateTimeRange} from '@enonic/lib-admin-ui/form/inputtype/time/DateTimeRange';
import {Content, ContentBuilder} from '../content/Content';
import {PublishStatus} from '../publish/PublishStatus';
import {WizardStepForm} from '@enonic/lib-admin-ui/app/wizard/WizardStepForm';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {InputBuilder} from '@enonic/lib-admin-ui/form/Input';
import {OccurrencesBuilder} from '@enonic/lib-admin-ui/form/Occurrences';
import {FormBuilder} from '@enonic/lib-admin-ui/form/Form';
import {FormContext} from '@enonic/lib-admin-ui/form/FormContext';
import {FormValidityChangedEvent} from '@enonic/lib-admin-ui/form/FormValidityChangedEvent';
import {LocalDateTime} from '@enonic/lib-admin-ui/util/LocalDateTime';

export class ScheduleWizardStepForm
    extends WizardStepForm {

    private content: Content;
    private updateUnchangedOnly: boolean = false;

    private formView: FormView;
    private propertySet: PropertySet = new PropertyTree().getRoot();

    constructor() {
        super('schedule-wizard-step-form');
    }

    layout(content: Content) {
        this.content = content;
        this.initFormView(content);
    }

    update(content: Content, unchangedOnly: boolean = true) {
        this.updateUnchangedOnly = unchangedOnly;
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
        let formBuilder = new FormBuilder()
            .addFormItem(
                new InputBuilder()
                    .setName('publish')
                    .setInputType(DateTimeRange.getName())
                    .setOccurrences(new OccurrencesBuilder().setMinimum(0).setMaximum(1).build())
                    .setInputTypeConfig({
                        labelStart: i18n('field.onlineFrom'),
                        labelEnd: i18n('field.onlineTo')
                    })
                    .setHelpText(i18n('field.onlineFrom.help'))
                    .setMaximizeUIInputWidth(true)
                    .build()
            );

        this.initPropertySet(content);
        this.formView = new FormView(FormContext.create().build(), formBuilder.build(), this.propertySet);
        this.formView.displayValidationErrors(true);
        this.formView.layout().then(() => {
            this.formView.onFocus((event) => {
                this.notifyFocused(event);
            });
            this.formView.onBlur((event) => {
                this.notifyBlurred(event);
            });

            this.appendChild(this.formView);

            this.formView.onValidityChanged((event: FormValidityChangedEvent) => {
                this.previousValidation = event.getRecording();
                this.notifyValidityChanged(new WizardStepValidityChangedEvent(event.isValid()));
            });

            this.propertySet.onChanged(() => {
                this.formView.validate();
            });
        });
    }

    private initPropertySet(content: Content) {
        const pSet = new PropertySet(this.propertySet.getTree());

        const publishFromDate = content.getPublishFromTime();
        pSet.setLocalDateTime('from', 0, publishFromDate ? LocalDateTime.fromDate(publishFromDate) : null);

        const publishToDate = content.getPublishToTime();
        pSet.setLocalDateTime('to', 0, publishToDate ? LocalDateTime.fromDate(publishToDate) : null);

        this.propertySet.setPropertySet('publish', 0, pSet);
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

    setEnabled(enable: boolean): void {
        super.setEnabled(enable);

        this.formView.setEnabled(enable);
    }
}
