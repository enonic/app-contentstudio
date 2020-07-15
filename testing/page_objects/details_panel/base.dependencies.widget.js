/**
 * Created on 04/07/2018.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');

class BaseDependenciesWidget extends Page {

    clickOnShowOutboundButton() {
        return this.waitForElementDisplayed(this.showOutboundButton, appConst.shortTimeout).catch(err => {
            this.saveScreenshot('err_outbound_button');
            throw new Error('Show Outbound button is not visible in ' + err);
        }).then(() => {
            return this.clickOnElement(this.showOutboundButton);
        })
    }

    clickOnShowInboundButton() {
        return this.clickOnElement(this.showInboundButton);
    }

    getNumberOutboundItems() {
        return this.waitForElementDisplayed(this.showOutboundButton, appConst.shortTimeout).then(() => {
            return this.getText(this.showOutboundButton);
        }).then(result => {
            let startIndex = result.indexOf('(');
            let endIndex = result.indexOf(')');
            return result.substring(startIndex + 1, endIndex);
        })
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


