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
    fragmentComponentView: "//div[contains(@id,'FragmentComponentView')]",
};

const liveFormPanel = Object.create(page, {

    typeTextInCKETextComponent: {
        value: function (text) {
            return contentWizard.switchToLiveEditFrame().then(() => {
                return this.typeTextInCkeEditor(text);
            }).pause(500).then(() => {
                return this.getBrowser().frameParent();
            }).catch(err => {
                this.saveScreenshot('err_type_text_in_component');
                this.getBrowser().frameParent();
                throw new Error('type text in CKE: ' + err);
            });
        }
    },
    typeTextInCkeEditor: {
        value: function (text) {
            return this.waitForVisible(elements.RICH_TEXT_EDITOR, appConst.TIMEOUT_3).then(() => {
                return this.getIdOfEditor();
            }).then(id => {
                return utils.setTextInCKE(id, text);
            });
        }
    },
    getIdOfEditor: {
        value: function (text) {
            return this.getAttribute(elements.RICH_TEXT_EDITOR, 'id');
        }
    },
    waitForOpened: {
        value: function () {
            return this.waitForVisible(xpath.container, appConst.TIMEOUT_2);
        }
    },
});
module.exports = liveFormPanel;