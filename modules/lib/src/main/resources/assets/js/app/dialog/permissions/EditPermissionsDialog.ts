import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {showFeedback, showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {type TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {type TaskState} from '@enonic/lib-admin-ui/task/TaskState';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {AccessControlList} from '../../access/AccessControlList';
import {type ContentId} from '../../content/ContentId';
import {TaskProgressManager, type WithTaskProgress} from '../TaskProgressManager';
import {type OpenEditPermissionsDialogEvent} from '../../event/OpenEditPermissionsDialogEvent';
import {ApplyContentPermissionsRequest} from '../../resource/ApplyContentPermissionsRequest';
import {MultiStepDialog, type MultiStepDialogConfig} from '@enonic/lib-admin-ui/ui/dialog/multistep/MultiStepDialog';
import {type NamesAndIconView} from '@enonic/lib-admin-ui/app/NamesAndIconView';
import {MainAccessStep} from './steps/MainAccessStep';
import {GetDescendantsOfContentsRequest} from '../../resource/GetDescendantsOfContentsRequest';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {SummaryStep} from './steps/SummaryStep';
import {StrategyStep} from './steps/StrategyStep';
import {type Action} from '@enonic/lib-admin-ui/ui/Action';
import {type PermissionsData} from './PermissionsData';
import {type DialogStep} from '@enonic/lib-admin-ui/ui/dialog/multistep/DialogStep';
import {type AccessControlEntry} from '../../access/AccessControlEntry';
import {AccessControlHelper} from '../../wizard/AccessControlHelper';

export class EditPermissionsDialog
    extends MultiStepDialog
    implements WithTaskProgress {

    private contentId: ContentId;

    private subTitle: H6El;

    private progressManager: TaskProgressManager;

    private mainStep: MainAccessStep;

    private strategyStep: StrategyStep;

    private summaryStep: SummaryStep;

    private backActionMirror: Action;

    private originalValues: AccessControlEntry[];

    private totalChildren: number;

    constructor() {
        super({
            steps: [new MainAccessStep(), new StrategyStep(), new SummaryStep()],
            confirmation: {
                yesCallback: () => this.submit(),
            },
            title: i18n('dialog.permissions.step.title'),
            class: 'edit-permissions-dialog'
        } as MultiStepDialogConfig);
    }

    protected initElements(): void {
        super.initElements();

        this.mainStep = this.steps[0] as MainAccessStep;
        this.strategyStep = this.steps[1] as StrategyStep;
        this.strategyStep.setResetConfirmedHandler(() => this.showStep(this.summaryStep));
        this.summaryStep = this.steps[2] as SummaryStep;

        this.backActionMirror = this.getBackAction(); // using the back action as a reset button on the first step

        this.progressManager = new TaskProgressManager({
            processingLabel: `${i18n('field.progress.applying')}...`,
            managingElement: this
        });

        this.subTitle = new H6El('sub-title').setHtml(`${i18n('dialog.permissions.applying')}...`);
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

        this.mainStep.onDataChanged(() => {
            const isChanged = this.mainStep.isAnyPermissionChanged();
            this.backActionMirror.setEnabled(isChanged);
        });
    }

    protected doSubmit(data: PermissionsData): void {
        this.subTitle.show();
        const permissions = new AccessControlList(data.permissions);

        const req = new ApplyContentPermissionsRequest().setId(this.contentId).setScope(data.applyTo);

        if (data.reset) {
            req.setPermissions(permissions);
        } else {
            const {added, removed} = AccessControlHelper.calcMergePermissions(this.originalValues, data.permissions);

            if (added.getEntries().length === 0 && removed.getEntries().length === 0) {
                showFeedback(i18n('dialog.permissions.step.action.noChanges'));
                return;
            }

            req.setAddPermissions(added);
            req.setRemovePermissions(removed);
        }

        req.sendAndParse().then((taskId) => {
            this.pollTask(taskId);
        }).catch(DefaultErrorHandler.handle).done();
    }

    protected submit(): void {
        this.doSubmit(this.collectData());
    }

    private collectData(): PermissionsData {
        const strategyData = this.strategyStep.getData();

        return {
            permissions: this.mainStep.getData(),
            applyTo: strategyData.applyTo,
            reset: strategyData.reset,
        }
    }

    setDataAndOpen(event: OpenEditPermissionsDialogEvent): void {
        this.contentId = event.getContentId();

        new GetDescendantsOfContentsRequest(event.getContentPath()).sendAndParse().then((ids) => {
            this.totalChildren = ids.length;
            this.strategyStep.setTotalChildren(ids.length);
        }).catch(DefaultErrorHandler.handle);

        const parentPath = event.getContentPath().getParentPath();

        AccessControlHelper.getParentPermissions(parentPath).then((parentPermissions: AccessControlList) => {
            this.open();

            const originalValuesWithoutRedundant = AccessControlHelper.removeRedundantPermissions(event.getPermissions().getEntries());
            const parentPermissionsWithoutRedundant = AccessControlHelper.removeRedundantPermissions(parentPermissions.getEntries());

            this.originalValues = originalValuesWithoutRedundant;
            this.mainStep.setup(originalValuesWithoutRedundant, parentPermissionsWithoutRedundant, parentPath?.isRoot());
            this.summaryStep.setup(originalValuesWithoutRedundant);
        }).catch(() => {
            showWarning(i18n('notify.permissions.inheritError', event.getDisplayName()));
        }).done();
    }

    protected showStep(step: DialogStep): void {
        super.showStep(step);

        if (this.isFirstStep()) {
            this.backActionMirror.setLabel(i18n('dialog.permissions.step.action.reset'));
            this.backActionMirror.setEnabled(this.mainStep.isAnyPermissionChanged());
            this.getButtonRow().removeClass('last-step');
        } else {
            const isLastStep = this.isLastStep();
            const data = this.collectData();

            if (isLastStep) {
                this.summaryStep.setCurrentData(data);
            }

            this.getButtonRow().toggleClass('last-step', isLastStep);
            this.getButtonRow().toggleClass('single', data.applyTo === 'single');
            this.backActionMirror.setEnabled(true).setLabel(i18n('dialog.multistep.previous'));
        }
    }

    protected createHeaderContent(): NamesAndIconView {
        return super.createHeaderContent().setIconClass('icon-user-check');
    }

    protected handleHidden(): void {
        super.handleHidden();

        this.reset();
    }

    protected reset(): void {
        this.showStep(this.mainStep);
        this.mainStep.reset();
        this.strategyStep.reset();
        this.summaryStep.reset();
        this.backActionMirror.setEnabled(false);
    }

    protected showNextStep(): void {
        if (this.isFirstStep() && this.totalChildren === 0) {
            this.showStep(this.summaryStep);
        } else {
            super.showNextStep();
        }
    }

    protected showPreviousStep(): void {
        if (this.isFirstStep()) { // we're using back button as reset button for the 1st step
            this.mainStep.reset();
        } else if (this.isLastStep() && this.totalChildren === 0) {
            this.showStep(this.mainStep);
        } else {
            super.showPreviousStep();
        }
    }

    private getBackAction(): Action {
        return this.getButtonRow().getActions()[1];
    }

    protected getSubmitActionLabel(): string {
        if (this.strategyStep.getData().reset) {
            return i18n('dialog.permissions.step.action.overwrite', this.getTotalItemsToApplyTo());
        }

        if (!this.isDirty()) {
            return i18n('dialog.permissions.step.action.noChanges');
        }

        return i18n('dialog.permissions.step.action.submitNow', this.getTotalItemsToApplyTo());
    }

    private getTotalItemsToApplyTo(): number {
        const applyTo = this.strategyStep.getData().applyTo;

        if (applyTo === 'single') {
            return 1;
        }

        if (applyTo === 'subtree') {
            return this.totalChildren;
        }

        return this.totalChildren + 1;
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
