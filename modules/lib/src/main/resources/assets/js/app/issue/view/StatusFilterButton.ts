import {Button} from '@enonic/lib-admin-ui/ui/button/Button';

export class StatusFilterButton
    extends Button {

    private defaultLabel: string;

    constructor(label: string) {
        super(label);

        this.defaultLabel = label;
    }

    updateByTotal(total: number) {
        this.setLabel(this.makeLabel(total));

        if (total > 0) {
            this.getEl().removeAttribute('disabled');
        } else {
            this.getEl().setAttribute('disabled', 'true');
        }
    }

    private makeLabel(count: number): string {
        return (count > 0 ? `${this.defaultLabel} (${count})` : this.defaultLabel);
    }
}
