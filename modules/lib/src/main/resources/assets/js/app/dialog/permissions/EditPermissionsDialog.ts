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
import {AccessControlEntry} from '../../access/AccessControlEntry';
import {Permission} from '../../access/Permission';

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

    private hasNoChildren: boolean;

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
            this.secondaryAction.setEnabled(isChanged);
        });

        this.applyToStep.onDataChanged(() => {
           const applyTo = this.applyToStep.getData().applyTo;
           this.strategyStep.setStrategy(applyTo === 'single' ? 'reset' : 'merge');
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
            this.submit();
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
            this.hasNoChildren = ids.length === 0;

            this.applyToStep.setup(ids.length);
            this.strategyStep.setStrategy(this.hasNoChildren ? 'reset' : 'merge');
            this.secondaryAction.setLabel(i18n('dialog.permissions.step.action.submitNow', ids.length + 1));
        }).catch(DefaultErrorHandler.handle);

        this.getParentPermissions().then((parentPermissions: AccessControlList) => {
            this.open();

            const originalValuesWithoutRedundant = this.removeRedundantPermissions(event.getPermissions().getEntries());
            const parentPermissionsWithoutRedundant = this.removeRedundantPermissions(parentPermissions.getEntries());

            this.mainStep.setup(originalValuesWithoutRedundant, parentPermissionsWithoutRedundant);
            this.summaryStep.setup(originalValuesWithoutRedundant);
            this.strategyStep.setup(originalValuesWithoutRedundant);
        }).catch(() => {
            showWarning(i18n('notify.permissions.inheritError', this.displayName));
        }).done();
    }

    protected showNextStep(): void {
        if ((this.isFirstStep() && this.hasNoChildren) || (this.isApplyToStep() && this.isApplyToSingleSelected())) {
            this.showStep(this.summaryStep); // jump to the summary step if no children
        } else {
            super.showNextStep();
        }
    }

    private isApplyToStep(): boolean {
        return this.currentStep === this.applyToStep;
    }

    private isApplyToSingleSelected(): boolean {
        return this.applyToStep.getData().applyTo === 'single';
    }

    protected showStep(step: DialogStep): void {
        super.showStep(step);

        const isLastStep = this.isLastStep();
        if (isLastStep) {
            this.summaryStep.setCurrentData(this.collectData());
        }

        this.getButtonRow().toggleClass('last-step', isLastStep);

        if (step === this.strategyStep) {
            this.strategyStep.setCurrentlySelectedItems(this.collectData().permissions);
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
        this.hasNoChildren = false;
    }

    protected showPreviousStep(): void {
        if (this.isFirstStep()) { // we're using back button as reset button for the 1st step
            this.mainStep.reset();
        } else {
            // if no children then skip applyTo and strategy steps; if applyTo is single selected then skip only strategy step
            if (this.isLastStep()) {
                if (this.hasNoChildren) {
                    this.showStep(this.mainStep);
                } else if (this.isApplyToSingleSelected()) {
                    this.showStep(this.applyToStep);
                } else {
                    super.showPreviousStep();
                }
            } else {
                super.showPreviousStep();
            }
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

    private removeRedundantPermissions(permissions: AccessControlEntry[]): AccessControlEntry[] {
        const result = [];

        // removing unused PERMISSION.READ_PERMISSIONS and PERMISSION.WRITE_PERMISSIONS

        permissions.forEach((item) => {
            const cloned = item.clone();
            cloned.setDeniedPermissions([]);
            cloned.setAllowedPermissions(
                item.getAllowedPermissions().filter(p => p !== Permission.READ_PERMISSIONS && p !== Permission.WRITE_PERMISSIONS));

            result.push(cloned);
        });

        return result;
    }
}

class EditPermissionsDialogButtonRow
    extends DropdownButtonRow {

    makeActionMenu(menuButtonConfig: MenuButtonConfig, useDefault: boolean = true): MenuButton {
        super.makeActionMenu(menuButtonConfig, useDefault);

        return this.actionMenu.addClass('edit-permissions-dialog-menu') as MenuButton;
    }

}
