import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ComponentView, ComponentViewBuilder} from './ComponentView';
import {DragAndDrop} from './DragAndDrop';
import {EditContentEvent} from '../app/event/EditContentEvent';
import {ContentSummaryAndCompareStatus} from '../app/content/ContentSummaryAndCompareStatus';
import {Component} from '../app/page/region/Component';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ContentSummary, ContentSummaryBuilder} from '../app/content/ContentSummary';
import {ContentId} from '../app/content/ContentId';

export class ContentBasedComponentViewBuilder<COMPONENT extends Component>
    extends ComponentViewBuilder<COMPONENT> {

    contentTypeName: ContentTypeName;

    setContentTypeName(contentTypeName: ContentTypeName): ContentBasedComponentViewBuilder<COMPONENT> {
        this.contentTypeName = contentTypeName;
        return this;
    }
}

export class ContentBasedComponentView<COMPONENT extends Component>
    extends ComponentView<COMPONENT> {

    private contentTypeName: ContentTypeName;

    constructor(builder: ContentBasedComponentViewBuilder<COMPONENT>) {
        super(builder);

        this.contentTypeName = builder.contentTypeName;

        this.addEditActionToMenu();
    }

    protected isDragging(): boolean {
        return DragAndDrop.get().isDragging();
    }

    private addEditActionToMenu() {
        if (!this.isEmpty()) {
            this.addContextMenuActions([this.createEditAction()]);
        }
    }

    private createEditAction(): Action {
        return new Action(i18n('action.edit')).onExecuted(() => {

        });
    }

}
