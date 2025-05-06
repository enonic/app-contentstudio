import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {DialogStep} from '@enonic/lib-admin-ui/ui/dialog/multistep/DialogStep';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {SectionEl} from '@enonic/lib-admin-ui/dom/SectionEl';
import {DdDtEl} from '@enonic/lib-admin-ui/dom/DdDtEl';
import {DlEl} from '@enonic/lib-admin-ui/dom/DlEl';
import {PermissionsData} from '../PermissionsData';
import {AccessControlEntry} from '../../../access/AccessControlEntry';
import {RoleKeys} from '@enonic/lib-admin-ui/security/RoleKeys';

export class SummaryStep
    extends DialogStep {

    private readonly container: Element;

    private readonly principalsLine: Element;
    private readonly accessModeLine: Element;
    private readonly applyToLine: Element;
    private readonly strategyLine: Element;

    private originalPermissions: AccessControlEntry[];

    constructor() {
        super();

        this.container = new SectionEl('summary-step');
        this.principalsLine = new DdDtEl('dd');
        this.accessModeLine = new DdDtEl('dd');
        this.applyToLine = new DdDtEl('dd');
        this.strategyLine = new DdDtEl('dd');

        this.setupPropsList();
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
        this.originalPermissions = originalPermissions.sort();
    }

    setCurrentData(data: PermissionsData): void {
        this.principalsLine.setHtml(this.makePrincipalsLine(data.permissions));
        this.accessModeLine.setHtml(data.permissions.some(p => p.getPrincipalKey().equals(RoleKeys.EVERYONE)) ? i18n(
            'dialog.permissions.step.main.access.public') : i18n('dialog.permissions.step.main.access.restricted'));
        this.applyToLine.setHtml(this.getApplyToLine(data));
        this.strategyLine.setHtml(
            data.strategy === 'merge' ? i18n('dialog.permissions.step.strategy.merge') : i18n('dialog.permissions.step.strategy.reset'));
    }

    private makePrincipalsLine(current: AccessControlEntry[]): string {
        const diff = new Map<string, AccessControlEntry>();

        this.originalPermissions.forEach(p => {
            const permInCurrent = current.find(perm => perm.getPrincipalKey().equals(p.getPrincipalKey()));

            if (!p.equals(permInCurrent)) {
                diff.set(p.getPrincipalKey().toString(), p);
            }
        });

        current.forEach(p => {
            const permInPersisted = this.originalPermissions.find(perm => perm.getPrincipalKey().equals(p.getPrincipalKey()));

            if (!p.equals(permInPersisted)) {
                diff.set(p.getPrincipalKey().toString(), p);
            }
        });

        return Array.from(diff.values()).filter(p => !p.getPrincipalKey().equals(RoleKeys.EVERYONE)).map(
            p => p.getPrincipalDisplayName()).join(', ') || '<None>';
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
        const principalsLineLabel = new DdDtEl('dt').setHtml(i18n('dialog.permissions.step.summary.permissions.label'));
        const accessModeLineLabel = new DdDtEl('dt').setHtml(i18n('dialog.permissions.step.summary.access.label'));
        const applyToLineLabel = new DdDtEl('dt').setHtml(i18n('dialog.permissions.step.summary.apply.label'));
        const strategyLineLabel = new DdDtEl('dt').setHtml(i18n('dialog.permissions.step.summary.strategy.label'));

        const dl = new DlEl('summary-data-list');
        dl.appendChildren(principalsLineLabel, this.principalsLine, accessModeLineLabel, this.accessModeLine, applyToLineLabel,
            this.applyToLine, strategyLineLabel, this.strategyLine);

        this.container.appendChild(dl);
    }

}

