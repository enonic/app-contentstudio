/**
 * Created on 09/09/2020.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const LayersContentTreeDialog = require('../project/layers.content.tree.dialog');

const xpath = {
    showAllButton: "//button[contains(@id,'ShowAllContentLayersButton')]",
    layerViewByName:
        layerName => `//div[contains(@id,'LayerContentViewHeader') and descendant::span[@class='layer-name' and text()='${layerName}']]`
};

class BaseLayersWidget extends Page {

    get widgetItemView() {
        return this.layersWidget + lib.COMPARE_WITH_CURRENT_VERSION;
    }

    get showAllButton() {
        return this.layersWidget + xpath.showAllButton;
    }

    isWidgetVisible() {
        return this.isElementDisplayed(this.layersWidget);
    }

    waitForWidgetLoaded() {
        return this.waitForElementDisplayed(this.layersWidget, appConst.shortTimeout).catch(err => {
            throw new Error('Browse Panel: Layers Widget is not loaded in ' + appConst.shortTimeout);
        });
    }

    async getLayersName() {
        let locator = this.widgetItemView +
                      "//div[contains(@id,'LayerContentViewHeader')]/div[contains(@class,'layer-details')]/span[@class='layer-name']";
        await this.waitForElementDisplayed(locator);
        return await this.getTextInElements(locator);
    }

    getLayerLanguage(layerName) {
        let locator = this.widgetItemView + xpath.layerViewByName(layerName) + "//span[@class='layer-language']";
        return this.getText(locator);
    }

    async waitForLocalizeButtonEnabled(layerName) {
        let locator = this.widgetItemView + xpath.layerViewByName(layerName) +
                      "/following-sibling::div[contains(@id,'LayerContentViewFooter')]/button[child::span[text()='Localize']]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.waitForElementEnabled(locator, appConst.mediumTimeout);
    }

    async waitForOpenButtonEnabled(layerName) {
        let locator = this.widgetItemView + xpath.layerViewByName(layerName) +
                      "/following-sibling::div[contains(@id,'LayerContentViewFooter')]/button[child::span[text()='Open']]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.waitForElementEnabled(locator, appConst.mediumTimeout);
    }

    async waitForEditButtonEnabled(layerName) {
        try {
            let locator = this.widgetItemView + xpath.layerViewByName(layerName) +
                          "/following-sibling::div[contains(@id,'LayerContentViewFooter')]/button[child::span[text()='Edit']]";
            await this.waitForElementDisplayed(this.widgetItemView + xpath.layerViewByName(layerName), appConst.mediumTimeout);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.waitForElementEnabled(locator, appConst.mediumTimeout);
        } catch (err) {
            throw new Error("Error getting button in the layer view item: " + err);
        }
    }

    async clickOnLocalizeButton(layerName) {
        let locator = this.widgetItemView + xpath.layerViewByName(layerName) +
                      "/following-sibling::div[contains(@id,'LayerContentViewFooter')]/button/span[text()='Localize']";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.clickOnElement(locator);
    }

    async clickOnShowAllButton(layerName) {
        let layersContentTreeDialog = new LayersContentTreeDialog();
        this.waitForElementDisplayed(this.showAllButton, appConst.mediumTimeout);
        await this.clickOnElement(this.showAllButton);
        await layersContentTreeDialog.waitForDialogLoaded();
        return layersContentTreeDialog;
    }
}

module.exports = BaseLayersWidget;
