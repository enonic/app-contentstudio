import PropertySet = api.data.PropertySet;
import FormItem = api.form.FormItem;
import i18n = api.util.i18n;
import ModalDialog = api.ui.dialog.ModalDialog;
import ModalDialogConfig = api.ui.dialog.ModalDialogConfig;
import Action = api.ui.Action;

export abstract class SchedulableDialog
    extends ModalDialog {

    propertySet: PropertySet;

    formView: api.form.FormView;

    confirmScheduleAction: Action;

    onScheduleCallback: () => void;

    constructor(config: ModalDialogConfig) {
        super(config);
    }

    protected initElements() {
        super.initElements();

        this.initConfirmScheduleAction();
        this.initFormView();
    }

    protected initListeners() {
        super.initListeners();

        this.confirmScheduleAction.onExecuted(() => {
            let validationRecording = this.formView.validate();
            if (validationRecording.isValid()) {
                this.close();
                if (this.onScheduleCallback) {
                    this.onScheduleCallback();
                }
            } else {
                this.confirmScheduleAction.setEnabled(false);
                this.formView.displayValidationErrors(true);
            }

            this.updateTabbable(); // in case schedule button gets enabled/disabled
        });

        this.formView.onValidityChanged((event: api.form.FormValidityChangedEvent) => {
            this.confirmScheduleAction.setEnabled(event.isValid());
            this.formView.displayValidationErrors(true);
        });

        this.propertySet.onChanged(() => {
            this.formView.validate();
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            return this.formView.layout().then(() => {
                this.appendChildToContentPanel(this.formView);
                this.addAction(this.confirmScheduleAction, true, true);

                return rendered;
            });
        });
    }

    public resetDates() {
        this.propertySet.reset();
        this.formView.update(this.propertySet);
        this.formView.validate();
    }

    public onSchedule(onScheduleCallback: () => void) {
        this.onScheduleCallback = onScheduleCallback;
    }

    public getFromDate(): Date {
        const from = this.propertySet.getDateTime('from');
        return from && from.toDate();
    }

    public getToDate(): Date {
        const to = this.propertySet.getDateTime('to');
        return to && to.toDate();
    }

    protected abstract createRangeFormItem(): FormItem;

    private initFormView() {
        const formBuilder = new api.form.FormBuilder().addFormItem(this.createRangeFormItem());

        this.propertySet = new api.data.PropertyTree().getRoot();
        this.formView = new api.form.FormView(api.form.FormContext.create().build(), formBuilder.build(), this.propertySet);
    }

    private initConfirmScheduleAction() {
        this.confirmScheduleAction = new Action(i18n('action.schedule'));
        this.confirmScheduleAction.setIconClass('confirm-schedule-action');
    }
}
