/**
 * Created on 08.01.2024 updated 21.04.2026
 */
const appConst = require('../../../libs/app_const');
const BaseDropdown = require('./base.dropdown');
const {DROPDOWN, TREE_GRID} = require('../../../libs/elements');

const XPATH = {
    dataComponentDiv: "//div[@data-component='ImageSelectorDropdown']",
    imageByDisplayNameInTreeMode: displayName =>
        `//div[@role='treeitem']//div[@data-component='ContentLabel' and descendant::span[text()='${displayName}']]`,
};

class ImageSelectorDropdown extends BaseDropdown {

    constructor(parentElementXpath) {
        super();
        this._container = parentElementXpath;
    }

    get container() {
        return this._container;
    }

    get dataComponentDiv() {
        return "//div[@data-component='ImageSelector']";
    }

    async insertTextInOptionsFilterInput(text, parentLocator) {
        await this.doFilterItem(text, parentLocator);
    }

    async selectFilteredImageInFlatMode(imageDisplayName) {
        try {
            await this.clickOnOptionByDisplayName(imageDisplayName);
        } catch (err) {
            await this.handleError(`ImageSelectorDropdown - Error during selecting the option: ${imageDisplayName} in flat mode`,
                'err_img_selector_flat', err);
        }
    }

    // Click on images and select options in the expanded dropdown(Flat-mode)
    async clickOnImagesInDropdownList(numberOfImages) {
        let locator = `//li[contains(@class,'item-view-wrapper') and descendant::h6[contains(@class,'main-name')]]//img`
        let elements = await this.findElements(locator).slice(0, numberOfImages);
        for (const el of elements) {
            await el.click();
            await this.pause(500);
        }
    }

    // Overrides BaseDropdown: v6 image items use span.font-semibold inside ImageSelectorItemView
    async clickOnOptionByDisplayName(displayName) {
        try {
            let locator = `//div[@data-component='ImageSelectorItemView' and descendant::span[contains(@class,'font-semibold') and text()='${displayName}']]`;
            await this.waitForElementDisplayed(locator);
            await this.clickOnElement(locator);
        } catch (err) {
            await this.handleError(`ImageSelectorDropdown - tried to click on option: ${displayName}`, 'err_click_img_option', err);
        }
    }

    async clickOnImageInDropdownListTreeMode(imageDisplayName) {
        let locator = XPATH.imageByDisplayNameInTreeMode(imageDisplayName);
        await this.waitForElementDisplayed(locator);
        await this.clickOnElement(locator);
    }


    // Gets all content-statuses in the expanded dropdown list (tree mode)
    async getImagesStatusInOptions() {
        const locator = `//div[@role='treeitem']` + TREE_GRID.CONTENT_STATUS;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    // Gets content-status by displayName in the expanded dropdown list
    async getTreeModeContentStatus(displayName) {
        let statusEl = XPATH.contentListElement + lib.itemByDisplayName(displayName) + "/following::div[contains(@class,'status')][1]";
        await this.waitForElementDisplayed(statusEl, appConst.mediumTimeout);
        return await this.getTextInElements(statusEl);
    }

    async getImagesTitleAttribute(elements) {
        let titles = await elements.map(async (el) => await el.getAttribute("title"));
        await Promise.all(titles);
        return titles;
    }

    async scrollDownInDropdownList(parentXpath, deltaY) {
        const elementForScroll = await this.findElement(parentXpath + XPATH.imageContentListBoxUL);
        await this.performScrollWithWheelActions(elementForScroll, deltaY);
        await this.pause(1000);
    }

    async getOptionsDisplayNameInTreeMode() {
        const locator = DROPDOWN.CONTENT_LABEL_OPTIONS_NAME;
        await this.waitForElementDisplayed(locator);
        await this.pause(500);
        return await this.getTextInDisplayedElements(locator);
    }

    async getOptionsDisplayNameInFlatMode() {
        const locator = `//div[@data-component='ImageSelectorItemView']//span[contains(@class,'font-semibold') and contains(@class,'text-base')]`;
        await this.waitForElementDisplayed(locator);
        await this.pause(500);
        return await this.getTextInDisplayedElements(locator);
    }

}

module.exports = ImageSelectorDropdown;
