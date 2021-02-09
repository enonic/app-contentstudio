import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {AEl} from 'lib-admin-ui/dom/AEl';
import {PropertySet} from 'lib-admin-ui/data/PropertySet';
import {FormItem} from 'lib-admin-ui/form/FormItem';
import {DateTimeRange} from 'lib-admin-ui/form/inputtype/time/DateTimeRange';
import {FormView} from 'lib-admin-ui/form/FormView';
import {FormBuilder} from 'lib-admin-ui/form/Form';
import {FormContext} from 'lib-admin-ui/form/FormContext';
import {InputBuilder} from 'lib-admin-ui/form/Input';
import {OccurrencesBuilder} from 'lib-admin-ui/form/Occurrences';
import {ButtonEl} from 'lib-admin-ui/dom/ButtonEl';

export class PublishScheduleForm
    extends DivEl {

    private scheduleFormView: FormView;
    private scheduleFormWrapper: DivEl;
    private formVisibilityListeners: { (flag: boolean): void }[] = [];
    private externalToggles: ButtonEl[] = [];

    createExternalToggle(): ButtonEl {
        const b = new ButtonEl();
        b.setClass('icon icon-calendar');
        b.onClicked(() => {
            const isVis = this.isFormVisible();
            this.setFormVisible(!isVis);
        });
        this.externalToggles.push(b);
        return b;
    }

    constructor(propertySet: PropertySet) {
        super('publish-schedule-form');

        propertySet.onChanged((event) => {
            const record = this.scheduleFormView.validate(false, true);
            this.scheduleFormView.displayValidationErrors(this.scheduleFormView.isVisible());
            this.toggleClass('invalid', !record.isValid());
        });

        const scheduleForm = new FormBuilder().addFormItem(this.createRangeFormItem()).build();
        this.scheduleFormView = new FormView(FormContext.create().build(), scheduleForm, propertySet);

        const removeButton = new AEl('remove-button');
        removeButton.onClicked((event: MouseEvent) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.setFormVisible(false);
        });

        this.scheduleFormWrapper = new DivEl('form-wrapper');
        this.scheduleFormWrapper.appendChildren<Element>(this.scheduleFormView, removeButton);
    }

    private createRangeFormItem(): FormItem {
        return new InputBuilder()
            .setName('publish')
            .setLabel(i18n('field.scheduledPublishing'))
            .setHelpText(i18n('field.scheduledPublishing.helptext'))
            .setInputType(DateTimeRange.getName())
            .setOccurrences(new OccurrencesBuilder().setMinimum(1).setMaximum(1).build())
            .setInputTypeConfig({
                labelStart: i18n('field.onlineFrom'),
                labelEnd: i18n('field.onlineTo')
            })
            .setMaximizeUIInputWidth(true)
            .build();
    }

    public layout(validate: boolean) {
        this.scheduleFormView.displayValidationErrors(false);
        this.scheduleFormView.layout(validate);

        this.appendChild(this.scheduleFormWrapper);
    }

    public update(propertySet: PropertySet): Q.Promise<void> {
        return this.scheduleFormView.update(propertySet);
    }

    public setFormVisible(flag: boolean, silent?: boolean) {
        this.scheduleFormWrapper.setVisible(flag);
        this.scheduleFormView.displayValidationErrors(false);   // hide validation

        if (!flag) {
            const data = this.scheduleFormView.getData();
            data.reset();
            this.scheduleFormView.update(data, false);
            this.removeClass('invalid');
        }

        if (!silent) {
            this.notifyFormVisibilityChanged(flag);
        }

        this.updateTogglesState(flag);
    }

    public isFormVisible(): boolean {
        return this.scheduleFormView.isVisible();
    }

    public isFormValid() {
        const isScheduleValid = this.scheduleFormView.isValid();
        const dateSet = this.scheduleFormView.getData().getProperty('publish').getPropertySet();
        if (!isScheduleValid || !dateSet) {
            return false;
        }
        const from = dateSet.getProperty('from', 0);
        const to = dateSet.getProperty('to', 0);
        return from && from.hasNonNullValue() || to && to.hasNonNullValue();
    }

    private notifyFormVisibilityChanged(flag: boolean) {
        this.formVisibilityListeners.forEach(listener => listener(flag));
    }

    public onFormVisibilityChanged(listener: (flag: boolean) => void) {
        this.formVisibilityListeners.push(listener);
    }

    public unFormVisibilityChanged(listener: (flag: boolean) => void) {
        this.formVisibilityListeners = this.formVisibilityListeners.filter(curr => curr !== listener);
    }

    private updateTogglesState(flag: boolean) {
        this.externalToggles.forEach((toggle) => toggle.toggleClass('active', flag));
    }
}
