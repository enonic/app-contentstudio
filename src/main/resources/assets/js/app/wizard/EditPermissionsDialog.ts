import {GetContentRootPermissionsRequest} from '../resource/GetContentRootPermissionsRequest';
import {ApplyContentPermissionsRequest} from '../resource/ApplyContentPermissionsRequest';
import {AccessControlComboBox} from './AccessControlComboBox';
import {GetContentByPathRequest} from '../resource/GetContentByPathRequest';
import {OpenEditPermissionsDialogEvent} from '../event/OpenEditPermissionsDialogEvent';
import {Content} from '../content/Content';
import {AccessControlList} from '../access/AccessControlList';
import {AccessControlEntry} from '../access/AccessControlEntry';
import ModalDialogConfig = api.ui.dialog.ModalDialogConfig;
import ContentPath = api.content.ContentPath;
import i18n = api.util.i18n;
import ContentId = api.content.ContentId;
import TaskProgressInterface = api.ui.dialog.TaskProgressInterface;
import TaskId = api.task.TaskId;
import TaskState = api.task.TaskState;
import ProgressBarManager = api.ui.dialog.ProgressBarManager;
import applyMixins = api.ui.dialog.applyMixins;

export class EditPermissionsDialog
    extends api.ui.dialog.ModalDialog
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

    private inheritPermissionsCheck: api.ui.Checkbox;

    private overwriteChildPermissionsCheck: api.ui.Checkbox;

    private comboBox: AccessControlComboBox;

    private applyAction: api.ui.Action;

    protected header: EditPermissionsDialogHeader;

    pollTask: (taskId: TaskId) => void;

    progressManager: ProgressBarManager;

    isProgressBarEnabled: () => boolean;

    onProgressComplete: (listener: (taskState: TaskState) => void) => void;

    unProgressComplete: (listener: (taskState: TaskState) => void) => void;

    isExecuting: () => boolean;

    private subTitle: api.dom.H6El;

    constructor() {
        super(<ModalDialogConfig>{
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

        this.subTitle = new api.dom.H6El('sub-title').setHtml(`${i18n('dialog.permissions.applying')}...`);
        this.inheritPermissionsCheck = api.ui.Checkbox.create().setLabelText(i18n('dialog.permissions.inherit')).build();
        this.inheritPermissionsCheck.addClass('inherit-perm-check');
        this.comboBox = new AccessControlComboBox();
        this.comboBox.addClass('principal-combobox');
        this.overwriteChildPermissionsCheck = api.ui.Checkbox.create().setLabelText(i18n('dialog.permissions.overwrite')).build();
        this.overwriteChildPermissionsCheck.addClass('overwrite-child-check');
        this.applyAction = new api.ui.Action(i18n('action.apply'));
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

            const permissionsModified: boolean = !api.ObjectHelper.arrayEquals(currentEntries, this.originalValues);
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
            this.comboBox.setReadOnly(this.inheritPermissions);

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
                api.notify.showWarning(i18n('notify.permissions.inheritError', this.displayName));
            }).done();
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildToHeader(this.subTitle);
            this.subTitle.hide();

            this.appendChildToContentPanel(this.inheritPermissionsCheck);

            const section = new api.dom.SectionEl();
            this.appendChildToContentPanel(section);

            const form = new api.ui.form.Form();
            section.appendChild(form);
            form.appendChild(this.comboBox);

            this.appendChildToContentPanel(this.overwriteChildPermissionsCheck);

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

    private getParentPermissions(): wemQ.Promise<AccessControlList> {
        let deferred = wemQ.defer<AccessControlList>();

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
    extends api.ui.dialog.DefaultModalDialogHeader {

    private pathEl: api.dom.PEl;

    constructor(title: string, path: string) {
        super(title);

        this.pathEl = new api.dom.PEl('path');
        this.pathEl.setHtml(path);
        this.appendChild(this.pathEl);
    }

    setPath(path: string) {
        this.pathEl.setHtml(path);
    }
}
