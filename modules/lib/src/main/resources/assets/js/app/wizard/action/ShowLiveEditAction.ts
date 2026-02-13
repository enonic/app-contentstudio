import {ShowLiveEditEvent} from '../ShowLiveEditEvent';
import {type ContentWizardPanel} from '../ContentWizardPanel';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ResponsiveRanges} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveRanges';

export class ShowLiveEditAction
    extends Action {

    private wizard: ContentWizardPanel;

    constructor(wizard: ContentWizardPanel) {
        super('live');

        this.wizard = wizard;

        this.setTitle(i18n('tooltip.showEditor'));
        this.setEnabled(false);
        this.onExecuted(() => {
            this.showLiveEdit();
            new ShowLiveEditEvent().fire();
        });
    }

    setEnabled(value: boolean): Action {
        this.setTitle(value ? i18n('tooltip.showEditor') : '');
        super.setEnabled(value);

        return this;
    }

    private showLiveEdit() {
        const addClass: string = this.wizard.isInMobileViewMode() ? 'live' : 'split';
        const removeClass: string = this.wizard.isInMobileViewMode() ? 'split' : 'live';

        this.wizard.getSplitPanel().addClass(`toggle-${addClass}`).removeClass(`toggle-form toggle-${removeClass}`);
        this.wizard.getMainToolbar().toggleClass('live', true);
        this.wizard.toggleClass('form', false);

        this.openLiveEdit();
    }

    private openLiveEdit() {
        this.wizard.getSplitPanel().showSecondPanel();
        const showInspectionPanel = ResponsiveRanges._1920_UP.isFitOrBigger(this.wizard.getEl().getWidthWithBorder());
    //    this.wizard.getLivePanel().clearPageViewSelectionAndOpenInspectPage(showInspectionPanel);
        this.wizard.showMinimizeEditButton();
    }
}
