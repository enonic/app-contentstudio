const BaseSiteConfiguratorDialog = require('./base.site.configurator.dialog');
const appConst = require('../../../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'SiteConfiguratorDialog')]`,
    trackingIdTextInput: `//input[contains(@name,'trackingId')]`,
};

class SiteConfiguratorReqInputDialog extends BaseSiteConfiguratorDialog {

    get trackingIdTextInput() {
        return XPATH.container + `${XPATH.trackingIdTextInput}`;
    }

    async typeInTextInTrackingIdInput(text) {
        try {
            return await this.typeTextInInput(this.trackingIdTextInput, text)
        } catch (err) {
            await this.handleError('Site Configurator Dialog - req text input','err_type_tracking_id', err);
        }
    }
}

module.exports = SiteConfiguratorReqInputDialog;
