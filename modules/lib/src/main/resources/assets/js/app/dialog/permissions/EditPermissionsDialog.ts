import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {TaskState} from '@enonic/lib-admin-ui/task/TaskState';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {AccessControlList} from '../../access/AccessControlList';
import {Content} from '../../content/Content';
import {ContentId} from '../../content/ContentId';
import {ContentPath} from '../../content/ContentPath';
import {TaskProgressManager, WithTaskProgress} from '../TaskProgressManager';
import {OpenEditPermissionsDialogEvent} from '../../event/OpenEditPermissionsDialogEvent';
import {ApplyContentPermissionsRequest} from '../../resource/ApplyContentPermissionsRequest';
import {GetContentByPathRequest} from '../../resource/GetContentByPathRequest';
import {MultiStepDialog, MultiStepDialogConfig} from '@enonic/lib-admin-ui/ui/dialog/multistep/MultiStepDialog';
import {NamesAndIconView} from '@enonic/lib-admin-ui/app/NamesAndIconView';
import {MainAccessStep} from './steps/MainAccessStep';
import {ApplyAccessToStep} from './steps/ApplyAccessToStep';
import {GetDescendantsOfContentsRequest} from '../../resource/GetDescendantsOfContentsRequest';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {SummaryStep} from './steps/SummaryStep';
import {StrategyStep} from './steps/StrategyStep';
import {MenuButton, MenuButtonConfig} from '@enonic/lib-admin-ui/ui/button/MenuButton';
import {DropdownButtonRow} from '@enonic/lib-admin-ui/ui/dialog/DropdownButtonRow';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import * as Q from 'q';
import {PermissionsData} from './PermissionsData';
import {DialogStep} from '@enonic/lib-admin-ui/ui/dialog/multistep/DialogStep';

export class EditPermissionsDialog
    extends MultiStepDialog
    implements WithTaskProgress {

    private contentId: ContentId;

    private contentPath: ContentPath;

    private displayName: string;

    private subTitle: H6El;

    private progressManager: TaskProgressManager;

    private readonly mainStep: MainAccessStep;

    private readonly applyToStep: ApplyAccessToStep;

    private readonly strategyStep: StrategyStep;

    private readonly summaryStep: SummaryStep;

    private menuButton: MenuButton;

    private secondaryAction: Action;

    private backActionMirror: Action;

    constructor() {
        const mainStep = new MainAccessStep();
        const applyToStep = new ApplyAccessToStep();
        const summaryStep = new SummaryStep();
        const strategyStep = new StrategyStep();

        super({
            steps: [mainStep, applyToStep, strategyStep, summaryStep],
            confirmation: {
                yesCallback: () => this.submit(),
                noCallback: () => this.close(),
            },
            buttonRow: new EditPermissionsDialogButtonRow(),
            title: i18n('dialog.permissions.step.title'),
            class: 'edit-permissions-dialog'
        } as MultiStepDialogConfig);

        this.mainStep = mainStep;
        this.applyToStep = applyToStep;
        this.strategyStep = strategyStep;
        this.summaryStep = summaryStep;

        this.mainStep.onDataChanged(() => {
            const isChanged = this.mainStep.isAnyPermissionChanged();
            this.menuButton.setEnabled(isChanged);
            this.backActionMirror.setEnabled(isChanged);
        });

        this.backActionMirror = this.getBackAction();
    }

    protected initElements(): void {
        super.initElements();

        this.progressManager = new TaskProgressManager({
            processingLabel: `${i18n('field.progress.applying')}...`,
            managingElement: this
        });

        this.subTitle = new H6El('sub-title').setHtml(`${i18n('dialog.permissions.applying')}...`);

        this.secondaryAction = new Action().setEnabled(false);

        this.menuButton = this.getButtonRow().makeActionMenu({
            defaultAction: this.getButtonRow().getActions()[2],
            menuActions: [this.secondaryAction]
        });
    }

    protected postInitElements(): void {
        super.postInitElements();

        this.toggleHeaderIcon(true);
    }

    protected initListeners(): void {
        super.initListeners();

        this.onProgressComplete(() => {
            this.subTitle.hide();
        });

        this.secondaryAction.onExecuted(() => {
           if (this.isLastStep()) {
               this.reset();
               this.menuButton.setEnabled(false);
           } else {
               this.submit();
           }
        });
    }

    private getParentPermissions(): Q.Promise<AccessControlList> {
        const parentPath = this.contentPath.getParentPath();

        if (parentPath?.isNotRoot()) {
            return new GetContentByPathRequest(parentPath).sendAndParse().then((content: Content) => {
                return content.getPermissions();
            });
        }

        return Q(new AccessControlList());
    }

    protected submit(): void {
        this.subTitle.show();
        const data = this.collectData();
        const permissions = new AccessControlList(data.permissions);

        const req = new ApplyContentPermissionsRequest().setId(this.contentId).setScope(data.applyTo);

        if (data.strategy === 'merge') {
            req.setAddPermissions(permissions);
        } else {
            req.setPermissions(permissions);
        }

        req.sendAndParse().then((taskId) => {
            this.pollTask(taskId);
        }).done();
    }

    private collectData(): PermissionsData {
        return {
            permissions: this.mainStep.getData(),
            applyTo: this.applyToStep.getData().applyTo,
            strategy: this.strategyStep.getData().strategy,
        }
    }

    setDataAndOpen(event: OpenEditPermissionsDialogEvent): void {
        this.contentId = event.getContentId();
        this.contentPath = event.getContentPath();
        this.displayName = event.getDisplayName();

        new GetDescendantsOfContentsRequest(this.contentPath).sendAndParse().then((ids) => {
            this.applyToStep.setup(ids.length + 1);
            this.secondaryAction.setLabel(i18n('dialog.permissions.step.action.submitNow', ids.length + 1));
        }).catch(DefaultErrorHandler.handle);

        this.getParentPermissions().then((parentPermissions: AccessControlList) => {
            this.open();

            this.mainStep.setup(event.getPermissions().getEntries(), parentPermissions.getEntries());
            this.summaryStep.setup(event.getPermissions().getEntries());
        }).catch(() => {
            showWarning(i18n('notify.permissions.inheritError', this.displayName));
        }).done();
    }

    protected showStep(step: DialogStep) {
        super.showStep(step);

        if (this.isLastStep()) {
            this.summaryStep.setCurrentData(this.collectData());
        }

        if (this.isFirstStep()) {
            this.backActionMirror.setLabel(i18n('dialog.permissions.step.action.reset'));
            this.backActionMirror.setEnabled(this.mainStep.isAnyPermissionChanged());
        } else {
            this.backActionMirror.setEnabled(true).setLabel(i18n('dialog.multistep.previous'));
        }

    }

    protected createHeaderContent(): NamesAndIconView {
        return super.createHeaderContent().setIconClass('icon-user-check');
    }

    protected handleHidden(): void {
        super.handleHidden();

        this.reset();

        this.secondaryAction.setLabel(i18n('dialog.permissions.step.action.submitNow', '?'));
    }

    protected reset(): void {
        this.showStep(this.mainStep);
        this.mainStep.reset();
        this.applyToStep.reset();
        this.strategyStep.reset();
        this.backActionMirror.setEnabled(false);
    }

    protected showPreviousStep(): void {
        if (this.isFirstStep()) {
            this.mainStep.reset();
        } else {
            super.showPreviousStep();
        }
    }

    getButtonRow(): EditPermissionsDialogButtonRow {
        return super.getButtonRow() as EditPermissionsDialogButtonRow;
    }

    private getBackAction(): Action {
        return this.getButtonRow().getActions()[1];
    }

    isDirty(): boolean {
        return this.mainStep.isAnyPermissionChanged();
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

class EditPermissionsDialogButtonRow
    extends DropdownButtonRow {

    makeActionMenu(menuButtonConfig: MenuButtonConfig, useDefault: boolean = true): MenuButton {
        super.makeActionMenu(menuButtonConfig, useDefault);

        return this.actionMenu.addClass('edit-permissions-dialog-menu') as MenuButton;
    }

}
