/**
 * Created on 04/07/2018.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');

class BaseDependenciesWidget extends Page {

    async clickOnShowOutboundButton() {
        try {
            await this.waitForElementDisplayed(this.showOutboundButton, appConst.shortTimeout);
            await this.waitForElementEnabled(this.showOutboundButton, appConst.shortTimeout);
            await this.clickOnElement(this.showOutboundButton);
            return await this.pause(1000);
        } catch (err) {
            await this.saveScreenshot('err_outbound_button');
            throw new Error('Show Outbound button is not visible in ' + err);
        }
    }

    clickOnShowInboundButton() {
        return this.clickOnElement(this.showInboundButton);
    }

    waitForNoOutgoingDependenciesMessage() {
        return this.waitForElementDisplayed("//div[@class='dependencies-container outbound no-dependencies']", appConst.mediumTimeout);
    }

    waitForNoIncomingDependenciesMessage() {
        return this.waitForElementDisplayed("//div[contains(@class,'inbound no-dependencies')]", appConst.mediumTimeout);
    }

    getContentDisplayName() {
        let locator = this.dependenciesWidget + "//div[contains(@id,'NamesView')]//h6[contains(@class,'main-name')]";
        return this.getText(locator);
    }

    getContentName() {
        let locator = this.dependenciesWidget + "//p[contains(@class,'sub-name')]";
        return this.getText(locator);
    }

    async getNumberOutboundItems() {
        await this.waitForElementDisplayed(this.showOutboundButton, appConst.shortTimeout);
        let text = await this.getText(this.showOutboundButton);
        let startIndex = text.indexOf('(');
        let endIndex = text.indexOf(')');
        return text.substring(startIndex + 1, endIndex);
    }

    waitForOutboundButtonNotVisible() {
        return this.waitForElementNotDisplayed(this.showOutboundButton, appConst.shortTimeout).catch(err => {
            this.saveScreenshot('err_outbound_button_should_be_hidden');
            throw new Error('showOutboundButton still visible in ' + err);
        });
    }

    isInboundButtonVisible() {
        return this.isElementDisplayed(this.showInboundButton);
    }

    waitForOutboundButtonVisible() {
        return this.waitForElementDisplayed(this.showOutboundButton, appConst.shortTimeout).catch(err => {
            this.saveScreenshot('err_outbound_button');
            throw new Error('showOutboundButton is not visible in ' + err);
        });
    }

    waitForInboundButtonVisible() {
        return this.waitForElementDisplayed(this.showInboundButton, appConst.shortTimeout).catch(err => {
            this.saveScreenshot('err_inbound_button');
            throw new Error('showInboundButton: is not visible in ' + err);
        });
    }
}

module.exports = BaseDependenciesWidget;


