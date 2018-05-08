/**
 * Created on 15.02.2018.
 */

const page = require('../../page');
const elements = require('../../../libs/elements');
const utils = require('../../../libs/studio.utils');
const appConst = require('../../../libs/app_const');
const contentWizard = require('../content.wizard.panel');
const ckeEditor = require('../htmlarea.form.panel');
const xpath = {
    container: "//div[contains(@id,'LiveFormPanel')]",
    textComponentView: "//div[contains(@id,'TextComponentView')]",
    fragmentComponentView: "//div[contains(@id,'FragmentComponentView')]",

};

const liveFormPanel = Object.create(page, {

    typeTextInTextComponent: {
        value: function (text) {
            let textInput = xpath.textComponentView + "//div[@class='tiny-mce-here mce-content-body mce-edit-focus']";
            return contentWizard.switchToLiveEditFrame().then(() => {
                return this.typeTextInInput(textInput, text);
            }).pause(500).then(() => {
                return this.getBrowser().frameParent();
            }).catch(err => {
                this.saveScreenshot('err_type_text_in_component');
                this.getBrowser().frameParent();
                throw new Error('type text on tiny-mce: ' + err);
            });
        }
    },
    typeTextInCKETextComponent: {
        value: function (text) {
            return contentWizard.switchToLiveEditFrame().then(() => {
                return this.typeTextInCkeEditor(text);
            }).pause(500).then(() => {
                return this.getBrowser().frameParent();
            }).catch(err => {
                this.saveScreenshot('err_type_text_in_component');
                this.getBrowser().frameParent();
                throw new Error('type text on tiny-mce: ' + err);
            });
        }
    },
    typeTextInCkeEditor: {
        value: function (text) {
            return this.waitForVisible(`//div[contains(@id,'TextComponentViewCK_editor')]`, appConst.TIMEOUT_3).then(() => {
                return this.getIdOfEditor();
            }).then(id => {
                return utils.setTextInCKE(id, text);
            });
        }
    },
    getIdOfEditor: {
        value: function (text) {
            let selector = `//div[contains(@id,'TextComponentViewCK_editor') and contains(@title,'Rich Text Editor')]`;
            return this.getAttribute(selector, 'id');
        }
    },

    waitForOpened: {
        value: function () {
            return this.waitForVisible(xpath.container, appConst.TIMEOUT_2);
        }
    },
});
module.exports = liveFormPanel;