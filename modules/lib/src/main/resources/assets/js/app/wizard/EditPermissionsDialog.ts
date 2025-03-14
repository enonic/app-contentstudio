import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {PEl} from '@enonic/lib-admin-ui/dom/PEl';
import {SectionEl} from '@enonic/lib-admin-ui/dom/SectionEl';
import {showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {TaskState} from '@enonic/lib-admin-ui/task/TaskState';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {Checkbox} from '@enonic/lib-admin-ui/ui/Checkbox';
import {DefaultModalDialogHeader} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';
import {ModalDialogWithConfirmation, ModalDialogWithConfirmationConfig} from '@enonic/lib-admin-ui/ui/dialog/ModalDialogWithConfirmation';
import {Form} from '@enonic/lib-admin-ui/ui/form/Form';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {AccessControlEntry} from '../access/AccessControlEntry';
import {AccessControlList} from '../access/AccessControlList';
import {Content} from '../content/Content';
import {ContentId} from '../content/ContentId';
import {ContentPath} from '../content/ContentPath';
import {TaskProgressManager, WithTaskProgress} from '../dialog/TaskProgressManager';
import {OpenEditPermissionsDialogEvent} from '../event/OpenEditPermissionsDialogEvent';
import {ApplyContentPermissionsRequest} from '../resource/ApplyContentPermissionsRequest';
import {GetContentByPathRequest} from '../resource/GetContentByPathRequest';
import {GetContentRootPermissionsRequest} from '../resource/GetContentRootPermissionsRequest';
import {AccessControlComboBox} from './AccessControlComboBox';

export class EditPermissionsDialog
    extends ModalDialogWithConfirmation
    implements WithTaskProgress {

    private contentId: ContentId;

    private contentPath: ContentPath;

    private displayName: string;

    private permissions: AccessControlList;

    private inheritPermissions: boolean;

    private overwritePermissions: boolean;

    private parentPermissions: AccessControlEntry[];

    private originalValues: AccessControlEntry[];

    private originalInherit: boolean;

    private originalOverwrite: boolean;

    private inheritPermissionsCheck: Checkbox;

    private overwriteChildPermissionsCheck: Checkbox;

    private comboBox: AccessControlComboBox;

    private applyAction: Action;

    protected header: EditPermissionsDialogHeader;

    private subTitle: H6El;

    private changeListener: () => void;

    private comboBoxChangeListener: () => void;

    private progressManager: TaskProgressManager;

    constructor() {
        super({
            confirmation: {
                yesCallback: () => this.applyAction.execute(),
                noCallback: () => this.close(),
            },
            class: 'edit-permissions-dialog'
        } as ModalDialogWithConfirmationConfig);
    }

    protected initElements() {
        super.initElements();

        this.progressManager = new TaskProgressManager({
            processingLabel: `${i18n('field.progress.applying')}...`,
            managingElement: this
        });

        this.subTitle = new H6El('sub-title').setHtml(`${i18n('dialog.permissions.applying')}...`);
        this.inheritPermissionsCheck = Checkbox.create().setLabelText(i18n('dialog.permissions.inherit')).build();
        this.inheritPermissionsCheck.addClass('inherit-perm-check');
        this.comboBox = new AccessControlComboBox();
        this.comboBox.addClass('principal-combobox');
        this.overwriteChildPermissionsCheck = Checkbox.create().setLabelText(i18n('dialog.permissions.overwrite')).build();
        this.overwriteChildPermissionsCheck.addClass('overwrite-child-check');
        this.applyAction = new Action(i18n('action.apply'));
        this.parentPermissions = [];
    }

    protected postInitElements() {
        super.postInitElements();

        this.setElementToFocusOnShow(this.inheritPermissionsCheck);
    }

    protected initListeners() {
        super.initListeners();

        this.onProgressComplete(() => {
            this.subTitle.hide();
        });

        this.comboBoxChangeListener = () => {
            const currentEntries: AccessControlEntry[] = this.getEntries().sort();

            const permissionsModified: boolean = !ObjectHelper.arrayEquals(currentEntries, this.originalValues);
            const inheritCheckModified: boolean = this.inheritPermissionsCheck.isChecked() !== this.originalInherit;
            const overwriteModified: boolean = this.overwriteChildPermissionsCheck.isChecked() !== this.originalOverwrite;
            const isNotEmpty: boolean = currentEntries && currentEntries.length > 0;

            this.applyAction.setEnabled((permissionsModified || inheritCheckModified || overwriteModified) && isNotEmpty);
            this.notifyResize();
        };

        this.changeListener = () => {
            this.inheritPermissions = this.inheritPermissionsCheck.isChecked();

            this.comboBox.toggleClass('disabled', this.inheritPermissions);
            if (this.inheritPermissions) {
                this.layoutInheritedPermissions();
            } else {
                this.layoutOriginalPermissions();
            }

            this.comboBox.setEnabled(!this.inheritPermissions);

            this.comboBoxChangeListener();
        };

        this.inheritPermissionsCheck.onValueChanged(this.changeListener);

        this.applyAction.onExecuted(() => {
            this.applyPermissions();
        });

        this.comboBox.onOptionValueChanged(this.comboBoxChangeListener);
        this.comboBox.onSelectionChanged(this.comboBoxChangeListener);
        this.overwriteChildPermissionsCheck.onValueChanged(this.comboBoxChangeListener);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildToHeader(this.subTitle);
            this.subTitle.hide();

            this.appendChildToContentPanel(this.inheritPermissionsCheck);

            const section = new SectionEl();
            this.appendChildToContentPanel(section);

            const form = new Form();
            section.appendChild(form);
            form.appendChild(this.comboBox);

            this.prependChildToFooter(this.overwriteChildPermissionsCheck);

            this.addAction(this.applyAction, true);
            this.addCancelButtonToBottom();

            return rendered;
        });
    }

    protected createHeader(): EditPermissionsDialogHeader {
        return new EditPermissionsDialogHeader(i18n('dialog.permissions'), '');
    }

    protected getHeader(): EditPermissionsDialogHeader {
        return this.header;
    }

    private setUpDialog() {
        this.overwriteChildPermissionsCheck.setChecked(false);

        let contentPermissionsEntries: AccessControlEntry[] = this.permissions.getEntries();
        this.originalValues = contentPermissionsEntries.sort();
        this.originalInherit = this.inheritPermissions;
        this.originalOverwrite = this.overwritePermissions;

        this.layoutOriginalPermissions();

        this.inheritPermissionsCheck.setChecked(this.inheritPermissions);

        this.comboBox.giveFocus();
    }

    private layoutInheritedPermissions() {
        this.comboBox.deselectAll(true);
        this.parentPermissions.forEach((item) => {
            this.comboBox.select(item, true);
        });
    }

    private layoutOriginalPermissions() {
        this.comboBox.deselectAll(true);

        this.originalValues.forEach((item) => {
            this.comboBox.select(item, true);
        });
    }

    private getEntries(): AccessControlEntry[] {
        return this.comboBox.getSelectedOptions().map((item) => item.getOption().getDisplayValue());
    }

    private getParentPermissions(): Q.Promise<AccessControlList> {
        let deferred = Q.defer<AccessControlList>();

        let parentPath = this.contentPath.getParentPath();
        if (parentPath && parentPath.isNotRoot()) {
            new GetContentByPathRequest(parentPath).sendAndParse().then((content: Content) => {
                deferred.resolve(content.getPermissions());
            }).catch((reason) => {
                deferred.reject(new Error(i18n('notify.permissions.inheritError', this.contentPath.toString())));
            }).done();
        } else {
            new GetContentRootPermissionsRequest().sendAndParse().then((rootPermissions: AccessControlList) => {
                deferred.resolve(rootPermissions);
            }).catch((reason) => {
                deferred.reject(new Error(i18n('notify.permissions.inheritError', this.contentPath.toString())));
            }).done();
        }

        return deferred.promise;
    }

    show() {
        if (this.contentPath) {
            this.getHeader().setPath(this.contentPath.toString());
        } else {
            this.getHeader().setPath('');
        }
        super.show();

        if (this.comboBox.isVisible()) {
            this.comboBox.giveFocus();
        } else {
            this.inheritPermissionsCheck.giveFocus();
        }
    }

    isDirty(): boolean {
        return this.applyAction.isEnabled();
    }

    private applyPermissions() {

        this.subTitle.show();

        const permissions = new AccessControlList(this.getEntries());

        const req = new ApplyContentPermissionsRequest().setId(this.contentId).setInheritPermissions(
            this.inheritPermissionsCheck.isChecked()).setPermissions(permissions).setOverwriteChildPermissions(
            this.overwriteChildPermissionsCheck.isChecked());
        req.sendAndParse().then((taskId) => {
            this.pollTask(taskId);
        }).done();
    }

    setDataAndOpen(event: OpenEditPermissionsDialogEvent): void {
        this.contentId = event.getContentId();
        this.contentPath = event.getContentPath();
        this.displayName = event.getDisplayName();
        this.permissions = event.getPermissions();
        this.inheritPermissions = event.isInheritPermissions();
        this.overwritePermissions = event.isOverwritePermissions();

        this.getParentPermissions().then((parentPermissions: AccessControlList) => {
            this.parentPermissions = parentPermissions.getEntries();

            this.open();

            this.setUpDialog();

            this.overwriteChildPermissionsCheck.setChecked(this.overwritePermissions, true);

            this.changeListener();

        }).catch(() => {
            showWarning(i18n('notify.permissions.inheritError', this.displayName));
        }).done();
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
}

export class EditPermissionsDialogHeader extends DefaultModalDialogHeader {
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
