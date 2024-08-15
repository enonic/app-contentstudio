import {StyleHelper} from '@enonic/lib-admin-ui/StyleHelper';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {assert} from '@enonic/lib-admin-ui/util/Assert';
import {KeyHelper} from '@enonic/lib-admin-ui/ui/KeyHelper';

export class ContentActionCycleButton
    extends Button {

    private readonly actionList: Action[];

    private activeAction: Action;

    constructor(actions: Action[], active?: Action) {
        super();

        assert(actions?.length > 0, 'Actions list is empty');

        this.addClass('cycle-button icon-medium ' + StyleHelper.getIconCls('screen'));

        this.actionList = actions;

        this.setActiveAction(active || this.actionList[0]);
        this.initListeners();
    }

    private initListeners(): void {
        this.actionList.forEach((action: Action) => {
            action.onExecuted(() => {
                this.selectNextAction(action);
            });

            action.onPropertyChanged(() => {
                if (action === this.activeAction) { // handling situation when an active action was assigned while disabled, thus no title
                    this.updateActiveTitle();
                }
            });
        });

        this.onClicked(() => {
            this.activeAction.execute();
        });

        this.onEnterPressed(() => this.activeAction.execute());
    }

    private selectNextAction(action: Action): void {
        const nextAction: Action = this.getNextAction(action);

        if (nextAction === this.activeAction) {
            return;
        }

        this.setActiveAction(nextAction);
    }

    private getNextAction(action: Action): Action { // cycling through array
        const itemIndex: number = this.actionList.indexOf(action);
        const nextIndex: number = (itemIndex + 1) % this.actionList.length;

        return this.actionList[nextIndex];
    }

    private setActiveAction(action: Action): void {
        if (this.activeAction) {
            this.removeClass(this.activeAction.getLabel().toLowerCase());
        }

        this.activeAction = action;
        this.addClass(this.activeAction.getLabel().toLowerCase());
        this.updateActiveTitle();
    }

    private updateActiveTitle(): void {
        this.setTitle(this.activeAction.getTitle() || '', false);
    }

}
