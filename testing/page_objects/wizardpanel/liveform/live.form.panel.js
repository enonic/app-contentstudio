/**
 * Created on 15.02.2018.  updated on 19.08.2026
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const { COMMON } = require('../../../libs/elements');
const ContentWizard = require('../content.wizard.panel');

const xpath = {
    container: "//div[contains(@id,'LiveFormPanel')]",
    fragmentComponentView: "//*[@data-portal-component-type='fragment']",
    layoutComponentView: "//*[@data-portal-component-type='layout']",
    layoutPlaceholderDiv: `//div[@data-portal-component-type='layout']`,
    fragmentPlaceHolderDiv: `//div[contains(@id,'FragmentPlaceholder')]`,
    sectionTextComponentView: "//*[@data-portal-component-type='text']",
    textComponentView: "//*[@data-portal-component-type='text']",
    textComponentType: "//*[@data-portal-component-type='text']",
    previewNotAvailableSpan: "//p[@class='no-preview-message']/span[1]",
    imageInComponent: '//figure/img',
    noSelectionDiv: "//div[contains(@class,'no-selection-message')]",
    editableTextComponentByText: (text) =>
        `//*[@data-portal-component-type='text' and @contenteditable='true']//p[contains(.,'${text}')]`,
    textComponentByText: (text) => `//*[@data-portal-component-type='text']//p[contains(.,'${text}')]`,
    // The text component itself - the text can be wrapped in any element ('p', 'pre', 'figcaption' etc.)
    textComponentContainingText: (text) => `//*[@data-portal-component-type='text'][contains(.,'${text}')]`,
    partComponentByName: (name) => `//*[@data-portal-component-type='part']//h2[contains(text(),'${name}')]`,
    captionByText: (text) => `//*[@data-portal-component-type='text']//figcaption[contains(.,'${text}')]`,
};

class LiveFormPanel extends Page {
    waitForOpened() {
        return this.waitForElementDisplayed(xpath.container, appConst.shortTimeout);
    }

    waitForHidden() {
        return this.waitForElementNotDisplayed(xpath.container, appConst.shortTimeout);
    }

    async getTextInPart() {
        try {
            let selector = "//*[@data-portal-component-type='part']//p";
            await this.waitForElementDisplayed(selector);
            return await this.getText(selector);
        } catch (err) {
            await this.handleError('Try to get text from the part component!', 'err_part_component', err);
        }
    }

    // gets text from all components - data-portal-component-type=text
    async getTextFromTextComponents() {
        try {
            let selector = xpath.textComponentType + '/p';
            await this.waitForElementDisplayed(selector);
            return await this.getTextInDisplayedElements(selector);
        } catch (err) {
            await this.handleError('Try to get text from the text component!', 'err_txt_component', err);
        }
    }

    // get text from 'section' element:
    async getTextInTextComponent() {
        try {
            let selector = xpath.textComponentView + '/p';
            await this.waitForElementDisplayed(selector);
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
        await this.getBrowser().waitUntil(
            async () => {
                let elements = await this.findElements(locator);
                let text = await elements[index].getAttribute('class');
                return text.includes('empty');
            },
            { timeout: appConst.shortTimeout, timeoutMsg: 'Text component should be empty' },
        );
    }

    // Gets a text from a text-component in LiveEdit frame
    async getTextInLayoutComponent() {
        try {
            let selector = xpath.layoutComponentView + xpath.textComponentView + '/p';
            await this.waitForElementDisplayed(selector);
            return await this.getTextInDisplayedElements(selector);
        } catch (err) {
            await this.handleError(`Error when getting text in the layout component!`, 'err_txt_layout', err);
        }
    }

    async waitForTextComponentNotDisplayed(text) {
        try {
            let selector = xpath.textComponentByText(text);
            return await this.waitForElementNotDisplayed(selector);
        } catch (err) {
            await this.handleError(`Text component should not be visible in Live Editor!`, 'err_txt_comp', err);
        }
    }

    async waitForTextComponentDisplayed(text) {
        try {
            let selector = xpath.textComponentByText(text);
            return await this.waitForElementDisplayed(selector);
        } catch (err) {
            await this.handleError(`Text component should be visible in Live Editor!`, 'err_txt_comp', err);
        }
    }

    // Opens the context menu for the text component with the given text.
    // Switch to the Live Edit frame before calling this method.
    async doRightClickOnTextComponent(text) {
        try {
            let selector = xpath.textComponentContainingText(text);
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            let element = await this.findElement(selector);
            await element.click({ button: 2 });
            await this.waitForItemViewContextMenu();
            return await this.pause(300);
        } catch (err) {
            await this.handleError(
                `Try to open the context menu for text component`,
                'err_live_frame_right_click',
                err,
            );
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

    // The page-editor overlay (context menus, highlighters) is rendered inside the shadow root of
    // '#pe-overlay-host' in the Live Edit frame, so its content is not reachable by xpath.
    async getPageEditorOverlayShadowHost() {
        let host = await this.findElement(COMMON.SHADOW_SELECTORS.PAGE_EDITOR_OVERLAY_HOST);
        await host.waitForExist({ timeout: appConst.mediumTimeout });
        return host;
    }

    async waitForItemViewContextMenu() {
        try {
            let host = await this.getPageEditorOverlayShadowHost();
            let menu = await host.shadow$(COMMON.SHADOW_SELECTORS.PAGE_EDITOR_CONTEXT_MENU);
            return await menu.waitForDisplayed({ timeout: appConst.mediumTimeout });
        } catch (err) {
            await this.handleError(
                `Item View Context Menu should be displayed in Live Editor!`,
                'err_liveview_view_context_menu',
                err,
            );
        }
    }

    async waitForItemViewContextMenuNotDisplayed() {
        try {
            let host = await this.getPageEditorOverlayShadowHost();
            let menu = await host.shadow$(COMMON.SHADOW_SELECTORS.PAGE_EDITOR_CONTEXT_MENU);
            return await menu.waitForDisplayed({ timeout: appConst.mediumTimeout, reverse: true });
        } catch (err) {
            await this.handleError(
                `Item View Context Menu should not be displayed in Live Editor!`,
                'err_liveview_view_context_menu',
                err,
            );
        }
    }

    // Returns the labels of the top level items in the Live Editor context menu
    async getItemViewContextMenuItems() {
        try {
            let items = await this.getItemViewContextMenuItemElements(
                COMMON.SHADOW_SELECTORS.PAGE_EDITOR_CONTEXT_MENU_ITEMS,
            );
            let labels = [];
            for (const item of items) {
                let text = await item.getText();
                labels.push(text.trim());
            }
            return labels;
        } catch (err) {
            await this.handleError(
                `Error when getting menu items in Live Editor context menu`,
                'err_liveview_view_context_menu_items',
                err,
            );
        }
    }

    // Clicks on the menu item with the given label in the Live Editor context menu.
    // Items in the opened submenu ('Insert' -> 'Text' etc.) are found as well.
    async clickOnLiveViewContextMenuItem(itemName) {
        try {
            let items = await this.getItemViewContextMenuItemElements(
                COMMON.SHADOW_SELECTORS.PAGE_EDITOR_CONTEXT_MENU_ANY_ITEM,
            );
            for (const item of items) {
                let text = await item.getText();
                if (text.trim() === itemName) {
                    await item.click();
                    return await this.pause(700);
                }
            }
            throw new Error(`Menu item '${itemName}' was not found in the context menu`);
        } catch (err) {
            await this.handleError(
                `Error when clicking on '${itemName}' in Live Editor context menu`,
                'err_liveview_view_context_menu_item',
                err,
            );
        }
    }

    async getItemViewContextMenuItemElements(itemsSelector) {
        await this.waitForItemViewContextMenu();
        let host = await this.getPageEditorOverlayShadowHost();
        await this.getBrowser().waitUntil(
            async () => {
                let items = await host.shadow$$(itemsSelector);
                return items.length > 0;
            },
            {
                timeout: appConst.mediumTimeout,
                timeoutMsg: 'Live Editor - items in the context menu were not displayed',
            },
        );
        return await host.shadow$$(itemsSelector);
    }

    async waitForCaptionDisplayed(text) {
        try {
            let locator = xpath.captionByText(text);
            return await this.waitForElementDisplayed(locator);
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
        await this.waitForElementDisplayed(locator);
        let result = await this.getText(locator);
        await contentWizard.switchToMainFrame();
        return result;
    }

    async getLayoutColumnNumber() {
        let contentWizard = new ContentWizard();
        await contentWizard.switchToLiveEditFrame();
        let columns = await this.getDisplayedElements(xpath.layoutComponentView + '//*[@data-portal-region]');
        await contentWizard.switchToMainFrame();
        return columns.length;
    }

    // get text in null-layout
    async getTextFromEmptyLayout() {
        let contentWizard = new ContentWizard();
        await contentWizard.switchToLiveEditFrame();
        let text = await this.getTextInDisplayedElements(
            xpath.layoutComponentView + "//div[contains(@class,'empty-descriptor-block')]",
        );
        await contentWizard.switchToMainFrame();
        return text;
    }

    getErrorMessage() {
        let locator = xpath.container + xpath.previewNotAvailableSpan;
        return this.getText(locator);
    }

    async waitForLayoutComponentNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(xpath.layoutComponentView);
        } catch (err) {
            await this.handleError(
                `Live Editor - layout component should not be displayed`,
                'err_live_edit_layout',
                err,
            );
        }
    }

    async waitForLayoutPlaceHolderDisplayed() {
        try {
            return await this.waitForElementDisplayed(xpath.layoutPlaceholderDiv);
        } catch (err) {
            await this.handleError(
                `Live Editor - layout placeholder should be displayed`,
                'err_live_edit_layout_placeholder',
                err,
            );
        }
    }

    async clickOnPartComponentByName(name) {
        let locator = xpath.partComponentByName(name);
        await this.waitForElementDisplayed(locator);
        await this.clickOnElement(locator);
        return await this.pause(500);
    }

    async waitForEditingNotAvailableMessageDisplayed() {
        let locator = xpath.container + xpath.noSelectionDiv + '//span';
        await this.waitForElementDisplayed(locator);
        return await this.getText(locator);
    }

    async waitForPartWithErrorDisplayed() {
        let locator = "//div[@data-portal-component-type='part']/span[text()='Error']";
        return await this.waitForElementDisplayed(locator);
    }
}

module.exports = LiveFormPanel;
