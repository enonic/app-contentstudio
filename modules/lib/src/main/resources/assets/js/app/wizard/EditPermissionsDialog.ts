import * as Q from 'q';
import {showWarning} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {PEl} from 'lib-admin-ui/dom/PEl';
import {Action} from 'lib-admin-ui/ui/Action';
import {GetContentRootPermissionsRequest} from '../resource/GetContentRootPermissionsRequest';
import {ApplyContentPermissionsRequest} from '../resource/ApplyContentPermissionsRequest';
import {AccessControlComboBox} from './AccessControlComboBox';
import {GetContentByPathRequest} from '../resource/GetContentByPathRequest';
import {OpenEditPermissionsDialogEvent} from '../event/OpenEditPermissionsDialogEvent';
import {Content} from '../content/Content';
import {AccessControlList} from '../access/AccessControlList';
import {AccessControlEntry} from '../access/AccessControlEntry';
import {
    ModalDialogWithConfirmation,
    ModalDialogWithConfirmationConfig
} from 'lib-admin-ui/ui/dialog/ModalDialogWithConfirmation';
import {TaskProgressInterface} from 'lib-admin-ui/ui/dialog/TaskProgressInterface';
import {TaskId} from 'lib-admin-ui/task/TaskId';
import {TaskState} from 'lib-admin-ui/task/TaskState';
import {ProgressBarManager} from 'lib-admin-ui/ui/dialog/ProgressBarManager';
import {Checkbox} from 'lib-admin-ui/ui/Checkbox';
import {H6El} from 'lib-admin-ui/dom/H6El';
import {SectionEl} from 'lib-admin-ui/dom/SectionEl';
import {Form} from 'lib-admin-ui/ui/form/Form';
import {applyMixins, DefaultModalDialogHeader} from 'lib-admin-ui/ui/dialog/ModalDialog';

export class EditPermissionsDialog
    extends ModalDialogWithConfirmation
    implements TaskProgressInterface {

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

    pollTask: (taskId: TaskId) => void;

    progressManager: ProgressBarManager;

    isProgressBarEnabled: () => boolean;

    onProgressComplete: (listener: (taskState: TaskState) => void) => void;

    unProgressComplete: (listener: (taskState: TaskState) => void) => void;

    isExecuting: () => boolean;

    private subTitle: H6El;

    constructor() {
        super(<ModalDialogWithConfirmationConfig>{
            confirmation: {
                yesCallback: () => this.applyAction.execute(),
                noCallback: () => this.close(),
            },
            class: 'edit-permissions-dialog'
        });
    }

    protected initElements() {
        super.initElements();

        TaskProgressInterface.prototype.constructor.call(this, {
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

        const comboBoxChangeListener = () => {
            const currentEntries: AccessControlEntry[] = this.getEntries().sort();

            const permissionsModified: boolean = !ObjectHelper.arrayEquals(currentEntries, this.originalValues);
            const inheritCheckModified: boolean = this.inheritPermissionsCheck.isChecked() !== this.originalInherit;
            const overwriteModified: boolean = this.overwriteChildPermissionsCheck.isChecked() !== this.originalOverwrite;
            const isNotEmpty: boolean = currentEntries && currentEntries.length > 0;

            this.applyAction.setEnabled((permissionsModified || inheritCheckModified || overwriteModified) && isNotEmpty);
            this.notifyResize();
        };

        const changeListener = () => {
            this.inheritPermissions = this.inheritPermissionsCheck.isChecked();

            this.comboBox.toggleClass('disabled', this.inheritPermissions);
            if (this.inheritPermissions) {
                this.layoutInheritedPermissions();
            } else {
                this.layoutOriginalPermissions();
            }

            this.comboBox.getComboBox().setVisible(!this.inheritPermissions);
            this.comboBox.setEnabled(!this.inheritPermissions);

            comboBoxChangeListener();
        };

        this.inheritPermissionsCheck.onValueChanged(changeListener);

        this.applyAction.onExecuted(() => {
            this.applyPermissions();
        });

        this.comboBox.onOptionValueChanged(comboBoxChangeListener);
        this.comboBox.onOptionSelected(comboBoxChangeListener);
        this.comboBox.onOptionDeselected(comboBoxChangeListener);
        this.overwriteChildPermissionsCheck.onValueChanged(comboBoxChangeListener);

        OpenEditPermissionsDialogEvent.on((event) => {
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

                changeListener();

            }).catch(() => {
                showWarning(i18n('notify.permissions.inheritError', this.displayName));
            }).done();
        });
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
        this.comboBox.clearSelection(true);
        this.parentPermissions.forEach((item) => {
            if (!this.comboBox.isSelected(item)) {
                this.comboBox.select(item);
            }
        });
    }

    private layoutOriginalPermissions() {
        this.comboBox.clearSelection(true);
        this.originalValues.forEach((item) => {
            if (!this.comboBox.isSelected(item)) {
                this.comboBox.select(item);
            }
        });
    }

    private getEntries(): AccessControlEntry[] {
        return this.comboBox.getSelectedDisplayValues();
    }

    private getParentPermissions(): Q.Promise<AccessControlList> {
        let deferred = Q.defer<AccessControlList>();

        let parentPath = this.contentPath.getParentPath();
        if (parentPath && parentPath.isNotRoot()) {
            new GetContentByPathRequest(parentPath).sendAndParse().then((content: Content) => {
                deferred.resolve(content.getPermissions());
            }).catch((reason: any) => {
                deferred.reject(new Error(i18n('notify.permissions.inheritError', this.contentPath.toString())));
            }).done();
        } else {
            new GetContentRootPermissionsRequest().sendAndParse().then((rootPermissions: AccessControlList) => {
                deferred.resolve(rootPermissions);
            }).catch((reason: any) => {
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

        if (this.comboBox.getComboBox().isVisible()) {
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
}

applyMixins(EditPermissionsDialog, [TaskProgressInterface]);

export class EditPermissionsDialogHeader
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
