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
        try {
            let parentForComboBox = `//div[contains(@id,'ImagePlaceholder')]`;
            let contentWizard = new ContentWizard();
            let loaderComboBox = new LoaderComboBox();
            await contentWizard.switchToLiveEditFrame();
            await loaderComboBox.typeTextAndSelectOption(displayName, parentForComboBox);
            return await this.pause(1000);
        } catch (err) {
            throw new Error(`Error when selecting the image:  ${displayName} in Live Edit - ` + err);
        }
    }

    async selectPartByDisplayName(displayName) {
        try {
            let parentForComboBox = `//div[contains(@id,'PartPlaceholder')]`;
            let contentWizard = new ContentWizard();
            let loaderComboBox = new LoaderComboBox();
            await contentWizard.switchToLiveEditFrame();
            await loaderComboBox.typeTextAndSelectOption(displayName, parentForComboBox);
            return await this.pause(1000);
        } catch (err) {
            throw new Error("Error when selecting the part in Live Edit - " + err);
        }
    }

    async getTextInPart() {
        try {
            let selector = "//div[contains(@id,'PartComponentView')]/p";
            await this.waitForElementDisplayed(selector,appConst.TIMEOUT_2);
            return await this.getText(selector);
        } catch (err) {
            throw new Error("Error when getting text in the part component! " + err);
        }
    }
};
module.exports = LiveFormPanel;