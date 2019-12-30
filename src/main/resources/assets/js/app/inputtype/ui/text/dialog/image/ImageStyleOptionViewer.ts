import {Viewer} from 'lib-admin-ui/ui/Viewer';
import {ImageStyleOption} from './ImageStyleOptions';
import {ImageStyleNameView} from './ImageStyleNameView';

export class ImageStyleOptionViewer
    extends Viewer<ImageStyleOption> {

    private nameView: ImageStyleNameView;

    constructor() {
        super();

        this.nameView = new ImageStyleNameView(false);
        this.appendChild(this.nameView);
    }

    setObject(object: ImageStyleOption) {
        this.nameView.setMainName(object.getDisplayName());

        return super.setObject(object);
    }

    getPreferredHeight(): number {
        return 26;
    }
}
