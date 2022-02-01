import Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {PEl} from 'lib-admin-ui/dom/PEl';
import {ModalDialogWithConfirmation, ModalDialogWithConfirmationConfig} from 'lib-admin-ui/ui/dialog/ModalDialogWithConfirmation';
import {TaskId} from 'lib-admin-ui/task/TaskId';
import {TaskState} from 'lib-admin-ui/task/TaskState';
import {H6El} from 'lib-admin-ui/dom/H6El';
import {applyMixins, DefaultModalDialogHeader} from 'lib-admin-ui/ui/dialog/ModalDialog';
import {TaskProgressInterface} from '../dialog/TaskProgressInterface';
import {ProgressBarManager} from '../dialog/ProgressBarManager';

export class EditProjectAccessDialog
    extends ModalDialogWithConfirmation
    implements TaskProgressInterface {

    header: EditProjectAccessDialogHeader;

    pollTask: (taskId: TaskId) => void;

    progressManager: ProgressBarManager;

    isProgressBarEnabled: () => boolean;

    onProgressComplete: (listener: (taskState: TaskState) => void) => void;

    unProgressComplete: (listener: (taskState: TaskState) => void) => void;

    isExecuting: () => boolean;

    setProcessingLabel: (processingLabel: string) => string;

    private projectPath: string;

    private subTitle: H6El;

    constructor() {
        super(<ModalDialogWithConfirmationConfig>{
            confirmation: {},
            class: 'edit-project-access-dialog'
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildToHeader(this.subTitle);

            return rendered;
        });
    }

    setPath(value: string) {
        this.projectPath = value;
    }

    public open() {
        this.getHeader().setPath(this.projectPath ? this.projectPath : '');
        super.open();
    }

    setSuppressNotifications(value: boolean = false) {
        this.progressManager.setSuppressNotifications(value);
    }

    protected initElements() {
        super.initElements();

        TaskProgressInterface.prototype.constructor.call(this, {
            processingLabel: `${i18n('field.progress.applying')}...`,
            managingElement: this
        });

        this.subTitle = new H6El('sub-title').setHtml(`${i18n('dialog.projectAccess.applying')}...`);
    }

    protected createHeader(): EditProjectAccessDialogHeader {
        return new EditProjectAccessDialogHeader(i18n('dialog.projectAccess'), '');
    }

    protected getHeader(): EditProjectAccessDialogHeader {
        return this.header;
    }

    protected handleClickOutside() {
        return;
    }

}

applyMixins(EditProjectAccessDialog, [TaskProgressInterface]);

export class EditProjectAccessDialogHeader
    extends DefaultModalDialogHeader {

    private pathEl: PEl;

    constructor(title: string, path: string) {
        super(title);

        this.pathEl = new PEl('path');
        this.pathEl.setHtml(path);
        this.appendChild(this.pathEl);
    }

    setPath(path: string) {
        this.pathEl.setHtml(path);
    }
}
