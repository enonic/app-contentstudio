/**
 * Created on 15.02.2018.
 */

const page = require('../../page');
const elements = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const contentWizard = require('../content.wizard.panel');
const xpath = {
    container: "//div[contains(@id,'LiveFormPanel')]",
    textComponentView: "//div[contains(@id,'TextComponentView')]",
    fragmentComponentView: "//div[contains(@id,'FragmentComponentView')]",

};

const liveFormPanel = Object.create(page, {

    typeTextInTextComponent: {
        value: function (text) {
            let textInput = xpath.textComponentView + "//div[@class='tiny-mce-here mce-content-body mce-edit-focus']";
            return contentWizard.switchToLiveEditFrame().then(()=> {
                return this.typeTextInInput(textInput, text);
            }).pause(500).then(()=> {
                return this.getBrowser().frameParent();
            }).catch(err=> {
                this.saveScreenshot('err_type_text_in_component');
                return this.getBrowser().frameParent();
                throw new Error('type text on tiny-mce: ' + err);
            });
        }
    },

    waitForOpened: {
        value: function () {
            return this.waitForVisible(xpath.container, appConst.TIMEOUT_2);
        }
    },
});
module.exports = liveFormPanel;