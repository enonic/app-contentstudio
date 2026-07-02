/**
 * Created  on 21.12.2022 updated on 02.07.2026
 *
 * 'Compare with published version' - the same 'CompareVersionsDialog' component as in CompareContentVersionsDialog,
 * all generic methods are inherited from the base class. This class adds only methods that are specific
 * to comparing with the published version.
 */
const CompareContentVersionsDialog = require('./compare.content.versions.dialog');
const appConst = require('../libs/app_const');

class CompareWithPublishedVersionDialog extends CompareContentVersionsDialog {

    async waitForDialogOpened() {
        try {
            await super.waitForDialogOpened();
        } catch (err) {
            await this.handleError('Compare With Published Version Dialog', 'err_compare_dlg_opened', err);
        }
    }

    // 'Online' badge should be displayed in the card of the published version:
    async waitForOnlineStatusInOlderVersionCard() {
        try {
            let status = await this.getOlderVersionStatus();
            if (status !== appConst.CONTENT_STATUS.ONLINE) {
                throw new Error(`'Online' status is expected in the Older version card, but actual is: ${status}`);
            }
        } catch (err) {
            await this.handleError('Compare With Published Version Dialog', 'err_online_status', err);
        }
    }
}

module.exports = CompareWithPublishedVersionDialog;
