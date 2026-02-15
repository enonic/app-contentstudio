import {type PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {type FormItem} from '@enonic/lib-admin-ui/form/FormItem';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ModalDialog, type ModalDialogConfig} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {FormView} from '@enonic/lib-admin-ui/form/FormView';
import {FormBuilder} from '@enonic/lib-admin-ui/form/Form';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {FormContext} from '@enonic/lib-admin-ui/form/FormContext';
import {type FormValidityChangedEvent} from '@enonic/lib-admin-ui/form/FormValidityChangedEvent';

export abstract class SchedulableDialog
    extends ModalDialog {

    propertySet: PropertySet;

    formView: FormView;

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
            const validationRecording = this.formView.validate();
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

        this.formView.onValidityChanged((event: FormValidityChangedEvent) => {
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
        const formBuilder = new FormBuilder().addFormItem(this.createRangeFormItem());

        this.propertySet = new PropertyTree().getRoot();
        this.formView = new FormView(FormContext.create().build(), formBuilder.build(), this.propertySet);
    }

    private initConfirmScheduleAction() {
        this.confirmScheduleAction = new Action(i18n('action.schedule'));
        this.confirmScheduleAction.setIconClass('confirm-schedule-action');
    }
}
