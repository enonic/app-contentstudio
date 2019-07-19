import AEl = api.dom.AEl;
import i18n = api.util.i18n;
import FormItem = api.form.FormItem;
import DateTimeRange = api.form.inputtype.time.DateTimeRange;
import {SchedulableDialog} from '../dialog/SchedulableDialog';

export class SchedulePublishDialog
    extends SchedulableDialog {

    private backButton: AEl;
    private onCloseCallback: () => void;

    constructor() {
        super(<api.ui.dialog.ModalDialogConfig>{
            title: i18n('dialog.schedule'),
            class: 'schedule-publish-dialog'
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addSubtitle();
            this.prependChildToHeader(this.backButton);

            return rendered;
        });
    }

    protected initElements() {
        super.initElements();

        this.backButton = new AEl('back-button').setTitle(i18n('action.back'));
    }

    protected initListeners() {
        super.initListeners();

        this.backButton.onClicked(() => {
            this.close();
        });
    }

    show() {
        this.resetDates();
        this.formView.displayValidationErrors(false);
        this.confirmScheduleAction.setEnabled(true);
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

    protected createRangeFormItem(): FormItem {
        return new api.form.InputBuilder()
            .setName('publish')
            .setInputType(DateTimeRange.getName())
            .setOccurrences(new api.form.OccurrencesBuilder().setMinimum(0).setMaximum(1).build())
            .setInputTypeConfig({
                labelStart: i18n('field.onlineFrom'),
                labelEnd: i18n('field.onlineTo')
            })
            .setHelpText(i18n('field.onlineFrom.help'))
            .setMaximizeUIInputWidth(true)
            .build();
    }

    private addSubtitle() {
        this.appendChildToHeader(
            new api.dom.H6El('schedule-publish-dialog-subtitle').setHtml(i18n('dialog.schedule.subname'), false));
    }
}
