import {ImageCroppingOption} from './ImageCroppingOption';
import {ImageCroppingNameView} from './ImageCroppingNameView';

export class ImageCroppingOptionViewer
    extends api.ui.Viewer<ImageCroppingOption> {

    private nameView: ImageCroppingNameView;

    constructor() {
        super();

        this.nameView = new ImageCroppingNameView(false);
        this.appendChild(this.nameView);
    }

    setObject(object: ImageCroppingOption) {
        this.nameView.setMainName(object.getDisplayValue());

        return super.setObject(object);
    }

    getPreferredHeight(): number {
        return 26;
    }
}
