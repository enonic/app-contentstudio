const BaseSiteConfiguratorDialog = require('./base.site.configurator.dialog');
const {COMMON} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: `//div[@data-component='Dialog.Content']`,
};

class SiteConfiguratorReqInputDialog extends BaseSiteConfiguratorDialog {

    get trackingIdTextInput() {
        return XPATH.container + COMMON.INPUTS.inputFieldByLabel('Tracking Id') + '//input';
    }

    get trackingIdValidationRecording() {
        return XPATH.container + COMMON.INPUTS.inputFieldByLabel('Tracking Id') + COMMON.INPUTS.VALIDATION_RECORDING;
    }

    async clickInTrackingIdInput(){
        let element  =  await this.findElement(this.trackingIdTextInput);
        await element.click();
    }
    async clearTrackingIdInput() {
       await this.clearInputText(this.trackingIdTextInput);
    }
    async typeInTextInTrackingIdInput(text) {
        try {
            return await this.typeTextInInput(this.trackingIdTextInput, text)
        } catch (err) {
            await this.handleError('Site Configurator Dialog - req text input', 'err_type_tracking_id', err);
        }
    }

    async getValidationMessage() {
        try {
            await this.waitForElementDisplayed(this.trackingIdValidationRecording, appConst.shortTimeout);
            return await this.getText(this.trackingIdValidationRecording);
        } catch (err) {
            await this.handleError('Site Configurator Dialog - get validation message', 'err_get_validation_msg', err);
        }
    }
}

module.exports = SiteConfiguratorReqInputDialog;
