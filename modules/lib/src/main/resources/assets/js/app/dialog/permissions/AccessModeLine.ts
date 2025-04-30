import {DdDtEl} from '@enonic/lib-admin-ui/dom/DdDtEl';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export class AccessModeLine
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

    isAccessChanged(): boolean {
       return this.hadEveryoneRole !== this.hasEveryoneRole;
    }

    private getLabel(hasEveryoneRole: boolean): string {
        return hasEveryoneRole ? i18n('dialog.permissions.step.main.access.public') : i18n(
            'dialog.permissions.step.main.access.restricted');
    }

}
