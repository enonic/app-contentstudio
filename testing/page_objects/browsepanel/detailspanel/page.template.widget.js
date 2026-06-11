/**
 * Created on 10.02.2022 updated on 11.06.2026
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'ExtensionView')]//*[@data-component='DetailsWidgetTemplateSection']`,
    // Bold primary line of the ItemLabel - holds the controller type ('Custom' / 'Automatic'):
    typeLocator: `//*[@data-component='ItemLabel']//span[contains(@class,'font-semibold')]`,
    // Secondary line - descriptor display name (controller name):
    nameLocator: `//*[@data-component='ItemLabel']//small//span`,
    // Secondary line - link to the page template:
    linkLocator: `//*[@data-component='ItemLabel']//small//a`,
};

class PageTemplateWidget extends Page {

    get controllerTypeLocator() {
        return xpath.container + xpath.typeLocator;
    }

    get controllerNameLocator() {
        return xpath.container + xpath.nameLocator;
    }

    get controllerLinkLocator() {
        return xpath.container + xpath.linkLocator;
    }

    async waitForWidgetLoaded() {
        try {
            return await this.waitForElementDisplayed(xpath.container, appConst.shortTimeout);
        } catch (err) {
           await this.handleError('Page Template Widget, error on waiting for widget loaded: ', 'err_wait_for_template_widget_loaded', err);
        }
    }
    async waitForNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(xpath.container);
        } catch (err) {
            await this.handleError('Page Template Widget, error on waiting for widget loaded: ', 'err_template_widget', err);
        }
    }

    // Returns the controller type shown in the bold primary line ('Custom' / 'Automatic'):
    async getControllerType() {
        await this.waitForElementDisplayed(this.controllerTypeLocator, appConst.mediumTimeout);
        return await this.getText(this.controllerTypeLocator);
    }

    // Returns the controller's display name shown in the secondary line:
    async getControllerName() {
        await this.waitForElementDisplayed(this.controllerNameLocator, appConst.mediumTimeout);
        return await this.getText(this.controllerNameLocator);
    }

    async getControllerLink() {
        await this.waitForElementDisplayed(this.controllerLinkLocator, appConst.mediumTimeout);
        return await this.getText(this.controllerLinkLocator);
    }
}

module.exports = PageTemplateWidget;
