import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {Access, ACCESS_OPTIONS} from '../../security/Access';
import Q from 'q';

export class AccessDiffView extends DivEl {

    private readonly before?: Access;

    private readonly after?: Access;

    constructor(before: Access, after: Access) {
        super('access-diff-view');

        this.before = before;
        this.after = after;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {

            this.calc();

            return rendered;
        });
    }

    private calc(): void {
        if (!this.before) { // Added
            this.showAddedAccess(this.after);
        } else if (!this.after) { // Removed
            this.showRemovedAccess(this.before);
        } else { // modified
            if (this.before === this.after) {
                this.showUnchangedAccess(this.after);
            } else {
                this.showModifiedAccess(this.before, this.after);
            }
        }
    }

    private showAccess(access: Access, className: string): void {
        this.appendChild(new SpanEl('access-line ' + className).setHtml(this.getAccessDisplayName(access)));
    }

    private showAddedAccess(access: Access): void {
        this.showAccess(access, 'added');
    }

    private showUnchangedAccess(access: Access): void {
        this.showAccess(access, 'unchanged');
    }

    private showRemovedAccess(access: Access): void {
        this.showAccess(access, 'removed');
    }

    private showModifiedAccess(fromAccess: Access, toAccess: Access): void {
        this.showRemovedAccess(fromAccess);
        this.showAccess(toAccess, 'modified');
    }

    private getAccessDisplayName(access: Access): string {
        return ACCESS_OPTIONS.find((option) => option.id === access.toString()).displayName;
    }

}
