/**
 * Created on 15.02.2018.
 */

const page = require('../../page');
const elements = require('../../../libs/elements');
const utils = require('../../../libs/studio.utils');
const appConst = require('../../../libs/app_const');
const contentWizard = require('../content.wizard.panel');
const loaderComboBox = require('../../../page_objects/components/loader.combobox');
const xpath = {
    container: "//div[contains(@id,'LiveFormPanel')]",
    fragmentComponentView: "//div[contains(@id,'FragmentComponentView')]",
};

const liveFormPanel = Object.create(page, {

    waitForOpened: {
        value: function () {
            return this.waitForVisible(xpath.container, appConst.TIMEOUT_2);
        }
    },
    // selects an image by displayName(in an image-component)
    selectImageByDisplayName: {
        value: function (displayName) {
            let parentForComboBox = `//div[contains(@id,'ImagePlaceholder')]`;
            return contentWizard.switchToLiveEditFrame().then(() => {
                return loaderComboBox.typeTextAndSelectOption(displayName, parentForComboBox);
            }).pause(2000);
        }
    },
});
module.exports = liveFormPanel;