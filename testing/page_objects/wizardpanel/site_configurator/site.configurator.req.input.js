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
            return this.typeTextInInput(this.trackingIdTextInput, text)
        } catch (err) {
            let screenshot = appConst.generateRandomName('site_conf_err');
            await this.saveScreenshot(screenshot);
            throw new Error(`Site Configurator Dialog - screenshot:  ${screenshot}  ` + err);
        }
    }
}

module.exports = SiteConfiguratorReqInputDialog;
