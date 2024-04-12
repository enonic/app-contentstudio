import {CreateItemViewConfig} from './CreateItemViewConfig';
import {RegionView} from './RegionView';

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
