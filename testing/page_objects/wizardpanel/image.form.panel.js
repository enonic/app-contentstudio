/**
 * Created on 21.03.2019.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const xpath = {
    captionTextArea: "//textarea[contains(@name,'caption')]",
    alternativeText: `//input[contains(@name,'altText')]`,
    imageEditor: "//div[contains(@id,'ImageEditor')]",
};

class ImageFormPanel extends Page {
    get photoWizardStep() {
        return "//ul[contains(@id,'WizardStepNavigator')]" + lib.tabBarItemByName("Photo");
    }

    get captionTextArea() {
        return lib.FORM_VIEW + xpath.captionTextArea;
    }

    get alternativeText() {
        return lib.FORM_VIEW + xpath.alternativeText;
    }

    get resetAutofocusButton() {
        return xpath.imageEditor + xpath.resetAutofocusButton;
    }

    clickOnPhotoWizardStep() {
        return this.clickOnElement(this.photoWizardStep);
    }

    //TODO type all data
    type(imageData) {
        return this.typeCaption(imageData.caption);
    }

    typeCaption(caption) {
        return this.typeTextInInput(this.captionTextArea, caption);
    }

    waitForCaptionDisplayed() {
        return this.waitForElementDisplayed(this.captionTextArea, appConst.shortTimeout);
    }

    getCaption() {
        return this.getTextInInput(this.captionTextArea).catch(err => {
            throw new Error('getting Caption text: ' + err);
        })
    }

    async waitForImageLoaded(ms) {
        let timeout = ms === undefined ? appConst.longTimeout : ms;
        let locator = xpath.imageEditor + "//div[@class='image-canvas']";
        return await this.waitForElementDisplayed(locator, appConst, timeout);
    }
}

module.exports = ImageFormPanel;
