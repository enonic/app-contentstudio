import {StyleHelper} from 'lib-admin-ui/StyleHelper';
import {DivEl} from 'lib-admin-ui/dom/DivEl';

export class FontIcon
    extends DivEl {
    constructor(iconClass: string) {
        super('font-icon ' + iconClass, StyleHelper.getCurrentPrefix());
    }
}
