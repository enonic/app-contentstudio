/**
 * Created on 21.03.2019. updated on 11.06.2026
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const xpath = {
    container: "//div[@data-component='LiveViewImageEditor']",
    captionTextArea: "//textarea[contains(@name,'caption')]",
    alternativeText: `//input[contains(@name,'altText')]`,
    imageEditor: "//div[@data-component='ImageUploaderInput']",
    buttonReset: "//button[@data-component='Button' and contains(.,'Reset')]",
    buttonRotate: "//button[@data-component='IconButton' and descendant::*[name()='svg' and contains(@class,'lucide-rotate-cw')]]",
    buttonFlip: "//button[@data-component='IconButton' and descendant::*[name()='svg' and contains(@class,'lucide-flip-horizontal')]]",
    buttonCrop: "//button[@data-component='IconButton' and descendant::*[name()='svg' and contains(@class,'lucide-crop')]]",
    buttonFocus: "//button[@data-component='IconButton' and descendant::*[name()='svg' and contains(@class,'lucide-focus')]]",
    // TODO: zoom slider is not present in the new Image Editor (v6) - update after UX is clarified:
    zoomContainer: "//div[@class='zoom-container']",
    zoomLine: "//div[@class='zoom-line']",
    zoomKnob: "//span[@class='zoom-knob']",
    // Single contextual 'Reset' button replaces 'Reset filters', 'Reset Mask' and 'Reset Autofocus':
    resetAutofocusButton: "//button[@data-component='Button' and contains(.,'Reset')]",
    resetMaskButton: "//button[@data-component='Button' and contains(.,'Reset')]",
    closeEditModeButton: "//button[@data-component='IconButton' and descendant::*[name()='svg' and contains(@class,'lucide-x')]]",
    buttonApply: "//button[@data-component='Button' and contains(.,'Apply')]",
    // TODO: crop has no drag handles in the new editor (area is drawn with two clicks) - update doCropImage:
    cropHandle: "//*[name()='svg' and contains(@id,'ImageEditor-dragHandle')]//*[name()='circle']",
    focusCircle: "//*[name()='svg']//*[name()='circle' and @fill='none' and @stroke='red']",
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

    get focusCircle() {
        return xpath.imageEditor + xpath.focusCircle;
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
            await this.clickOnElement(this.buttonFlip);
            // flip switches the editor to 'loading' mode, wait for 'ready' mode again:
            await this.waitForElementEnabled(this.buttonFlip, appConst.longTimeout);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Image Editor, button flip', 'err_click_on_flip_button', err);
        }
    }

    async clickOnRotateButton() {
        try {
            await this.waitForElementDisplayed(this.buttonRotate, appConst.mediumTimeout);
            await this.waitForElementEnabled(this.buttonRotate, appConst.longTimeout);
            await this.clickOnElement(this.buttonRotate);
            // rotate switches the editor to 'loading' mode, wait for 'ready' mode again:
            await this.waitForElementEnabled(this.buttonRotate, appConst.longTimeout);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Image Editor, button rotate', 'err_click_on_rotate_button', err);
        }
    }

    async clickOnResetFiltersButton() {
        try {
            await this.waitForElementEnabled(this.buttonResetFilters, appConst.mediumTimeout);
            await this.clickOnElement(this.buttonResetFilters);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Image Editor, button reset filters', 'err_click_on_reset_filters_button', err);
        }
    }

    waitForResetFilterNotDisplayed() {
        return this.waitForElementNotDisplayed(this.buttonResetFilters, appConst.shortTimeout);
    }

    async waitForResetFiltersDisplayed() {
        try {
            await this.waitForElementDisplayed(this.buttonResetFilters, appConst.shortTimeout);
        } catch (err) {
            await this.handleError('Image Editor, button reset filters', 'err_wait_for_reset_filters_displayed', err);
        }
    }

    async waitForResetFiltersNotDisplayed() {
        try {
            await this.waitForElementNotDisplayed(this.buttonResetFilters, appConst.shortTimeout);
        } catch (err) {
            await this.handleError('Image Editor, button reset filters not displayed', 'err_wait_for_reset_filters_not_displayed', err);
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

    async waitForFocusCircleDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.focusCircle, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_focus_circle_displayed');
            throw new Error(`Focus circle is not displayed, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForFocusCircleNotDisplayed() {
        try {
            return await this.waitUntilElementNotVisible(this.focusCircle, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Image Editor, focus circle not displayed', 'err_focus_circle_displayed', err);
        }
    }

    async waitForApplyButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.buttonApply, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Image Editor, apply button displayed', 'err_apply_button_displayed', err);
        }
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

    waitForResetAutofocusButtonDisplayed() {
        return this.waitForElementDisplayed(this.resetAutofocusButton, appConst.mediumTimeout);
    }

    async clickOnResetAutofocusButton() {
        await this.waitForResetAutofocusButtonDisplayed();
        await this.clickOnElement(this.resetAutofocusButton);
        return this.pause(300);
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
        try {
            let el = await this.findElement(this.cropHandle);
            let yValue = await el.getAttribute('cy');
            let xValue = await el.getAttribute('cx');
            let y1 = parseInt(yValue) + offset;
            let x1 = parseInt(xValue);
            await el.dragAndDrop({x: x1, y: y1});
            return await this.pause(500);
        }catch(err){
            await this.handleError('Image Editor, do crop image', 'err_do_crop_image', err);
        }
    }

    async doDragFocus(cx, cy) {
        let circle = await this.findElement(this.focusCircle);
        await circle.dragAndDrop({x: cx, y: cy});
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
