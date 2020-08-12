/**
 * Created on 05/08/2020.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');

const xpath = {
    widget: "//div[contains(@id,'ContentBrowsePanel')]//div[contains(@id,'LayersWidgetItemView')]",
    widgetItemView: `//div[contains(@id,'ContentBrowsePanel')]//div[contains(@id,'LayersWidgetItemView')]`,
    layerViewByName:
        layerName => `//div[contains(@id,'LayerContentViewHeader') and descendant::span[@class='name' and text()='${layerName}']]`
};

class BrowseLayersWidget extends Page {

    get layersWidget() {
        return xpath.widget;
    }

    isWidgetVisible() {
        return this.isElementDisplayed(this.layersWidget);
    }

    waitForWidgetLoaded() {
        return this.waitForElementDisplayed(this.layersWidget, appConst.shortTimeout).catch(err => {
            throw new Error('Browse Panel: Layers Widget is not loaded in ' + appConst.shortTimeout);
        });
    }

    getLayersName() {
        let locator = xpath.widgetItemView +
                      "//div[contains(@id,'LayerContentViewHeader')]/div[contains(@class,'layer-name')]/span[@class='name']";
        return this.getTextInElements(locator);
    }

    getLayerLanguage(layerName) {
        let locator = xpath.widgetItemView + xpath.layerViewByName(layerName) + "//span[@class='language']";
        return this.getText(locator);
    }

    async waitForLocalizeButtonEnabled(layerName) {
        let locator = xpath.widgetItemView + xpath.layerViewByName(layerName) +
                      "/following-sibling::div[contains(@id,'LayerContentViewFooter')]/button[child::span[text()='Localize']]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.waitForElementEnabled(locator, appConst.mediumTimeout);
    }

    async waitForOpenButtonEnabled(layerName) {
        let locator = xpath.widgetItemView + xpath.layerViewByName(layerName) +
                      "/following-sibling::div[contains(@id,'LayerContentViewFooter')]/button[child::span[text()='Open']]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.waitForElementEnabled(locator, appConst.mediumTimeout);
    }

    async clickOnLocalizeButton(layerName) {
        let locator = xpath.widgetItemView + xpath.layerViewByName(layerName) +
                      "/following-sibling::div[contains(@id,'LayerContentViewFooter')]/button/span[text()='Localize']";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.clickOnElement(locator);
    }
}

module.exports = BrowseLayersWidget;


