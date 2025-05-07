/**
 * Created on 15.02.2018.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const lib = require('../../../libs/elements');
const ContentWizard = require('../content.wizard.panel');
const FragmentDropdown = require('../../../page_objects/components/selectors/fragment.dropdown');
const ComponentDescriptorsDropdown = require('../../components/selectors/component.descriptors.dropdown');
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
        try {
            let locator = `//div[contains(@id,'LayoutPlaceholder')]` + lib.DROPDOWN_SELECTOR.OPTION_FILTER_INPUT;
            return await this.waitForElementDisplayed(locator, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_layout');
            throw new Error(`Error occurred -  layout combobox, options filter input screenshot:${screenshot} ` + err);
        }
    }

    async selectLayoutByDisplayName(displayName) {
        try {
            let parentForComboBox = `//div[contains(@id,'LayoutPlaceholder')]`;
            let contentWizard = new ContentWizard();
            let componentDescriptorsDropdown = new ComponentDescriptorsDropdown();
            await contentWizard.switchToLiveEditFrame();
            await componentDescriptorsDropdown.selectFilteredComponent(displayName, parentForComboBox);
            await contentWizard.switchToParentFrame();
            return await this.pause(1000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_select_layout');
            throw new Error(`Error after selecting the layout in Live Edit - screenshot: ` + screenshot + ' ' + err);
        }
    }

    async selectPartByDisplayName(displayName) {
        try {
            let parentForComboBox = `//div[contains(@id,'PartPlaceholder')]`;
            let contentWizard = new ContentWizard();
            let componentDescriptorsDropdown = new ComponentDescriptorsDropdown();
            await contentWizard.switchToLiveEditFrame();
            await componentDescriptorsDropdown.selectFilteredComponent(displayName, parentForComboBox);
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_select_layout');
            throw new Error('Error when selecting the part in Live Edit, screenshot: ' + screenshot + '  ' + err);
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
            throw new Error('Error, Live Edit frame, text component, screenshot: ' + screenshot + ' ' + err);
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

    // Gets a text from a text-component in LiveEdit frame
    async getTextInLayoutComponent() {
        try {
            let selector = xpath.layoutComponentView + xpath.sectionTextComponentView + '/p';
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            return await this.getTextInDisplayedElements(selector);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_txt_layout');
            throw new Error('Error when getting text in the layout component! screenshot: ' + screenshot + ' ' + err);
        }
    }

    // dropdown should not be displayed for null-layout
    async isOptionsFilterInputInLayoutComponentNotDisplayed() {
        let contentWizard = new ContentWizard();
        let locator = xpath.layoutComponentView;
        await contentWizard.switchToLiveEditFrame();
        let layoutComponentElements = await this.findElements(locator);
        let filterInputElement = await layoutComponentElements[0].$$('.' + lib.DROPDOWN_SELECTOR.OPTION_FILTER_INPUT);
        let result = await filterInputElement[0].isDisplayed();
        await contentWizard.switchToParentFrame();
        return result;
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
            throw new Error('Text component should be visible in Live Editor! screenshot: ' + screenshot + '  ' + err);
        }
    }

    async doRightClickOnTextComponent(text, liveFrameX, liveFrameY) {
        try {
            if (isNaN(liveFrameX) || isNaN(liveFrameY)) {
                throw new Error("Error when clicking on Image Component  in Live Frame!")
            }
            let selector = xpath.textComponentByText(text);
            await this.doRightClickWithOffset(selector, liveFrameX + 35, liveFrameY + 15);
            return await this.pause(700);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_live_frame_right_click');
            throw new Error('Error when showing context menu for text component, screenshot: ' + screenshot + ' ' + err);
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
        let fragmentDropdown = new FragmentDropdown();
        await fragmentDropdown.clickOnDropdownHandle(xpath.fragmentPlaceHolderDiv);
        await fragmentDropdown.selectFilteredFragment(option);
        return await this.pause(1000);
    }

    async selectFragmentByDisplayName(displayName) {
        try {
            let contentWizard = new ContentWizard();
            let fragmentDropdown = new FragmentDropdown();
            await contentWizard.switchToLiveEditFrame();
            await fragmentDropdown.selectFilteredFragment(displayName);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_fragment_selector');
            throw new Error('Error after selecting the fragment in Live Edit -screenshot ' + screenshot + ' ' + err);
        }
    }

    async waitForCaptionDisplayed(text) {
        try {
            let locator = xpath.captionByText(text);
            let aa = await this.findElements(locator);
            return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_img_caption_live_edit');
            throw new Error("Expected caption is not displayed in LiveEdit frame. screenshot:" + screenshot + ' ' + err);
        }
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

    // get text in null-layout
    async getTextFromEmptyLayout() {
        let contentWizard = new ContentWizard();
        await contentWizard.switchToLiveEditFrame();
        let text = await this.getTextInDisplayedElements(xpath.layoutComponentView + "//div[contains(@class,'empty-descriptor-block')]");
        await contentWizard.switchToMainFrame();
        return text;
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
