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
    buttonCrop: "//button[contains(@class,'button-crop')]",
    buttonFocus: "//button[contains(@class,'button-focus')]",
    zoomContainer: "//div[@class='zoom-container']",
    zoomLine: "//div[@class='zoom-line']",
    zoomKnob: "//span[@class='zoom-knob']",
    resetAutofocusButton: "//button[contains(@id,'Button') and child::span[text()='Reset Autofocus']]",
    resetMaskButton: "//button[contains(@id,'Button') and child::span[text()='Reset Mask']]",
    closeEditModeButton: "//button[contains(@class,'close-button')]",
    buttonApply: "//button/span[text()='Apply']",
    resetMaskButton: "//button[contains(@id,'Button')]/span[text()='Reset Mask']",
    cropHandle: "//*[name()='svg' and contains(@id,'ImageEditor-dragHandle')]",
    //cropHandle: "//*[name()='g' and @class='edit-group crop-group']//circle",

};

class ImageEditor extends Page {

    get buttonResetFilters() {
        return xpath.imageEditor + xpath.buttonReset;
    }

    get buttonRotate() {
        return xpath.imageEditor + xpath.buttonRotate;
    }

    get buttonFlip() {
        return xpath.imageEditor + xpath.buttonFlip;
    }

    get buttonCrop() {
        return xpath.imageEditor + xpath.buttonCrop;
    }

    get buttonClose() {
        return xpath.imageEditor + xpath.closeEditModeButton;
    }

    get buttonFocus() {
        return xpath.imageEditor + xpath.buttonFocus;
    }

    get buttonApply() {
        return xpath.imageEditor + xpath.buttonApply;
    }

    get resetAutofocusButton() {
        return xpath.imageEditor + xpath.resetAutofocusButton;
    }

    get resetMaskButton() {
        return xpath.imageEditor + xpath.resetMaskButton;
    }

    get zoomKnob() {
        return xpath.imageEditor + xpath.zoomKnob;
    }

    get cropHandle() {
        return xpath.imageEditor + xpath.cropHandle;
    }

    waitForZoomKnobDisplayed() {
        return this.waitForElementDisplayed(this.zoomKnob, appConst.mediumTimeout);
    }

    waitForZoomKnobNotDisplayed() {
        return this.waitForElementNotDisplayed(this.zoomKnob, appConst.mediumTimeout);
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
            await this.pause(1000);
            await this.clickOnElement(this.buttonRotate);
            await this.waitForSpinnerNotVisible(appConst.longTimeout);
            return await this.pause(700);
        } catch (err) {
            await this.saveScreenshot('err_click_on_rotate_button');
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
            await this.saveScreenshot('err_click_on_reset_button');
            throw new Error('Image Editor, button reset  ' + err);
        }
    }


    waitForResetFilterNotDisplayed() {
        return this.waitForElementNotDisplayed(this.buttonResetFilters, appConst.shortTimeout);
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

    waitForCropButtonDisplayed() {
        return this.waitForElementDisplayed(this.buttonCrop, appConst.mediumTimeout);
    }

    async clickOnCropButton() {
        await this.waitForCropButtonDisplayed();
        await this.waitForElementEnabled(this.buttonCrop, appConst.mediumTimeout);
        return await this.clickOnElement(this.buttonCrop);
    }

    waitForFocusButtonDisplayed() {
        return this.waitForElementDisplayed(this.buttonFocus, appConst.mediumTimeout);
    }

    waitForFlipButtonDisplayed() {
        return this.waitForElementDisplayed(this.buttonFlip, appConst.mediumTimeout);
    }

    async clickOnFocusButton() {
        await this.waitForElementDisplayed(this.buttonFocus, appConst.mediumTimeout);
        await this.waitForElementEnabled(this.buttonFocus, appConst.mediumTimeout);
        return await this.clickOnElement(this.buttonFocus);
    }

    waitForApplyButtonDisplayed() {
        return this.waitForElementDisplayed(this.buttonApply, appConst.mediumTimeout);
    }

    waitForApplyButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.buttonApply, appConst.mediumTimeout);
    }

    waitForCloseButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.buttonClose, appConst.mediumTimeout);
    }

    waitForCloseEditModeButtonDisplayed() {
        return this.waitForElementDisplayed(this.buttonClose, appConst.mediumTimeout);
    }

    waitForCloseEditModeButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.buttonClose, appConst.mediumTimeout);
    }

    waitForResetMaskButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.resetMaskButton, appConst.mediumTimeout);
    }

    waitForResetMaskButtonDisplayed() {
        return this.waitForElementDisplayed(this.resetMaskButton, appConst.mediumTimeout);
    }

    async doZoomImage(offset) {
        let el = await this.findElement(this.zoomKnob);
        let yValue = await el.getLocation('y');
        let xValue = await el.getLocation('x');
        let y = parseInt(yValue);
        let x = parseInt(xValue) + offset;
        await el.dragAndDrop({x: x, y: y});
        return await this.pause(500);
    }

    async doCropImage(offset) {
        let el = await this.findElement(this.cropHandle);
        let yValue = await el.getAttribute('y');
        let xValue = await el.getAttribute('x');
        let y1 = parseInt(yValue) + offset;
        let x1 = parseInt(xValue);
        await el.dragAndDrop({x: x1, y: -200});
        return await this.pause(500);
    }

    async getZoomKnobValue() {
        let elem = await this.findElement(this.zoomKnob);
        let left = await elem.getCSSProperty('left');
        let value = left.value;

        let endIndex = value.indexOf('px');
        return value.substring(0, endIndex);
    }

    async clickOnApplyButton() {
        await this.waitForApplyButtonDisplayed();
        await this.clickOnElement(this.buttonApply);
        return await this.pause(500);
    }

    async clickOnResetMaskButton() {
        await this.waitForResetMaskButtonDisplayed();
        await this.clickOnElement(this.resetMaskButton);
        return await this.pause(500);
    }

    async clickOnCloseEditModeButton() {
        await this.waitForCloseEditModeButtonDisplayed();
        await this.clickOnElement(this.buttonClose);
        return await this.pause(500);
    }
}

module.exports = ImageEditor;
