import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ContentBasedComponentView, ContentBasedComponentViewBuilder} from '../ContentBasedComponentView';
import {ImageItemType} from './ImageItemType';
import {ImageComponentViewer} from './ImageComponentViewer';
import {ImagePlaceholder} from './ImagePlaceholder';
import {ContentDeletedEvent, ContentDeletedItem} from '../../app/event/ContentDeletedEvent';
import {ImageComponent} from '../../app/page/region/ImageComponent';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {ContentId} from '../../app/content/ContentId';

export class ImageComponentViewBuilder
    extends ContentBasedComponentViewBuilder<ImageComponent> {

    constructor() {
        super();
        this.setType(ImageItemType.get());
        this.setContentTypeName(ContentTypeName.IMAGE);
    }
}

export class ImageComponentView
    extends ContentBasedComponentView<ImageComponent> {

    private image: Element;

    constructor(builder: ImageComponentViewBuilder) {
        super(<ImageComponentViewBuilder>builder.setViewer(new ImageComponentViewer()).setInspectActionRequired(true));

        this.setPlaceholder(new ImagePlaceholder(this));

        this.liveEditModel = builder.parentRegionView.getLiveEditModel();

        this.initializeImage();

        this.handleContentRemovedEvent();
    }

    protected getContentId(): ContentId {
        return this.component ? this.component.getImage() : null;
    }

    private handleContentRemovedEvent() {
        let contentDeletedListener = (event) => {
            let deleted = event.getDeletedItems().some((deletedItem: ContentDeletedItem) => {
                return !deletedItem.isPending() && deletedItem.getContentId().equals(this.component.getImage());
            });
            if (deleted) {
                this.remove();
            }
        };

        ContentDeletedEvent.on(contentDeletedListener);

        this.onRemoved((event) => {
            ContentDeletedEvent.un(contentDeletedListener);
        });
    }

    private initializeImage() {

        let figureElChildren = this.getChildren();
        for (let i = 0; i < figureElChildren.length; i++) {
            let image = figureElChildren[i];
            if (image.getHTMLElement().tagName.toUpperCase() === 'IMG') {
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
            return;
        }
    }

}
