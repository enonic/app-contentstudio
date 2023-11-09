import {CreateItemViewConfig} from './CreateItemViewConfig';
import {RegionView} from './RegionView';
import {PageView} from './PageView';

export class CreateTextComponentViewConfig
    extends CreateItemViewConfig<RegionView> {

    text: string;

    constructor() {
        super();
    }

    setText(value: string): this {
        this.text = value;
        return this;
    }
}
