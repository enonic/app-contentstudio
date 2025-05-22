import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {DialogStep} from '@enonic/lib-admin-ui/ui/dialog/multistep/DialogStep';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {SectionEl} from '@enonic/lib-admin-ui/dom/SectionEl';
import {DdDtEl} from '@enonic/lib-admin-ui/dom/DdDtEl';
import {DlEl} from '@enonic/lib-admin-ui/dom/DlEl';
import {PermissionsData} from '../PermissionsData';
import {AccessControlEntry} from '../../../access/AccessControlEntry';
import {RoleKeys} from '@enonic/lib-admin-ui/security/RoleKeys';
import {AccessControlChangedItemsList} from '../AccessControlChangedItemsList';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ShowHideDetailsButton} from '../ShowHideDetailsButton';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';

export class SummaryStep
    extends DialogStep {

    private readonly container: Element;

    private summaryList: Element;
    private readonly principalsLine: Element;
    private readonly accessModeLine: AccessModeLine;
    private readonly applyToLine: Element;
    private readonly strategyLine: Element;

    private readonly toggleDetailsButton: ShowHideDetailsButton;
    private readonly changedItemsList: AccessControlChangedItemsList;

    private originalValues: AccessControlEntry[] = [];

    constructor() {
        super();

        this.container = new SectionEl('summary-step');
        this.summaryList = new DlEl('summary-data-list');
        this.accessModeLine = new AccessModeLine();
        this.applyToLine = new DdDtEl('dd');
        this.strategyLine = new DdDtEl('dd', 'strategy-principals-line');
        this.principalsLine = new DdDtEl('dd', 'summary-principals-line');

        this.toggleDetailsButton = new ShowHideDetailsButton();
        this.changedItemsList = new AccessControlChangedItemsList();

        this.setupPropsList();
        this.setupDetailsContainer();
        this.reset();
    }

    getName(): string {
        return 'summary';
    }

    getDescription(): string {
        return i18n('dialog.permissions.step.summary.description')
    }

    getHtmlEl(): Element {
        return this.container;
    }

    setup(originalPermissions: AccessControlEntry[]): void {
        this.originalValues = originalPermissions.sort();
        this.changedItemsList.setOriginalValues(this.originalValues);
    }

    setCurrentData(data: PermissionsData): void {
        const hadEveryoneRole = this.originalValues.some(p => p.getPrincipalKey().equals(RoleKeys.EVERYONE));
        const hasEveryoneRole = data.permissions.some(p => p.getPrincipalKey().equals(RoleKeys.EVERYONE));
        this.accessModeLine.setAccessDiff(hadEveryoneRole, hasEveryoneRole);

        this.applyToLine.setHtml(this.getApplyToLine(data));
        this.strategyLine.setHtml(
            data.reset ? i18n('dialog.permissions.step.strategy.overwrite') : i18n(
                'dialog.permissions.step.strategy.merge'));

        this.changedItemsList.setApplyTo(data.applyTo);
        this.changedItemsList.setResetChildPermissions(data.reset);
        this.changedItemsList.setCurrentValues(data.permissions);

        this.toggleDetailsButton.setTotal(this.changedItemsList.getItemCount());
        this.summaryList.toggleClass('no-principals-changed', this.changedItemsList.getItemCount() === 0);
        this.summaryList.toggleClass('single', data.applyTo === 'single');
    }

    reset(): void {
        this.toggleDetailsButton.setActive(false);
    }

    private getApplyToLine(data: PermissionsData): string {
        if (data.applyTo === 'tree') {
            return i18n('dialog.permissions.step.apply.to.all');
        }

        if (data.applyTo === 'subtree') {
            return i18n('dialog.permissions.step.apply.to.children');
        }

        return i18n('dialog.permissions.step.apply.to.item');
    }

    private setupPropsList(): void {
        const principalsLineLabel = new DdDtEl('dt', 'summary-principals-label').setHtml(
            i18n('dialog.permissions.step.summary.permissions.label'));
        const accessModeLineLabel = new DdDtEl('dt').setHtml(i18n('dialog.permissions.step.summary.access.label'));
        const applyToLineLabel = new DdDtEl('dt').setHtml(i18n('dialog.permissions.step.summary.apply.label'));
        const strategyLineLabel = new DdDtEl('dt', 'strategy-principals-label').setHtml(
            i18n('dialog.permissions.step.summary.strategy.label'));

        this.summaryList.appendChildren(accessModeLineLabel, this.accessModeLine, applyToLineLabel, this.applyToLine, strategyLineLabel,
            this.strategyLine, principalsLineLabel, this.principalsLine);
        this.container.appendChild(this.summaryList);

        this.principalsLine.appendChild(this.toggleDetailsButton);
    }

    private setupDetailsContainer(): void {
        const detailsContainer = new DivEl('details-container');
        this.container.appendChild(detailsContainer);

        this.toggleDetailsButton.onClicked(() => {
            this.toggleDetailsButton.toggle();
        });

        detailsContainer.appendChild(this.changedItemsList);

        this.toggleDetailsButton.setActiveChangeListener((isActive: boolean) => {
            this.changedItemsList.setVisible(isActive);
        });
    }

}

class AccessModeLine
    extends DdDtEl {

    private hadEveryoneRole: boolean;

    private hasEveryoneRole: boolean;

    constructor() {
        super('dd', 'access-mode-line');
    }

    setAccessDiff(hadEveryoneRole: boolean, hasEveryoneRole: boolean): void {
        this.hadEveryoneRole = hadEveryoneRole;
        this.hasEveryoneRole = hasEveryoneRole;

        this.updateLine();
    }

    private updateLine(): void {
        if (this.hadEveryoneRole === this.hasEveryoneRole) {
            this.setHtml(this.getLabel(this.hasEveryoneRole));
        } else {
            this.removeChildren();
            const oldValueSpan = new SpanEl().setHtml(this.getLabel(this.hadEveryoneRole));
            const newValueSpan = new SpanEl().setHtml(this.getLabel(this.hasEveryoneRole));
            this.appendChildren(oldValueSpan, newValueSpan);
        }
    }

    private getLabel(hasEveryoneRole: boolean): string {
        return hasEveryoneRole ? i18n('dialog.permissions.step.main.access.public') : i18n(
            'dialog.permissions.step.main.access.restricted');
    }

}
