/**
 * Created on 06/07/2018.
 */
const page = require('../../page');
const elements = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const editPermissionsDialog = require('../../../page_objects/edit.permissions.dialog');

const xpath = {
    container: `//div[contains(@id,'WidgetView')]//div[contains(@id,'UserAccessWidgetItemView')]`,
    editPermissionsLink: `//a[@class='edit-permissions-link']`
};
const userAccessWidgetItemView = Object.create(page, {

    editPermissionsLink: {
        get: function () {
            return `${xpath.container}` + `${xpath.editPermissionsLink}`;
        }
    },
    clickOnEditPermissionsLink: {
        value: function () {
            return this.waitForSpinnerNotVisible(appConst.TIMEOUT_2).pause(300).then(() => {
                return this.waitForVisible(this.editPermissionsLink, appConst.TIMEOUT_2);
            }).then(() => {
                return this.doClick(this.editPermissionsLink);
            }).catch(err => {
                throw new Error('Error when clicking on `Edit Permissions link`! ' + err);
            }).pause(300);
        }
    },
    clickOnEditPermissionsLinkAndWaitForDialog: {
        value: function () {
            return this.waitForSpinnerNotVisible(appConst.TIMEOUT_7).then(() => {
                return this.waitForEnabled(this.editPermissionsLink, appConst.TIMEOUT_2);
            }).then(() => {
                return this.doClick(this.editPermissionsLink);
            }).catch(err => {
                this.saveScreenshot("err_clicking_on_edit_permissions");
                throw new Error('Error when clicking on `Edit Permissions link` ! ' + err);
            }).then(() => {
                return editPermissionsDialog.waitForDialogLoaded();
            }).catch(err => {
                this.saveScreenshot("edit_perm_dlg_not_loaded");
                throw new Error("Edit permissions dialog was not loaded in " + 3000 + "ms" +" " + err);
            })
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


