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
    imageContainer: "//div[@data-component='ImageUploaderInputImage']",
    buttonReset: "//button[@data-component='Button' and contains(.,'Reset')]",
    // Toolbar buttons are located by 'aria-label': 'Tooltip' wraps them with 'asChild' and overwrites
    // data-component with 'Tooltip', and lucide icon names are not stable between versions
    // ('FlipHorizontal' is an alias and renders as 'lucide-square-centerline-dashed-horizontal'):
    buttonRotate: "//button[@aria-label='Rotate clockwise']",
    buttonFlip: "//button[@aria-label='Flip']",
    buttonCrop: "//button[@aria-label='Crop Image']",
    buttonFocus: "//button[@aria-label='Set Autofocus']",
    // 'Upload' is displayed in 'ready' mode only, in 'crop'/'focus' mode it is replaced with 'Apply' and 'Cancel'.
    // The hidden file input has the same aria-label, so the button node is required here:
    buttonUpload: "//button[@aria-label='Upload image']",
    // TODO: zoom slider is not present in the new Image Editor (v6) - update after UX is clarified:
    zoomContainer: "//div[@class='zoom-container']",
    zoomLine: "//div[@class='zoom-line']",
    zoomKnob: "//span[@class='zoom-knob']",
    // Single contextual 'Reset' button replaces 'Reset filters', 'Reset Mask' and 'Reset Autofocus':
    resetAutofocusButton: "//button[@data-component='Button' and contains(.,'Reset')]",
    resetMaskButton: "//button[@data-component='Button' and contains(.,'Reset')]",
    closeEditModeButton: "//button[@aria-label='Cancel']",
    buttonApply: "//button[@data-component='Button' and contains(.,'Apply')]",
    // TODO: crop has no drag handles in the new editor (area is drawn with two clicks) - update doCropImage:
    cropHandle: "//*[name()='svg' and contains(@id,'ImageEditor-dragHandle')]//*[name()='circle']",
    focusCircle: "//*[name()='svg']//*[name()='circle' and @fill='none' and @stroke='red']",
};

class LiveViewImageEditor extends Page {
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

    get buttonUpload() {
        return xpath.imageEditor + xpath.buttonUpload;
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

    get imageContainer() {
        return xpath.imageEditor + xpath.imageContainer;
    }

    get focusCircle() {
        return xpath.imageEditor + xpath.imageContainer + xpath.focusCircle;
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

    async clickOnResetButton() {
        try {
            await this.waitForElementEnabled(this.buttonResetFilters);
            await this.clickOnElement(this.buttonResetFilters);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Image Editor, button reset filters', 'err_click_on_reset_filters_button', err);
        }
    }

    waitForResetButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.buttonResetFilters);
    }

    async waitForResetButtonDisplayed() {
        try {
            await this.waitForElementDisplayed(this.buttonResetFilters);
        } catch (err) {
            await this.handleError('Image Editor, button reset filters', 'err_wait_for_reset_filters_displayed', err);
        }
    }

    async waitForResetButtonNotDisplayed() {
        try {
            await this.waitForElementNotDisplayed(this.buttonResetFilters);
        } catch (err) {
            await this.handleError(
                'Image Editor, button reset filters not displayed',
                'err_wait_for_reset_filters_not_displayed',
                err,
            );
        }
    }

    waitForCropButtonDisplayed() {
        return this.waitForElementDisplayed(this.buttonCrop);
    }

    async clickOnCropButton() {
        await this.waitForCropButtonDisplayed();
        await this.waitForElementEnabled(this.buttonCrop);
        return await this.clickOnElement(this.buttonCrop);
    }

    waitForFocusButtonDisplayed() {
        return this.waitForElementDisplayed(this.buttonFocus);
    }

    waitForFlipButtonDisplayed() {
        return this.waitForElementDisplayed(this.buttonFlip);
    }

    async clickOnFocusButton() {
        await this.waitForElementDisplayed(this.buttonFocus);
        await this.waitForElementEnabled(this.buttonFocus);
        return await this.clickOnElement(this.buttonFocus);
    }

    async waitForFocusCircleDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.focusCircle);
        } catch (err) {
            await this.handleError('Image Editor, focus circle displayed', 'err_focus_circle_displayed', err);
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

    async waitForUploadButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.buttonUpload, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Image Editor, upload button displayed', 'err_upload_button_displayed', err);
        }
    }

    async waitForUploadButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.buttonUpload, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Image Editor, upload button not displayed', 'err_upload_button_not_displayed', err);
        }
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
        await el.dragAndDrop({ x: x, y: y });
        return await this.pause(500);
    }

    async doCropImage(offset) {
        try {
            let el = await this.findElement(this.cropHandle);
            let yValue = await el.getAttribute('cy');
            let xValue = await el.getAttribute('cx');
            let y1 = parseInt(yValue) + offset;
            let x1 = parseInt(xValue);
            await el.dragAndDrop({ x: x1, y: y1 });
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Image Editor, do crop image', 'err_do_crop_image', err);
        }
    }

    async doDragFocus(offsetX, offsetY) {
        try {
            await this.waitForFocusCircleDisplayed();
            let container = await this.findElement(this.imageContainer);
            let containerLocation = await container.getLocation();
            let containerSize = await container.getSize();
            let circle = await this.findElement(this.focusCircle);
            let circleLocation = await circle.getLocation();
            let circleSize = await circle.getSize();
            // the drag starts in the centre of the circle:
            let startX = Math.round(circleLocation.x + circleSize.width / 2);
            let startY = Math.round(circleLocation.y + circleSize.height / 2);
            let endX = this.getPointInsideRange(
                startX + offsetX,
                containerLocation.x,
                containerLocation.x + containerSize.width,
            );
            let endY = this.getPointInsideRange(
                startY + offsetY,
                containerLocation.y,
                containerLocation.y + containerSize.height,
            );
            let steps = 4;
            let moveActions = [];
            for (let i = 1; i <= steps; i++) {
                moveActions.push({
                    type: 'pointerMove',
                    duration: 100,
                    origin: 'viewport',
                    x: Math.round(startX + ((endX - startX) * i) / steps),
                    y: Math.round(startY + ((endY - startY) * i) / steps),
                });
            }
            await this.getBrowser().performActions([
                {
                    type: 'pointer',
                    id: 'pointer1',
                    parameters: { pointerType: 'mouse' },
                    actions: [
                        { type: 'pointerMove', duration: 0, origin: 'viewport', x: startX, y: startY },
                        { type: 'pointerDown', button: 0 },
                        // the editor subscribes to the window 'mousemove' after 'mousedown', give it time:
                        { type: 'pause', duration: 200 },
                        ...moveActions,
                        { type: 'pause', duration: 200 },
                        { type: 'pointerUp', button: 0 },
                    ],
                },
            ]);
            await this.getBrowser().releaseActions();
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Image Editor, drag the focus circle', 'err_drag_focus_circle', err);
        }
    }

    // Keeps the drop point inside the container, the 1px inset guarantees that the pointer stays over the image:
    getPointInsideRange(value, min, max) {
        return Math.round(Math.min(Math.max(value, min + 1), max - 1));
    }

    async waitForFocusCircleLoaded() {
        try {
            await this.waitForElementDisplayed(this.focusCircle);
            let circle = await this.findElement(this.focusCircle);
            await this.waitForElementEnabled(circle);
        } catch (e) {
            await this.handleError('Image Editor, wait for focus circle loaded', 'err_wait_for_focus_circle_loaded', e);
        }
    }

    async getZoomKnobValue() {
        let elem = await this.findElement(this.zoomKnob);
        let left = await elem.getCSSProperty('left');
        let value = left.value;

        let endIndex = value.indexOf('px');
        return value.substring(0, endIndex);
    }

    async waitForCropButtonDisabled() {
        await this.waitForElementDisabled(this.buttonCrop);
    }

    async waitForFlipButtonDisabled() {
        await this.waitForElementDisabled(this.buttonFlip);
    }
    async waitForRotateButtonDisabled() {
        await this.waitForElementDisabled(this.buttonRotate);
    }

    async waitForFlipButtonEnabled() {
        await this.waitForElementEnabled(this.buttonFlip);
    }

    async waitForFocusButtonEnabled() {
        await this.waitForElementEnabled(this.buttonFocus);
    }
    async waitForRotateButtonEnabled() {
        await this.waitForElementEnabled(this.buttonRotate);
    }

    async waitForCropButtonEnabled() {
        await this.waitForElementEnabled(this.buttonCrop);
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

    async clickOnCancelButton() {
        try {
            await this.waitForElementDisplayed(this.buttonClose, appConst.mediumTimeout);
            await this.waitForElementEnabled(this.buttonClose, appConst.mediumTimeout);
            await this.clickOnElement(this.buttonClose);
            // the editor returns to 'ready' mode, 'Cancel' gets not displayed:
            await this.waitForElementNotDisplayed(this.buttonClose, appConst.mediumTimeout);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Image Editor, button cancel', 'err_click_on_cancel_button', err);
        }
    }
}

module.exports = LiveViewImageEditor;
