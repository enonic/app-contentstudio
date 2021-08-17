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
    buttonReset: "//button[contains(@class,'button-reset') and child::span[text()='Reset filters']]",
    buttonRotate: "//button[contains(@class,'button-rotate')]",
    buttonFlip: "//button[contains(@title,'Flip')]",
};

class ImageFormPanel extends Page {

    get buttonResetFilters() {
        return xpath.imageEditor + xpath.buttonReset;
    }

    get photoWizardStep() {
        return "//ul[contains(@id,'WizardStepNavigator')]" + lib.tabBarItemByName("Photo");
    }

    get buttonRotate() {
        return xpath.imageEditor + xpath.buttonRotate;
    }

    get buttonFlip() {
        return xpath.imageEditor + xpath.buttonFlip;
    }

    get captionTextArea() {
        return lib.FORM_VIEW + xpath.captionTextArea;
    }

    get alternativeText() {
        return lib.FORM_VIEW + xpath.alternativeText;
    }

    clickOnPhotoWizardStep() {
        return this.clickOnElement(this.photoWizardStep);
    }

    async clickOnFlipButton() {
        try {
            await this.waitForElementDisplayed(this.buttonFlip, appConst.mediumTimeout);
            await this.waitForElementEnabled(this.buttonFlip, appConst.longTimeout);
            await this.pause(1200);
            await this.clickOnElement(this.buttonFlip);
            await this.waitForSpinnerNotVisible(appConst.longTimeout);
            return await this.pause(700);
        } catch (err) {
            this.saveScreenshot('err_click_on_flip_button');
            throw new Error('Image Editor, button flip  ' + err);
        }
    }

    async clickOnRotateButton() {
        try {
            await this.waitForElementDisplayed(this.buttonRotate, appConst.mediumTimeout);
            await this.waitForElementEnabled(this.buttonRotate, appConst.longTimeout);
            await this.pause(1200);
            await this.clickOnElement(this.buttonRotate);
            await this.waitForSpinnerNotVisible(appConst.longTimeout);
            return await this.pause(700);
        } catch (err) {
            this.saveScreenshot('err_click_on_rotate_button');
            throw new Error('Image Editor, button rotate  ' + err);
        }
    }

    async clickOnResetButton() {
        try {
            await this.waitForElementEnabled(this.buttonResetFilters, appConst.mediumTimeout);
            await this.clickOnElement(this.buttonResetFilters);
            await this.waitForSpinnerNotVisible(appConst.longTimeout);
            return await this.pause(500);
        } catch (err) {
            this.saveScreenshot('err_click_on_reset_button');
            throw new Error('Image Editor, button reset  ' + err);
        }
    }

    waitForResetFilterDisplayed() {
        return this.waitForElementDisplayed(this.buttonResetFilters, appConst.shortTimeout).catch(err => {
            throw new Error("Image Wizard - Reset Filter button, " + err);
        });
    }

    waitForResetFilterNotDisplayed() {
        return this.waitForElementNotDisplayed(this.buttonResetFilters, appConst.shortTimeout);
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

    async waitForResetFiltersDisplayed() {
        try {
            await this.waitForElementDisplayed(this.buttonResetFilters, appConst.shortTimeout);
        } catch (err) {
            throw new Error("Button 'Reset filters' is not displayed in 2 seconds " + err);
        }
    }

    async waitForResetFiltersNotDisplayed() {
        try {
            await this.waitForElementNotDisplayed(this.buttonResetFilters, appConst.shortTimeout);
        } catch (err) {
            throw new Error("Button 'Reset filters' is still displayed in 2 seconds " + err);
        }
    }

    async waitForImageLoaded(ms) {
        let timeout = ms === undefined ? appConst.longTimeout : ms;
        let locator = xpath.imageEditor + "//div[@class='image-canvas']";
        return await this.waitForElementDisplayed(locator, appConst, timeout);
    }
}

module.exports = ImageFormPanel;
