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
    buttonReset: "//button[contains(@class,'button-reset')]",
    buttonRotate: "//button[contains(@class,'button-rotate')]",
    buttonFlip: "//button[contains(@title,'Flip')]",
};

class ImageFormPanel extends Page {

    get buttonReset() {
        return xpath.imageEditor + xpath.buttonReset;
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

    async clickOnFlipButton() {
        try {
            await this.waitForElementDisplayed(this.buttonFlip);
            await this.clickOnElement(this.buttonFlip);
            await this.pause(700);
        } catch (err) {
            this.saveScreenshot('err_click_on_flip_button');
            throw new Error('Image Editor, button flip  ' + err);
        }
    }

    async clickOnRotateButton() {
        try {
            await this.waitForElementDisplayed(this.buttonRotate);
            await this.clickOnElement(this.buttonRotate);
            await this.pause(700);
        } catch (err) {
            this.saveScreenshot('err_click_on_rotate_button');
            throw new Error('Image Editor, button rotate  ' + err);
        }
    }

    clickOnResetButton() {
        return this.clickOnElement(this.buttonReset).catch(err => {
            this.saveScreenshot('err_click_on_reset_button');
            throw new Error('Image Editor, button reset  ' + err);
        })
    }

    waitForResetFilterDisplayed() {
        return this.waitForElementDisplayed(this.buttonReset, appConst.TIMEOUT_2);
    }

    waitForResetFilterNotDisplayed() {
        return this.waitForElementNotDisplayed(this.buttonReset, appConst.TIMEOUT_2);
    }

    //TODO type all data
    type(imageData) {
        return this.typeCaption(imageData.caption);
    }

    typeCaption(caption) {
        return this.typeTextInInput(this.captionTextArea, caption);
    }

    waitForCaptionDisplayed() {
        return this.waitForElementDisplayed(this.captionTextArea, appConst.TIMEOUT_2);
    }

    getCaption() {
        return this.getTextInInput(this.captionTextArea).catch(err => {
            throw new Error('getting Caption text: ' + err);
        })
    }
};
module.exports = ImageFormPanel;
