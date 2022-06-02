import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {SettingsItemsTreeGrid} from '../../grid/SettingsItemsTreeGrid';
import {SyncLayersRequest} from '../../resource/SyncLayersRequest';
import {showFeedback, showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';

export class SyncAction
    extends Action {

    private grid: SettingsItemsTreeGrid;

    private inProgress: boolean = false;

    constructor(grid: SettingsItemsTreeGrid) {
        super(i18n('settings.actions.sync'));

        this.setVisible(false);
        this.setEnabled(false);

        this.grid = grid;

        this.onExecuted(() => {
            this.setEnabled(false);
            showFeedback(i18n('settings.actions.sync.started'));
            this.inProgress = true;

            new SyncLayersRequest()
                .setFinishedHandler(this.handleSyncFinished.bind(this))
                .setFailedHandler(this.handleSyncFailed.bind(this))
                .sendAndParse()
                .catch(() => {
                    this.handleSyncFailed();
                })
                .finally(() => {
                    this.inProgress = false;
                    this.updateState();
                });
        });
    }

    private handleSyncFinished() {
        showFeedback(i18n('settings.actions.sync.finished'));
    }

    private handleSyncFailed() {
        showWarning(i18n('settings.actions.sync.failed'));
    }

    updateState() {
        if (this.isInProgress()) {
            return;
        }

        const totalProjects: number = this.grid.getCurrentTotal();
        this.setEnabled(totalProjects > 2);
        this.setVisible(totalProjects > 2);
    }

    private isInProgress(): boolean {
        return this.inProgress;
    }
}
