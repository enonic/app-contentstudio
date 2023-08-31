import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ElementHelper} from '@enonic/lib-admin-ui/dom/ElementHelper';

export class PageComponentsMenuIcon
    extends DivEl {

    private static ICON_CLASS: string = 'page-component-menu-icon';

    // adding 'expand' as a trick to avoid select/deselect when clicking on menu icon
    constructor() {
        super(`menu-icon icon-menu2 expand ${PageComponentsMenuIcon.ICON_CLASS}`);
    }

    static isMenuIcon(elem: ElementHelper): boolean {
        return elem.hasClass(PageComponentsMenuIcon.ICON_CLASS);
    }
}
