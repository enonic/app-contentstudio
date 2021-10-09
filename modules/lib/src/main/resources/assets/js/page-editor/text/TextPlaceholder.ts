import {ItemViewPlaceholder} from '../ItemViewPlaceholder';

export class TextPlaceholder
    extends ItemViewPlaceholder {

    constructor() {
        super();
        this.addClass('icon-font-size');
        this.addClassEx('text-placeholder');
    }

}
