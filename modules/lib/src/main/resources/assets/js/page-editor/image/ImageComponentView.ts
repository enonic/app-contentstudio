import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ContentBasedComponentView} from '../ContentBasedComponentView';
import {ImageItemType} from './ImageItemType';
import {ImagePlaceholder} from './ImagePlaceholder';
import {ComponentViewBuilder} from '../ComponentView';

export class ImageComponentViewBuilder
    extends ComponentViewBuilder {

    constructor() {
        super();
        this.setType(ImageItemType.get());
    }
}

export class ImageComponentView
    extends ContentBasedComponentView {

    private image: Element;

    constructor(builder: ImageComponentViewBuilder) {
        super(builder);

        this.setPlaceholder(new ImagePlaceholder(this));
        this.initializeImage();
    }

    private initializeImage() {
        const figureElChildren = this.getChildren();
        for (const image of figureElChildren) {
            if (image.getHTMLElement().tagName.toUpperCase() !== 'IMG') {
                return;
            }

            this.image = image;

            // no way to use ImgEl.onLoaded because all html tags are parsed as Element
            this.image.getEl().addEventListener('load', (event) => {
                // refresh shader and highlighter after image loaded
                // if it's still selected
                if (this.isSelected()) {
                    this.highlightSelected();
                    //this.shade();
                }
            });
        }
    }

}
