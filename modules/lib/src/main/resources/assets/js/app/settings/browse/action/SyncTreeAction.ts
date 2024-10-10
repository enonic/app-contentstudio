import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {SyncLayersRequest} from '../../resource/SyncLayersRequest';
import {showFeedback, showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {Projects} from '../../resource/Projects';

export class SyncTreeAction
    extends Action {

    private inProgress: boolean = false;

    constructor() {
        super(i18n('settings.actions.sync'));

        this.setVisible(false);
        this.setEnabled(false);

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

        const totalProjects: number = Projects.get().getProjects().length;
        this.setEnabled(totalProjects > 2);
        this.setVisible(totalProjects > 2);
    }

    private isInProgress(): boolean {
        return this.inProgress;
    }
}
