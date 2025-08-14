import {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {AEl} from '@enonic/lib-admin-ui/dom/AEl';
import {ButtonEl} from '@enonic/lib-admin-ui/dom/ButtonEl';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {FormBuilder} from '@enonic/lib-admin-ui/form/Form';
import {FormContext} from '@enonic/lib-admin-ui/form/FormContext';
import {FormItem} from '@enonic/lib-admin-ui/form/FormItem';
import {FormView} from '@enonic/lib-admin-ui/form/FormView';
import {InputBuilder} from '@enonic/lib-admin-ui/form/Input';
import {DateTimeRange} from '@enonic/lib-admin-ui/form/inputtype/time/DateTimeRange';
import {OccurrencesBuilder} from '@enonic/lib-admin-ui/form/Occurrences';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import Q from 'q';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';

export class PublishScheduleForm
    extends DivEl {

    private scheduleFormView: FormView;
    private scheduleFormWrapper: DivEl;
    private formVisibilityListeners: ((flag: boolean) => void)[] = [];
    private externalToggles: ButtonEl[] = [];

    createExternalToggle(): ButtonEl {
        const b = new ButtonEl();
        b.setClass('icon icon-calendar schedule-control');
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

        const removeButton = new AEl('remove-button icon-close');
        removeButton.onClicked((event: MouseEvent) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.setFormVisible(false);
        });

        this.scheduleFormWrapper = new DivEl('form-wrapper');
        this.scheduleFormWrapper.appendChildren<Element>(this.scheduleFormView, removeButton);
    }

    private createRangeFormItem(): FormItem {
        const fromTime = CONFIG.has('defaultPublishFromTime') ? CONFIG.getString('defaultPublishFromTime') : '12:00';

        return new InputBuilder()
            .setName('publish')
            .setLabel(i18n('field.scheduledPublishing'))
            .setHelpText(i18n('field.scheduledPublishing.helptext'))
            .setInputType(DateTimeRange.getName())
            .setOccurrences(new OccurrencesBuilder().setMinimum(1).setMaximum(1).build())
            .setInputTypeConfig({
                fromLabel: i18n('field.onlineFrom'),
                toLabel: i18n('field.onlineTo'),
                defaultFromTime: fromTime,
                fromPlaceholder: i18n('text.now'),
                optionalFrom: true
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

        if (!flag) {
            const data: PropertySet = this.scheduleFormView.getData();
            data.reset();

            if (this.scheduleFormView.isRendered()) {
                this.scheduleFormView.update(data, false);
                this.scheduleFormView.reset();
            }

            this.removeClass('invalid');
        }

        this.scheduleFormView.displayValidationErrors(false);   // hide validation

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

    public whenFormLayoutFinished(callback: () => void) {
        this.scheduleFormView.whenLayoutFinished(callback);
    }
}
