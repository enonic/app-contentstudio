import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {PEl} from '@enonic/lib-admin-ui/dom/PEl';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {TaskState} from '@enonic/lib-admin-ui/task/TaskState';
import {DefaultModalDialogHeader} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';
import {ModalDialogWithConfirmation, ModalDialogWithConfirmationConfig} from '@enonic/lib-admin-ui/ui/dialog/ModalDialogWithConfirmation';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import Q from 'q';
import {TaskProgressManager, WithTaskProgress} from '../dialog/TaskProgressManager';

export class EditProjectAccessDialog
    extends ModalDialogWithConfirmation
    implements WithTaskProgress {

    declare header: EditProjectAccessDialogHeader;

    private projectPath: string;

    private subTitle: H6El;

    private progressManager: TaskProgressManager;

    constructor() {
        super({
            confirmation: {},
            class: 'edit-project-access-dialog'
        } as ModalDialogWithConfirmationConfig);
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

        this.progressManager = new TaskProgressManager({
            processingLabel: `${i18n('field.progress.applying')}...`,
            managingElement: this
        });

        this.subTitle = new H6El('sub-title').setHtml(`${i18n('dialog.projectAccess.applying')}...`);
    }

    isProgressBarEnabled(): boolean {
        return this.progressManager.isProgressBarEnabled();
    }

    pollTask(taskId: TaskId): void {
        this.progressManager.pollTask(taskId);
    }

    onProgressComplete(listener: (taskState: TaskState) => void): void {
        this.progressManager.onProgressComplete(listener);
    }

    unProgressComplete(listener: (taskState: TaskState) => void): void {
        this.progressManager.unProgressComplete(listener);
    }

    isExecuting(): boolean {
        return this.progressManager.isExecuting();
    }

    setProcessingLabel(processingLabel: string): void {
        this.progressManager.setProcessingLabel(processingLabel);
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

export class EditProjectAccessDialogHeader extends DefaultModalDialogHeader {
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
