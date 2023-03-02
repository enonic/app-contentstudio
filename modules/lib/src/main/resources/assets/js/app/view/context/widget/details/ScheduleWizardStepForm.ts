import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {FormView} from '@enonic/lib-admin-ui/form/FormView';
import {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {DateTimeRange} from '@enonic/lib-admin-ui/form/inputtype/time/DateTimeRange';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {InputBuilder} from '@enonic/lib-admin-ui/form/Input';
import {OccurrencesBuilder} from '@enonic/lib-admin-ui/form/Occurrences';
import {FormBuilder} from '@enonic/lib-admin-ui/form/Form';
import {FormContext} from '@enonic/lib-admin-ui/form/FormContext';
import {LocalDateTime} from '@enonic/lib-admin-ui/util/LocalDateTime';
import {ContentSummary} from '../../../../content/ContentSummary';
import {PropertiesWizardStepForm} from './PropertiesWizardStepForm';
import {UpdateContentRequest} from '../../../../resource/UpdateContentRequest';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {InputView} from '@enonic/lib-admin-ui/form/InputView';

export class ScheduleWizardStepForm
    extends PropertiesWizardStepForm {

    private static PUBLISH_PROPERTY: string = 'publish';
    private static FROM_PROPERTY: string = 'from';
    private static TO_PROPERTY: string = 'to';
    private formView: DateTimeRangeFormView;
    private propertySet: PropertySet;

    constructor() {
        super('schedule-wizard-step-form');
    }

    layout(content: ContentSummary): void {
        super.layout(content);

        this.initPropertySet(content);
        this.layoutFormView();
    }

    protected getHeaderText(): string {
        return null; // i18n('field.schedule');
    }

    private layoutFormView(): void {
        if (this.formView) {
            this.formView.update(this.propertySet).then(() => {
                this.formView.reset();
                this.formView.refreshValidation();
            });
        } else {
            this.initFormView();
        }
    }

    private initFormView(): void {
        this.formView = new DateTimeRangeFormView(FormContext.create().build(), this.createFormBuilder().build(), this.propertySet);
        this.formView.displayValidationErrors(true);

        this.formView.layout().then(() => {
            this.formView.onFocus((event: FocusEvent) => {
                this.notifyFocused(event);
            });

            this.formView.onBlur((event: FocusEvent) => {
                this.notifyBlurred(event);
            });

            this.appendChild(this.formView);
        });
    }

    private createFormBuilder(): FormBuilder {
        return new FormBuilder()
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
    }

    private initPropertySet(content: ContentSummary): void {
        this.propertySet = new PropertyTree().getRoot();
        const pSet: PropertySet = new PropertySet(this.propertySet.getTree());

        const publishFromDate: Date = content.getPublishFromTime();
        pSet.setLocalDateTime(ScheduleWizardStepForm.FROM_PROPERTY, 0, publishFromDate ? LocalDateTime.fromDate(publishFromDate) : null);

        const publishToDate: Date = content.getPublishToTime();
        pSet.setLocalDateTime(ScheduleWizardStepForm.TO_PROPERTY, 0, publishToDate ? LocalDateTime.fromDate(publishToDate) : null);

        this.propertySet.setPropertySet(ScheduleWizardStepForm.PUBLISH_PROPERTY, 0, pSet);

        this.propertySet.onChanged(() => {
            this.changeListener?.();
        });
    }

    giveFocus(): boolean {
        return this.formView.giveFocus();
    }

    isValid(): boolean {
        return this.formView.hasValidUserInput();
    }

    toggleHelpText(show?: boolean): void {
        this.formView.toggleHelpText(show);
    }

    hasHelpText(): boolean {
        return this.isVisible() && this.formView.hasHelpText();
    }

    setEnabled(enable: boolean): void {
        super.setEnabled(enable);

        this.formView.setEnabled(enable);
    }

    applyChange(request: UpdateContentRequest): UpdateContentRequest {
        request.setPublishFrom(this.getPublishFrom());
        request.setPublishTo(this.getPublishTo());

        return request;
    }

    isChanged(): boolean {
        return !ObjectHelper.dateEqualsUpToMinutes(this.content.getPublishFromTime(), this.getPublishFrom()) ||
            !ObjectHelper.dateEqualsUpToMinutes(this.content.getPublishToTime(), this.getPublishTo());
    }

    private getPublishFrom(): Date {
        return this.getPublishPropAndConvert(ScheduleWizardStepForm.FROM_PROPERTY);
    }

    private getPublishTo(): Date {
        return this.getPublishPropAndConvert(ScheduleWizardStepForm.TO_PROPERTY);
    }

    private getPublishPropAndConvert(propName: string): Date {
        return this.propertySet.getPropertySet(ScheduleWizardStepForm.PUBLISH_PROPERTY)?.getDateTime(propName)?.toDate();
    }
}

class DateTimeRangeFormView extends FormView {

    refreshValidation(): void {
        (<InputView>this.formItemViews[0])?.getInputTypeView().displayValidationErrors();
    }
}
