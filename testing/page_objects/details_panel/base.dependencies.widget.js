/**
 * Created on 04/07/2018.
 */
const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');


const baseDependenciesWidget = Object.create(page, {

    clickOnShowOutboundButton: {
        value: function () {
            return this.doClick(this.showOutboundButton);
        }
    },
    clickOnShowInboundButton: {
        value: function () {
            return this.doClick(this.showInboundButton);
        }
    },
});
module.exports = baseDependenciesWidget;


