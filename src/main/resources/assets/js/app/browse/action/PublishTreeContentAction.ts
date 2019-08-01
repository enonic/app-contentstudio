import '../../../api.ts';
import {PublishContentAction} from './PublishContentAction';
import {ContentTreeGrid} from '../ContentTreeGrid';
import i18n = api.util.i18n;

export class PublishTreeContentAction extends PublishContentAction {

    constructor(grid: ContentTreeGrid) {
        super(grid, true, false);

        this.setLabel(i18n('action.publishTreeMore'));
    }
}
