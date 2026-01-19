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
    textComponentType: "//*[@data-portal-component-type='text']",
    previewNotAvailableSpan: "//p[@class='no-preview-message']/span[1]",
    imageInComponent: "//figure/img",
    closeEditModeButton: "//button[contains(@class,'close-edit-mode-button icon-close')]",
    noSelectionDiv: "//div[contains(@class,'no-selection-message')]",
    pageSettingsLink: "//button[contains(@class,'page-settings-link')]",
    editableTextComponentByText: text => `//section[contains(@id,'TextComponentView') and @contenteditable='true']//p[contains(.,'${text}')]`,
    textComponentByText: text => `//section[contains(@id,'TextComponentView')]//p[contains(.,'${text}')]`,
    partComponentByName: name => `//div[contains(@id,'PartComponentView') and @data-portal-component-type='part']//h2[contains(text(),'${name}')]`,
    captionByText: text => `//section[contains(@id,'TextComponentView') ]//figcaption[contains(.,'${text}')]`
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
            await this.handleError(`Layout combobox, options filter input should be displayed in Live Edit`, 'err_layout_combobox', err);
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
            await this.handleError(`Error during selecting the layout in Live Edit`, 'err_select_layout', err);
        }
    }

    async selectPartByDisplayName(displayName) {
        try {
            let parentForComboBox = `//div[contains(@id,'PartPlaceholder')]`;
            let contentWizard = new ContentWizard();
            let componentDescriptorsDropdown = new ComponentDescriptorsDropdown();
            await contentWizard.switchToLiveEditFrame();
            await componentDescriptorsDropdown.selectFilteredComponent(displayName, parentForComboBox);
            return await this.pause(1000);
        } catch (err) {
            await this.handleError('Error during selecting the part in Live Edit', 'err_select_part', err);
        }
    }

    async getTextInPart() {
        try {
            let selector = "//div[contains(@id,'PartComponentView')]/p";
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            return await this.getText(selector);
        } catch (err) {
            await this.handleError('Try to get text from the part component!', 'err_part_component', err);
        }
    }

    // gets text from all components - data-portal-component-type=text
    async getTextFromTextComponents() {
        try {
            let selector = xpath.textComponentType + '/p';
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            return await this.getTextInDisplayedElements(selector);
        } catch (err) {
            await this.handleError('Try to get text from the text component!', 'err_txt_component', err);
        }
    }

    // get text from 'section' element:
    async getTextInTextComponent() {
        try {
            let selector = xpath.sectionTextComponentView + '/p';
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            return await this.getTextInDisplayedElements(selector);
        } catch (err) {
            await this.handleError('Tried to get text from the text component!', 'err_txt_component', err);
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
            await this.handleError('Tried to get the text in the layout component!', 'err_txt_layout', err);
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
            await this.handleError(`Error when getting text in the layout component!`, 'err_txt_layout', err)
        }
    }

    async waitForTextComponentNotDisplayed(text) {
        try {
            let selector = xpath.textComponentByText(text);
            return await this.waitForElementNotDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Text component should not be visible in Live Editor!`, 'err_txt_comp', err);
        }
    }

    async waitForTextComponentDisplayed(text) {
        try {
            let selector = xpath.textComponentByText(text);
            return await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Text component should be visible in Live Editor!`, 'err_txt_comp', err)
        }
    }

    async waitForEditableTextComponentDisplayed(text) {
        try {
            let selector = xpath.editableTextComponentByText(text);
            return await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Editable text component should be visible in Live Editor!`, 'err_txt_comp_edit', err);
        }
    }

    //Close edit-mode icon for text-component
    async waitForCloseEditModeButtonDisplayed() {
        try {
            let locator = xpath.closeEditModeButton;
            return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Close 'Edit mode' button should be displayed in Live Editor!`, 'err_close_edit_mode_btn', err);
        }
    }

    // Close edit-mode icon for text-component
    async waitForCloseEditModeButtonNotDisplayed() {
        try {
            let locator = xpath.closeEditModeButton;
            return await this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Close 'Edit mode' button should not be displayed in Live Editor!`, 'err_close_edit_mode_btn', err);
        }
    }

    // Click on lose edit-mode icon for text-component
    async clickOnCloseEditModeButton() {
        await this.waitForCloseEditModeButtonDisplayed();
        await this.clickOnElement(xpath.closeEditModeButton);
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
            await this.handleError(`Try to open the context menu for text component`, 'err_live_frame_right_click', err);
        }
    }

    async doClickOnTextComponent(text) {
        try {
            let selector = xpath.textComponentByText(text);
            await this.clickOnElement(selector);
            return await this.pause(1000);
        } catch (err) {
            await this.handleError(`Try to click on text component`, 'err_live_frame_click_text_component', err);
        }
    }

    async waitForItemViewContextMenu() {
        try {
            let selector = xpath.itemViewContextMenu;
            return await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Item View Context Menu should be displayed in Live Editor!`, 'err_liveview_view_context_menu', err);
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
            await this.handleError(`Error during selecting the fragment in Live Edit`, 'err_fragment_selector', err);
        }
    }

    async waitForCaptionDisplayed(text) {
        try {
            let locator = xpath.captionByText(text);
            return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Caption should be displayed in LiveEdit frame`, 'err_caption_live_edit', err);
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
            await this.handleError(`Live Editor - layout component should not be displayed`, 'err_live_edit_layout', err);
        }
    }

    async clickOnPartComponentByName(name) {
        let locator = xpath.partComponentByName(name);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(500);
    }

    async waitForEditingNotAvailableMessageDisplayed() {
        let locator = xpath.container + xpath.noSelectionDiv + "//span";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async waitForPageSettingsLinkNotDisplayed() {
        try {
            let locator = xpath.container + xpath.pageSettingsLink;
            return await this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Page Settings button should not be displayed in Live Edit', 'err_page_settings_link', err);
        }
    }

    async waitForPageSettingsLinkDisplayed() {
        try {
            let locator = xpath.container + xpath.pageSettingsLink;
            return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Page Settings link should be displayed in Live Edit', 'err_page_settings_link', err);
        }
    }

    async clickOnPageSettingsLink() {
        let locator = xpath.container + xpath.pageSettingsLink;
        await this.waitForPageSettingsLinkDisplayed();
        await this.clickOnElement(locator);
        await this.pause(200);
    }
}

module.exports = LiveFormPanel;
