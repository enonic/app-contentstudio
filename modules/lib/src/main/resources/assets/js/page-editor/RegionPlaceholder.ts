import {ItemViewPlaceholder} from './ItemViewPlaceholder';
import {Region} from '../app/page/region/Region';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {PEl} from '@enonic/lib-admin-ui/dom/PEl';

export class RegionPlaceholder
    extends ItemViewPlaceholder {


    constructor() {
        super();
        this.addClassEx('region-placeholder');


        let dragComponentsHereEl = new PEl();
        dragComponentsHereEl.setHtml(i18n('live.view.drag.drophere'));

        this.appendChild(dragComponentsHereEl);
    }
}
