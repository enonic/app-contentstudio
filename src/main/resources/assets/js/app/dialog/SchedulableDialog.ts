import PropertySet = api.data.PropertySet;
import FormItem = api.form.FormItem;
import i18n = api.util.i18n;
import ModalDialog = api.ui.dialog.ModalDialog;
import ModalDialogConfig = api.ui.dialog.ModalDialogConfig;

export abstract class SchedulableDialog
    extends ModalDialog {

    propertySet: PropertySet;

    formView: api.form.FormView;

    confirmScheduleButton: api.ui.dialog.DialogButton;

    onScheduleCallback: () => void;

    constructor(config: ModalDialogConfig) {
        super(config);

        this.initConfirmScheduleAction();

        this.initFormView();
        this.layoutFormView();
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
        let from = this.propertySet.getDateTime('from');
        return from && from.toDate();
    }

    public getToDate(): Date {
        let to = this.propertySet.getDateTime('to');
        return to && to.toDate();
    }

    protected abstract createFromFormItem(): FormItem;

    protected abstract createToFormItem(): FormItem;

    private initFormView() {
        let formBuilder = new api.form.FormBuilder().addFormItem(this.createFromFormItem()).addFormItem(this.createToFormItem());

        this.propertySet = new api.data.PropertyTree().getRoot();
        this.formView = new api.form.FormView(api.form.FormContext.create().build(), formBuilder.build(), this.propertySet);

    }

    private layoutFormView(): wemQ.Promise<boolean> {
        return this.formView.layout().then(() => {
            this.formView.onValidityChanged((event: api.form.FormValidityChangedEvent) => {
                this.confirmScheduleButton.getAction().setEnabled(event.isValid());
                this.formView.displayValidationErrors(true);
            });
            this.propertySet.onChanged(() => {
                this.formView.validate();
            });
            this.appendChildToContentPanel(this.formView);

            return true;
        });
    }

    private initConfirmScheduleAction() {
        const confirmScheduleAction = new api.ui.Action(i18n('action.schedule'));

        confirmScheduleAction.setIconClass('confirm-schedule-action');
        confirmScheduleAction.onExecuted(() => {
            let validationRecording = this.formView.validate();
            if (validationRecording.isValid()) {
                this.close();
                if (this.onScheduleCallback) {
                    this.onScheduleCallback();
                }
            } else {
                confirmScheduleAction.setEnabled(false);
                this.formView.displayValidationErrors(true);
            }
        });

        this.confirmScheduleButton = this.addAction(confirmScheduleAction, true, true);
    }
}
