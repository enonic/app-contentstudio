/**
 * Created on 15.02.2018.
 */
const Page = require('../../page');
const lib = require('../../../libs/elements');
const utils = require('../../../libs/studio.utils');
const appConst = require('../../../libs/app_const');
const ContentWizard = require('../content.wizard.panel');
const LoaderComboBox = require('../../../page_objects/components/loader.combobox');
const xpath = {
    container: "//div[contains(@id,'LiveFormPanel')]",
    fragmentComponentView: "//div[contains(@id,'FragmentComponentView')]",
};

class LiveFormPanel extends Page {

    waitForOpened() {
        return this.waitForElementDisplayed(xpath.container, appConst.TIMEOUT_2);
    }

   // selects an image by displayName(in an image-component)
    async selectImageByDisplayName(displayName) {
        let parentForComboBox = `//div[contains(@id,'ImagePlaceholder')]`;
        let contentWizard = new ContentWizard();
        let loaderComboBox = new LoaderComboBox();
        await contentWizard.switchToLiveEditFrame();
        await loaderComboBox.typeTextAndSelectOption(displayName, parentForComboBox);
        return await this.pause(1000);
    }
};
module.exports = LiveFormPanel;