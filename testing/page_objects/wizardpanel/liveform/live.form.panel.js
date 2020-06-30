/**
 * Created on 15.02.2018.
 */
const Page = require('../../page');
const lib = require('../../../libs/elements');
const utils = require('../../../libs/studio.utils');
const appConst = require('../../../libs/app_const');
const ContentWizard = require('../content.wizard.panel');
const LoaderComboBox = require('../../../page_objects/components/loader.combobox');
const xpath = {
    container: "//div[contains(@id,'LiveFormPanel')]",
    fragmentComponentView: "//div[contains(@id,'FragmentComponentView')]",
    imageComponentView: "//figure[contains(@id,'ImageComponentView')]",
    itemViewContextMenu: "//div[contains(@id,'ItemViewContextMenu')]",
    imageComponentByDisplayName:
        displayName => `//figure[contains(@id,'ImageComponentView')]//img[contains(@src,'${displayName}')]`,
};

class LiveFormPanel extends Page {

    waitForOpened() {
        return this.waitForElementDisplayed(xpath.container, appConst.shortTimeout);
    }

    // selects an image by displayName(in an image-component)
    async selectImageByDisplayName(displayName) {
        try {
            let parentForComboBox = `//div[contains(@id,'ImagePlaceholder')]`;
            let contentWizard = new ContentWizard();
            let loaderComboBox = new LoaderComboBox();
            await contentWizard.switchToLiveEditFrame();
            await loaderComboBox.typeTextAndSelectOption(displayName, parentForComboBox);
            return await this.pause(1000);
        } catch (err) {
            this.saveScreenshot('err_select_image_' + displayName);
            throw new Error(`Error when selecting the image:  ${displayName} in Live Edit - ` + err);
        }
    }

    async selectLayoutByDisplayName(displayName) {
        try {
            let parentForComboBox = `//div[contains(@id,'LayoutPlaceholder')]`;
            let contentWizard = new ContentWizard();
            let loaderComboBox = new LoaderComboBox();
            await contentWizard.switchToLiveEditFrame();
            await loaderComboBox.typeTextAndSelectOption(displayName, parentForComboBox);
            return await this.pause(1000);
        } catch (err) {
            this.saveScreenshot('err_select_layout_' + displayName);
            throw new Error(`Error when selecting the layout:  ${displayName} in Live Edit - ` + err);
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
            this.saveScreenshot('err_select_part_' + displayName);
            throw new Error("Error when selecting the part in Live Edit - " + err);
        }
    }

    async getTextInPart() {
        try {
            let selector = "//div[contains(@id,'PartComponentView')]/p";
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            return await this.getText(selector);
        } catch (err) {
            throw new Error("Error when getting text in the part component! " + err);
        }
    }

    async waitForImageDisplayed(imageName) {
        try {
            let selector = xpath.imageComponentByDisplayName(imageName);
            return await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            this.saveScreenshot("err_live_frame_image_component1");
            throw new Error("Image component is not visible in Live Editor! " + err);
        }
    }

    async waitForImageNotDisplayed(imageName) {
        try {
            let selector = xpath.imageComponentByDisplayName(imageName);
            return await this.waitForElementNotDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            this.saveScreenshot("err_live_frame_image_component2");
            throw new Error("Image component should not visible in Live Editor! " + err);
        }
    }

    async doRightClickOnImageComponent(imageName, liveFrameX, liveFrameY) {
        try {
            if(isNaN(liveFrameX) || isNaN(liveFrameY)) {
                throw new Error("Error when clicking on Image Component  in Live Frame!")
            }
            let selector = xpath.imageComponentByDisplayName(imageName);
            await this.doRightClickWithOffset(selector, liveFrameX + 35, liveFrameY + 35);
            return await this.pause(200);
        } catch (err) {
            this.saveScreenshot("err_live_frame_right_click");
            throw new Error("Error when showing context menu in Live Editor! " + err);
        }
    }

    async waitForItemViewContextMenu() {
        try {
            let selector = xpath.itemViewContextMenu;
            return await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            this.saveScreenshot("err_live_frame_item_view_context_menu");
            throw new Error("Image component should not visible in Live Editor! " + err);
        }
    }

    async getItemViewContextMenuItems() {
        let selector = "//dt[contains(@id,'TreeMenuItem')]";
        await this.waitForItemViewContextMenu();
        return await this.getTextInElements(selector);
    }
};
module.exports = LiveFormPanel;
