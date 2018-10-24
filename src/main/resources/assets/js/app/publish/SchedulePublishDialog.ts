import AEl = api.dom.AEl;
import i18n = api.util.i18n;
import FormItem = api.form.FormItem;
import {PublishFrom} from '../inputtype/publish/PublishFrom';
import {PublishToFuture} from '../inputtype/publish/PublishToFuture';
import {SchedulableDialog} from '../dialog/SchedulableDialog';

export class SchedulePublishDialog
    extends SchedulableDialog {

    private onCloseCallback: () => void;

    constructor() {
        super(<api.ui.dialog.ModalDialogConfig>{
            title: i18n('dialog.schedule')
        });
        this.getEl().addClass('schedule-publish-dialog');

        this.addSubtitle();

        this.createBackButton();
    }

    show() {
        this.resetDates();
        this.formView.displayValidationErrors(false);
        this.confirmScheduleButton.getAction().setEnabled(true);
        super.show();
    }

    close() {
        super.close();
        this.remove();
        if (this.onCloseCallback) {
            this.onCloseCallback();
        }
    }

    onClose(onCloseCallback: () => void) {
        this.onCloseCallback = onCloseCallback;
    }

    protected createFromFormItem(): FormItem {
        return new api.form.InputBuilder().setName('from').setInputType(PublishFrom.getName()).setLabel(
            i18n('field.onlineFrom')).setHelpText(i18n('field.onlineFrom.help')).setOccurrences(
            new api.form.OccurrencesBuilder().setMinimum(1).setMaximum(1).build()).setInputTypeConfig({}).setMaximizeUIInputWidth(
            true).build();
    }

    protected createToFormItem(): FormItem {
        return new api.form.InputBuilder().setName('to').setInputType(PublishToFuture.getName()).setLabel(
            i18n('field.onlineTo')).setHelpText(i18n('field.onlineTo.help')).setOccurrences(
            new api.form.OccurrencesBuilder().setMinimum(0).setMaximum(1).build()).setInputTypeConfig({}).setMaximizeUIInputWidth(
            true).build();
    }

    protected hasSubDialog(): boolean {
        return true;
    }

    private createBackButton() {
        const backButton: AEl = new AEl('back-button').setTitle(i18n('action.back'));

        this.prependChildToHeader(backButton);

        backButton.onClicked(() => {
            this.close();
        });
    }

    private addSubtitle() {
        this.appendChildToHeader(
            new api.dom.H6El('schedule-publish-dialog-subtitle').setHtml(i18n('dialog.schedule.subname'), false));
    }
}
