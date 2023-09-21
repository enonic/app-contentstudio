import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ComponentView, ComponentViewBuilder} from './ComponentView';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {EditContentFromComponentViewEvent} from './event/outgoing/manipulation/EditContentFromComponentViewEvent';

export abstract class ContentBasedComponentView
    extends ComponentView {

    protected editAction: Action;

    protected constructor(builder: ComponentViewBuilder) {
        super(builder);

        this.addEditActionToMenu();
    }

    private addEditActionToMenu() {
        if (!this.isEmpty()) {
            this.addContextMenuActions([this.createEditAction()]);
        }
    }

    private createEditAction(): Action {
        this.editAction = new Action(i18n('action.edit')).onExecuted(() => {
            new EditContentFromComponentViewEvent(this.getContentId()).fire();
        });

        return this.editAction;
    }

    protected getContentId(): string {
        return this.liveEditParams.getFragmentIdByPath(this.getPath().toString());
    }

}
