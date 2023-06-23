/**
 * Created on 15.02.2018.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const ContentWizard = require('../content.wizard.panel');
const LoaderComboBox = require('../../../page_objects/components/loader.combobox');
const xpath = {
    container: "//div[contains(@id,'LiveFormPanel')]",
    fragmentComponentView: "//div[contains(@id,'FragmentComponentView')]",
    itemViewContextMenu: "//div[contains(@id,'ItemViewContextMenu')]",
    layoutComponentView: "//div[contains(@id,'LayoutComponentView')]",
    sectionTextComponentView: "//section[contains(@id,'TextComponentView')]",
    editableTextComponentView: "//*[contains(@id,'TextComponentView') and @contenteditable='true']",
    previewNotAvailableSpan: "//p[@class='no-preview-message']/span[1]",
    imageInTextComponentByDisplayName:
        displayName => `//figure[contains(@data-widget,'image')]//img[contains(@src,'${displayName}')]`,
    editableTextComponentByText: text => `//section[contains(@id,'TextComponentView') and @contenteditable='true']//p[contains(.,'${text}')]`,
    textComponentByText: text => `//section[contains(@id,'TextComponentView')]//p[contains(.,'${text}')]`,
    captionByText: text => `//section[contains(@id,'TextComponentView') and @contenteditable='true']//figcaption[contains(.,'${text}')]`
};

class LiveFormPanel extends Page {

    waitForOpened() {
        return this.waitForElementDisplayed(xpath.container, appConst.shortTimeout);
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
            let screenshot = appConst.generateRandomName('err_select_layout');
            await this.saveScreenshot(screenshot);
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
            let screenshot = appConst.generateRandomName('err_select_layout');
            await this.saveScreenshot(screenshot);
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
            let screenshot = appConst.generateRandomName('err_txt_component');
            await this.saveScreenshot(screenshot);
            throw new Error('Error, Live Edit frame, text component, screenshot ' + screenshot + ' ' + err);
        }
    }

    async getTextInLayoutComponent() {
        try {
            let selector = xpath.layoutComponentView + xpath.sectionTextComponentView + '/p';
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            return await this.getTextInDisplayedElements(selector);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_txt_layout');
            await this.saveScreenshot(screenshot);
            throw new Error('Error when getting text in the layout component! screenshot ' + screenshot + ' ' + err);
        }
    }

    async getTextInEditableLayoutComponent() {
        try {
            let selector = xpath.layoutComponentView + xpath.editableTextComponentView + '/p';
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            return await this.getTextInDisplayedElements(selector);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_txt_layout');
            await this.saveScreenshot(screenshot);
            throw new Error('Error when getting text in the layout component! screenshot' + screenshot + ' ' + err);
        }
    }

    async waitForTextComponentNotDisplayed(text) {
        try {
            let selector = xpath.textComponentByText(text);
            return await this.waitForElementNotDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_txt_comp_displayed');
            await this.saveScreenshot(screenshot);
            throw new Error('Text component should not visible in Live Editor! screenshot:' + screenshot + '  ' + err);
        }
    }

    async waitForEditableTextComponentDisplayed(text) {
        try {
            let selector = xpath.editableTextComponentByText(text);
            return await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_txt_comp_edit');
            await this.saveScreenshot(screenshot);
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
                await this.doRightClickWithOffset(selector, liveFrameX + 35, liveFrameY);
            } else {
                await this.doRightClickWithOffset(selector, liveFrameX + 15, liveFrameY - 15);
            }

            return await this.pause(1000);
        } catch (err) {
            await this.saveScreenshot('err_live_frame_right_click');
            throw new Error('Error when showing context menu for text component! ' + err);
        }
    }

    async waitForItemViewContextMenu() {
        try {
            let selector = xpath.itemViewContextMenu;
            return await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot('err_live_frame_item_view_context_menu');
            throw new Error('Image component should not visible in Live Editor! ' + err);
        }
    }

    async getItemViewContextMenuItems() {
        let selector = "//dt[contains(@id,'TreeMenuItem')]";
        await this.waitForItemViewContextMenu();
        return await this.getTextInElements(selector);
    }

    async selectFragmentByDisplayName(displayName) {
        try {
            let parentForComboBox = `//div[contains(@id,'FragmentPlaceholder')]`;
            let contentWizard = new ContentWizard();
            let loaderComboBox = new LoaderComboBox();
            await contentWizard.switchToLiveEditFrame();
            await loaderComboBox.typeTextAndSelectOption(displayName, parentForComboBox);
            return await this.pause(1000);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_fragment_selector');
            await this.saveScreenshot(screenshot);
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
}

module.exports = LiveFormPanel;
