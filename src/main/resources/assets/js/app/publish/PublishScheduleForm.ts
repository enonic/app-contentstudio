import PropertySet = api.data.PropertySet;
import FormItem = api.form.FormItem;
import DateTimeRange = api.form.inputtype.time.DateTimeRange;
import i18n = api.util.i18n;

export class PublishScheduleForm
    extends api.dom.DivEl {

    private scheduleFormView: api.form.FormView;
    private scheduleFormWrapper: api.dom.DivEl;
    private formVisibilityListeners: { (flag: boolean): void }[] = [];
    private scheduleNote: api.dom.H6El;
    private externalToggles: api.dom.ButtonEl[] = [];

    createExternalToggle(): api.dom.ButtonEl {
        const b = new api.dom.ButtonEl();
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
            this.scheduleFormView.validate(false, true);
            this.scheduleFormView.displayValidationErrors(this.scheduleFormView.isVisible());
        });

        const scheduleForm = new api.form.FormBuilder().addFormItem(this.createRangeFormItem()).build();
        this.scheduleFormView = new api.form.FormView(api.form.FormContext.create().build(), scheduleForm, propertySet);

        const removeButton = new api.dom.AEl('remove-button');
        removeButton.onClicked((event: MouseEvent) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.setFormVisible(false);
        });

        this.scheduleFormWrapper = new api.dom.DivEl('form-wrapper');
        this.scheduleFormWrapper.appendChildren<api.dom.Element>(this.scheduleFormView, removeButton);
    }

    private createRangeFormItem(): FormItem {
        return new api.form.InputBuilder()
            .setName('publish')
            .setInputType(DateTimeRange.getName())
            .setOccurrences(new api.form.OccurrencesBuilder().setMinimum(1).setMaximum(1).build())
            .setInputTypeConfig({
                labelStart: i18n('field.onlineFrom'),
                labelEnd: i18n('field.onlineTo')
            })
            .setMaximizeUIInputWidth(true)
            .build();
    }

    public setScheduleNote(text: string) {
        if (!this.scheduleNote) {
            this.scheduleNote = new api.dom.H6El('schedule-note');
            this.scheduleFormWrapper.prependChild(this.scheduleNote);
        }
        this.scheduleNote.setHtml(text, false);
    }

    public layout(validate: boolean) {
        this.scheduleFormView.displayValidationErrors(false);
        this.scheduleFormView.layout(validate);

        this.appendChild(this.scheduleFormWrapper);
    }

    public update(propertySet: PropertySet): wemQ.Promise<void> {
        return this.scheduleFormView.update(propertySet);
    }

    public setFormVisible(flag: boolean, silent?: boolean) {
        this.scheduleFormWrapper.setVisible(flag);
        this.scheduleFormView.displayValidationErrors(false);   // hide validation

        if (!flag) {
            const data = this.scheduleFormView.getData();
            data.reset();
            this.scheduleFormView.update(data, false);
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
