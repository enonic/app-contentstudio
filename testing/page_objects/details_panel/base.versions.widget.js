/**
 * Created on 04/07/2018.
 */
const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');


const baseVersionsWidget = Object.create(page, {

    //click on a version and expand the content-version-item
    clickAndExpandVersion: {
        value: function (index) {
            return this.elements(this.versionItems).then(items => {
                return this.getBrowser().elementIdClick(result[index].ELEMENT);
            });
        }
    },
});
module.exports = baseVersionsWidget;


