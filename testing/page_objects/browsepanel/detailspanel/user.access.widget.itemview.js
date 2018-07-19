/**
 * Created on 06/07/2018.
 */
const page = require('../../page');
const elements = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'DetailsView')]//div[contains(@id,'UserAccessWidgetItemView')]`,
    editPermissionsLink: `//a[@class='edit-permissions-link']`
}
var userAccessWidgetItemView = Object.create(page, {

    editPermissionsLink: {
        get: function () {
            return `${xpath.container}` + `${xpath.editPermissionsLink}`;
        }
    },
    clickOnEditPermissionsLink: {
        value: function () {
            return this.doClick(this.editPermissionsLink, appConst.TIMEOUT_2).pause(500).catch(err => {
                throw new Error('Error when clicking on `Edit Permissions link` ! ' + err);
            });
        }
    },
    waitForLoaded: {
        value: function () {
            return this.waitForNotVisible(this.editPermissionsLink, appConst.TIMEOUT_2).catch(err => {
                throw new Error('Access widget was not loaded! ' + err);
            });
        }
    },
});
module.exports = userAccessWidgetItemView;


