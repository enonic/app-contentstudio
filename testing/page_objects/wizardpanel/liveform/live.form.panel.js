/**
 * Created on 15.02.2018.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const lib = require('../../../libs/elements');
const ContentWizard = require('../content.wizard.panel');
const LoaderComboBox = require('../../../page_objects/components/loader.combobox');
const xpath = {
    container: "//div[contains(@id,'LiveFormPanel')]",
    fragmentComponentView: "//div[contains(@id,'FragmentComponentView')]",
    itemViewContextMenu: "//div[contains(@id,'ItemViewContextMenu')]",
    layoutComponentView: "//div[contains(@id,'LayoutComponentView')]",
    fragmentPlaceHolderDiv: `//div[contains(@id,'FragmentPlaceholder')]`,
    sectionTextComponentView: "//section[contains(@id,'TextComponentView')]",
    editableTextComponentView: "//*[contains(@id,'TextComponentView') and @contenteditable='true']",
    previewNotAvailableSpan: "//p[@class='no-preview-message']/span[1]",
    imageInComponent: "//figure/img",
    editableTextComponentByText: text => `//section[contains(@id,'TextComponentView') and @contenteditable='true']//p[contains(.,'${text}')]`,
    textComponentByText: text => `//section[contains(@id,'TextComponentView')]//p[contains(.,'${text}')]`,
    captionByText: text => `//section[contains(@id,'TextComponentView') and @contenteditable='true']//figcaption[contains(.,'${text}')]`
};

class LiveFormPanel extends Page {

    waitForOpened() {
        return this.waitForElementDisplayed(xpath.container, appConst.shortTimeout);
    }

    waitForHidden() {
        return this.waitForElementNotDisplayed(xpath.container, appConst.shortTimeout);
    }

    async waitForLayoutComboBoxOptionFilterDisplayed() {
        let locator = `//div[contains(@id,'LayoutPlaceholder')]` + lib.COMBO_BOX_OPTION_FILTER_INPUT;
        return await this.waitForElementDisplayed(locator, appConst.mediumTimeout)
    }

    async selectLayoutByDisplayName(displayName) {
        try {
            let parentForComboBox = `//div[contains(@id,'LayoutPlaceholder')]`;
            let contentWizard = new ContentWizard();
            let loaderComboBox = new LoaderComboBox();
            await contentWizard.switchToLiveEditFrame();
            await loaderComboBox.typeTextAndSelectOption(displayName, parentForComboBox);
            await contentWizard.switchToParentFrame();
            return await this.pause(1000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_select_layout');
            throw new Error(`Error after selecting the layout in Live Edit - screenshot` + screenshot + ' ' + err);
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
            let screenshot = await this.saveScreenshotUniqueName('err_select_layout');
            throw new Error('Error when selecting the part in Live Edit -screenshot ' + screenshot + '  ' + err);
        }
    }

    async getTextInPart() {
        try {
            let selector = "//div[contains(@id,'PartComponentView')]/p";
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            return await this.getText(selector);
        } catch (err) {
            throw new Error('Error when getting text in the part component! ' + err);
        }
    }

    async getTextInTextComponent() {
        try {
            let selector = xpath.sectionTextComponentView + '/p';
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            return await this.getTextInDisplayedElements(selector);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_txt_component');
            throw new Error('Error, Live Edit frame, text component, screenshot ' + screenshot + ' ' + err);
        }
    }

    async verifyImageElementsInFragmentComponent(index) {
        let locator = xpath.fragmentComponentView + xpath.imageInComponent;
        let elements = await this.findElements(locator);
        if (elements.length === 0) {
            await this.saveScreenshotUniqueName('err_image_element');
            throw new Error("Live Edit - 'img' element was not found!");
        }
        return elements[index].getAttribute('src');
    }

    async verifyImageElementsInTextComponent(index) {
        let locator = xpath.sectionTextComponentView + xpath.imageInComponent;
        let elements = await this.findElements(locator);
        if (elements.length === 0) {
            await this.saveScreenshotUniqueName('err_image_element');
            throw new Error("Live Edit - 'img' element was not found!");
        }
        return elements[index].getAttribute('src');
    }

    async waitForTextComponentEmpty(index) {
        let locator = xpath.sectionTextComponentView;
        // let elements = await this.findElements(locator);
        await this.getBrowser().waitUntil(async () => {
            let elements = await this.findElements(locator);
            let text = await elements[index].getAttribute("class");
            return text.includes('empty');
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Text component should be empty"});
    }

    async getTextInLayoutComponent() {
        try {
            let selector = xpath.layoutComponentView + xpath.sectionTextComponentView + '/p';
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            return await this.getTextInDisplayedElements(selector);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_txt_layout');
            throw new Error('Error when getting text in the layout component! screenshot ' + screenshot + ' ' + err);
        }
    }

    async getTextInEditableLayoutComponent() {
        try {
            let selector = xpath.layoutComponentView + xpath.editableTextComponentView + '/p';
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            return await this.getTextInDisplayedElements(selector);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_txt_layout');
            throw new Error('Error when getting text in the layout component! screenshot' + screenshot + ' ' + err);
        }
    }

    async waitForTextComponentNotDisplayed(text) {
        try {
            let selector = xpath.textComponentByText(text);
            return await this.waitForElementNotDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_txt_comp_displayed');
            throw new Error('Text component should not visible in Live Editor! screenshot:' + screenshot + '  ' + err);
        }
    }

    async waitForTextComponentDisplayed(text) {
        try {
            let selector = xpath.textComponentByText(text);
            return await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_txt_component');
            throw new Error('Text component should be visible in Live Editor! screenshot:' + screenshot + '  ' + err);
        }
    }

    async waitForEditableTextComponentDisplayed(text) {
        try {
            let selector = xpath.editableTextComponentByText(text);
            return await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_txt_comp_edit');
            throw new Error('Text component should be visible in Live Editor! screenshot ' + screenshot + '  ' + err);
        }
    }

    async doRightClickOnTextComponent(text, liveFrameX, liveFrameY) {
        try {
            if (isNaN(liveFrameX) || isNaN(liveFrameY)) {
                throw new Error("Error when clicking on Image Component  in Live Frame!")
            }
            let selector = xpath.textComponentByText(text);
            if (this.getBrowser().capabilities.browserName === 'chrome') {
                await this.doRightClickWithOffset(selector, liveFrameX + 35, liveFrameY + 5);
            } else {
                await this.doRightClickWithOffset(selector, liveFrameX + 15, liveFrameY - 15);
            }
            return await this.pause(700);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_live_frame_right_click');
            throw new Error('Error when showing context menu for text component, screenshot ' + screenshot + ' ' + err);
        }
    }

    async doClickOnTextComponent(text) {
        try {
            let selector = xpath.textComponentByText(text);
            await this.clickOnElement(selector);
            return await this.pause(1000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_live_frame_click_component');
            throw new Error('Error after clicking on the component in Live Edit, screenshot' + screenshot + ' ' + err);
        }
    }

    async waitForItemViewContextMenu() {
        try {
            let selector = xpath.itemViewContextMenu;
            return await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_live_frame_item_view_context_menu');
            throw new Error('Image component should not visible in Live Editor! screenshot: ' + screenshot + ' ' + err);
        }
    }

    async getItemViewContextMenuItems() {
        let selector = "//dt[contains(@id,'TreeMenuItem')]";
        await this.waitForItemViewContextMenu();
        return await this.getTextInElements(selector);
    }

    async clickOnOptionInFragmentDropdown(option) {
        let optionSelector = lib.slickRowByDisplayName(xpath.fragmentPlaceHolderDiv + lib.DIV.FRAGMENT_DROPDOWN_DIV, option);
        await this.waitForElementDisplayed(optionSelector, appConst.mediumTimeout);
        await this.clickOnElement(optionSelector);
        await this.waitForSpinnerNotVisible();
        return await this.pause(2000);
    }

    async selectFragmentByDisplayName(displayName) {
        try {
            let contentWizard = new ContentWizard();
            let locatorFilterInput = xpath.fragmentPlaceHolderDiv + lib.DIV.FRAGMENT_DROPDOWN_DIV + lib.DROPDOWN_OPTION_FILTER_INPUT
            await contentWizard.switchToLiveEditFrame();
            await this.waitForElementDisplayed(locatorFilterInput, appConst.mediumTimeout);
            await this.typeTextInInput(locatorFilterInput, displayName);
            await this.clickOnOptionInFragmentDropdown(displayName);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_fragment_selector');
            throw new Error('Error after selecting the fragment in Live Edit -screenshot ' + screenshot + ' ' + err);
        }
    }

    async waitForCaptionDisplayed(text) {
        let locator = xpath.captionByText(text);
        return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }

    async getFragmentsNumber() {
        let contentWizard = new ContentWizard();
        let locator = xpath.fragmentComponentView;
        await contentWizard.switchToLiveEditFrame();
        let result = await this.getDisplayedElements(locator);
        await contentWizard.switchToMainFrame();
        return result.length;
    }

    async getTextInFragmentComponent() {
        let contentWizard = new ContentWizard();
        let locator = xpath.fragmentComponentView + '//p';
        await contentWizard.switchToLiveEditFrame();
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        let result = await this.getText(locator);
        await contentWizard.switchToMainFrame();
        return result;
    }

    async getLayoutColumnNumber() {
        let contentWizard = new ContentWizard();
        await contentWizard.switchToLiveEditFrame();
        let columns = await this.getDisplayedElements(xpath.layoutComponentView + "//div[contains(@id,'RegionView')]");
        await contentWizard.switchToMainFrame();
        return columns.length;
    }

    getErrorMessage() {
        let locator = xpath.container + xpath.previewNotAvailableSpan;
        return this.getText(locator);
    }

    async waitForLayoutComponentNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(xpath.layoutComponentView, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_live_edit_layout');
            throw new Error("Live Editor - layout component should not be present, screenshot: " + screenshot + ' ' + err);
        }
    }
}

module.exports = LiveFormPanel;
