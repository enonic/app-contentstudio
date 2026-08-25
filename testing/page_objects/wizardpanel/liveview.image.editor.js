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
    buttonRotate: "//button[@aria-label='Rotate clockwise']",
    buttonFlip: "//button[@aria-label='Flip']",
    buttonCrop: "//button[@aria-label='Crop Image']",
    buttonFocus: "//button[@aria-label='Set Autofocus']",
    buttonUpload: "//button[@aria-label='Upload image']",
    // TODO: zoom slider is not present in the new Image Editor (v6) - update after UX is clarified:
    zoomContainer: "//div[@class='zoom-container']",
    zoomLine: "//div[@class='zoom-line']",
    zoomKnob: "//span[@class='zoom-knob']",
    // Single contextual 'Reset' button replaces 'Reset filters', 'Reset Mask' and 'Reset Autofocus':
    resetAutofocusButton: "//button[@data-component='Button' and contains(.,'Reset')]",
    closeEditModeButton: "//button[@aria-label='Cancel']",
    buttonApply: "//button[@data-component='Button' and contains(.,'Apply')]",
    // Transparent hit area of a crop handle. The handles have no id, so the resize cursor is the only marker:
    cropHandle: (cursor) => `//*[name()='rect' and @fill='transparent' and contains(@style,'${cursor}')]`,
    focusCircle: "//*[name()='svg']//*[name()='circle' and @fill='none' and @stroke='red']",
};

// Cursor of every crop handle, see HANDLE_CURSOR in the image-uploader 'lib/crop.ts':
const CROP_HANDLE_CURSOR = {
    tl: 'nw-resize',
    tr: 'ne-resize',
    bl: 'sw-resize',
    br: 'se-resize',
    tm: 'row-resize',
    bm: 'row-resize',
    ml: 'col-resize',
    mr: 'col-resize',
};

// Order in the DOM for the handles that share a cursor with another handle:
const CROP_HANDLE_INDEX = { tm: 1, bm: 2, ml: 1, mr: 2 };

class LiveViewImageEditor extends Page {
    get buttonReset() {
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

    get buttonCancel() {
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

    // Locator of one of the 8 handles of the crop rectangle: 'tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br'.
    // 'tm'/'bm' and 'ml'/'mr' share a cursor, so they are told apart by their order in the DOM.
    getCropHandleLocator(handle) {
        const cursor = CROP_HANDLE_CURSOR[handle];
        if (!cursor) {
            throw new Error(`Unknown crop handle: '${handle}', expected one of ${Object.keys(CROP_HANDLE_CURSOR)}`);
        }
        const locator = xpath.imageEditor + xpath.imageContainer + xpath.cropHandle(cursor);
        const index = CROP_HANDLE_INDEX[handle];
        return index ? `(${locator})[${index}]` : locator;
    }

    get imageContainer() {
        return xpath.imageEditor + xpath.imageContainer;
    }

    get focusCircle() {
        return xpath.imageEditor + xpath.imageContainer + xpath.focusCircle;
    }

    async clickOnFlipButton() {
        try {
            await this.waitForElementDisplayed(this.buttonFlip);
            await this.waitForElementEnabled(this.buttonFlip);
            await this.clickOnElement(this.buttonFlip);
            // flip switches the editor to 'loading' mode, wait for 'ready' mode again:
            await this.waitForElementEnabled(this.buttonFlip);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Image Editor, button flip', 'err_click_on_flip_button', err);
        }
    }

    async clickOnRotateButton() {
        try {
            await this.waitForElementDisplayed(this.buttonRotate);
            await this.waitForElementEnabled(this.buttonRotate);
            await this.clickOnElement(this.buttonRotate);
            // rotate switches the editor to 'loading' mode, wait for 'ready' mode again:
            await this.waitForElementEnabled(this.buttonRotate);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Image Editor, button rotate', 'err_click_on_rotate_button', err);
        }
    }

    async waitForResetButtonNotDisplayed() {
        await this.waitForElementNotDisplayed(this.buttonReset);
    }

    async clickOnResetButton() {
        try {
            await this.waitForElementEnabled(this.buttonReset);
            await this.clickOnElement(this.buttonReset);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Image Editor, button reset filters', 'err_click_on_reset_button', err);
        }
    }

    async waitForResetButtonDisplayed() {
        try {
            await this.waitForElementDisplayed(this.buttonReset);
        } catch (err) {
            await this.handleError('Image Editor, button reset', 'err_wait_for_reset_displayed', err);
        }
    }

    async waitForResetButtonNotDisplayed() {
        try {
            await this.waitForElementNotDisplayed(this.buttonReset);
        } catch (err) {
            await this.handleError(
                'Image Editor, button reset filters should not be displayed',
                'err_wait_for_reset_not_displayed',
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
            return await this.waitUntilElementNotVisible(this.focusCircle);
        } catch (err) {
            await this.handleError('Image Editor, focus circle not displayed', 'err_focus_circle_displayed', err);
        }
    }

    async waitForApplyButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.buttonApply);
        } catch (err) {
            await this.handleError('Image Editor, apply button displayed', 'err_apply_button_displayed', err);
        }
    }

    waitForApplyButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.buttonApply);
    }

    async waitForUploadButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.buttonUpload);
        } catch (err) {
            await this.handleError('Image Editor, upload button displayed', 'err_upload_button_displayed', err);
        }
    }

    async waitForUploadButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.buttonUpload);
        } catch (err) {
            await this.handleError('Image Editor, upload button not displayed', 'err_upload_button_not_displayed', err);
        }
    }

    waitForCancelEditModeButtonDisplayed() {
        return this.waitForElementDisplayed(this.buttonCancel);
    }

    waitForCancelEditModeButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.buttonCancel);
    }

    // Resizes the crop area: drags one of the handles of the crop rectangle by the given offset in pixels.
    // 'handle' is one of 'tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br', the bottom right corner by default.
    // 'offsetY' defaults to 'offsetX', so doCropImage(-100) drags the corner 100px up and to the left.
    async doCropImage(offsetX, offsetY = offsetX, handle = 'br') {
        try {
            let locator = this.getCropHandleLocator(handle);
            // the hit area is transparent by design, so only its presence can be verified:
            await this.waitForExist(locator, appConst.mediumTimeout);
            let cropHandle = await this.findElement(locator);
            return await this.dragElementInsideImage(cropHandle, offsetX, offsetY);
        } catch (err) {
            await this.handleError(`Image Editor, do crop image, handle '${handle}'`, 'err_do_crop_image', err);
        }
    }

    async doDragFocus(offsetX, offsetY) {
        try {
            await this.waitForFocusCircleDisplayed();
            let circle = await this.findElement(this.focusCircle);
            return await this.dragElementInsideImage(circle, offsetX, offsetY);
        } catch (err) {
            await this.handleError('Image Editor, drag the focus circle', 'err_drag_focus_circle', err);
        }
    }

    // Drags an element (the focus circle, a crop handle) inside the 'ImageUploaderInputImage' container:
    // the drag starts in the centre of the element and the drop point is clamped to the container's bounds.
    // 'dragAndDrop' is not used here, because the editor starts the drag on 'mousedown' and then tracks
    // 'mousemove' on the window - the pointer has to be pressed, paused and then moved in several steps.
    async dragElementInsideImage(element, offsetX, offsetY) {
        let container = await this.findElement(this.imageContainer);
        let containerLocation = await container.getLocation();
        let containerSize = await container.getSize();
        let elementLocation = await element.getLocation();
        let elementSize = await element.getSize();
        let startX = Math.round(elementLocation.x + elementSize.width / 2);
        let startY = Math.round(elementLocation.y + elementSize.height / 2);
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

    async waitForCropButtonDisabled() {
        await this.waitForElementDisabled(this.buttonCrop);
    }

    waitForFocusButtonDisabled() {
        return this.waitForElementDisabled(this.buttonFocus);
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

    async clickOnCancelButton() {
        try {
            await this.waitForElementDisplayed(this.buttonCancel);
            await this.waitForElementEnabled(this.buttonCancel);
            await this.clickOnElement(this.buttonCancel);
            // the editor returns to 'ready' mode, 'Cancel' gets not displayed:
            await this.waitForElementNotDisplayed(this.buttonCancel);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Image Editor, button cancel', 'err_click_on_cancel_button', err);
        }
    }
}

module.exports = LiveViewImageEditor;
