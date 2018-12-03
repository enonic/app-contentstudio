/**
 * Created on 04/07/2018.
 */
const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');


const baseDependenciesWidget = Object.create(page, {

    clickOnShowOutboundButton: {
        value: function () {
            return this.waitForVisible(this.showOutboundButton, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot('err_outbound_button');
                throw new Error('Show Outbound button is not visible in ' + err);
            }).then(() => {
                return this.doClick(this.showOutboundButton);
            })
        }
    },
    clickOnShowInboundButton: {
        value: function () {
            return this.doClick(this.showInboundButton);
        }
    },
    getNumberOutboundItems: {
        value: function () {
            return this.waitForVisible(this.showOutboundButton).then(() => {
                return this.getText(this.showOutboundButton);
            }).then(result => {
                let startIndex = result.indexOf('(');
                let endIndex = result.indexOf(')');
                return result.substring(startIndex + 1, endIndex);
            })
        }
    },
    waitForOutboundButtonNotVisible: {
        value: function () {
            return this.waitForNotVisible(this.showOutboundButton, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot('err_outbound_button_should_be_hidden');
                throw new Error('showOutboundButton still visible in ' + appConst.TIMEOUT_2);
            });
        }
    },
    isInboundButtonVisible: {
        value: function () {
            return this.isVisible(this.showInboundButton);
        }
    },
    waitForOutboundButtonVisible: {
        value: function () {
            return this.waitForVisible(this.showOutboundButton, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot('err_outbound_button');
                throw new Error('showOutboundButton is not visible in ' + appConst.TIMEOUT_2);
            });
        }
    },
    waitForInboundButtonVisible: {
        value: function () {
            return this.waitForVisible(this.showInboundButton, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot('err_inbound_button');
                throw new Error('showInboundButton: is not visible in ' + appConst.TIMEOUT_2);
            });
        }
    },
});
module.exports = baseDependenciesWidget;


