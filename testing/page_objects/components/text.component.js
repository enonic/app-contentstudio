/**
 * Created on 10.05.2018.
 */
const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const utils = require('../../libs/studio.utils');
const insertLinkDialog = require('../../page_objects/wizardpanel/insert.link.modal.dialog.cke');

var component = {
    editor: `//div[contains(@id,'TextComponentViewCK_editor') and contains(@title,'Rich Text Editor')]`,
    toolbox: `//span[contains(@id,'cke_1_toolbox')]`,

};
const textComponent = Object.create(page, {
    insertTableButton: {
        get: function () {
            return `${component.toolbox}` + `//a[contains(@class,'cke_button') and @title='Table']`;
        }
    },
    insertLinkButton: {
        get: function () {
            return `${component.toolbox}` + `//a[contains(@class,'cke_button') and contains(@title,'Link')]`;
        }
    },
    typeTextInCkeEditor: {
        value: function (text) {
            return this.switchToLiveEditFrame().then(() => {
                return this.waitForVisible(component.editor, appConst.TIMEOUT_3);
            }).then(() => {
                return this.getIdOfEditor();
            }).then(id => {
                return utils.setTextInCKE(id, text);
            }).then(() => {
                return this.getBrowser().frameParent();
            }).pause(1000);
        }
    },

    getTextFromEditor: {
        value: function () {
            let strings = [];
            return this.waitForVisible(component.editor, appConst.TIMEOUT_3).then(() => {
                return this.getIdOfEditor();
            }).then(id => {
                return utils.getTextInCKE(id);
            }).then(result => {
                return result.value.trim();
            });
        }
    },
    getIdOfEditor: {
        value: function (text) {
            return this.getAttribute(component.editor, 'id');
        }
    },

    switchToLiveEditFrame: {
        value: function () {
            return this.getBrowser().element("//iframe[contains(@class,'live-edit-frame')]").then(result => {
                return this.frame(result.value);
            });
        }
    },
    switchToParentFrame: {
        value: function () {
            return this.getBrowser().frameParent();
        }
    },
    clickOnInsertTableButton: {
        value: function () {
            return this.waitForVisible(component.editor, appConst.TIMEOUT_3).then(result => {
                return this.doClick(this.insertTableButton);
            }).then(() => {
                console.log('Isert Table dialog');
                //TODO finish it when bug with Table will be fixed
                //return insertTableDialog.waotForVisible();
            });
        }
    },
    clickOnInsertLinkButton: {
        value: function () {
            return this.waitForVisible(component.editor, appConst.TIMEOUT_3).then(result => {
                return this.doClick(this.insertLinkButton);
            }).then(() => {
                return this.switchToParentFrame();
            }).then(() => {
                return insertLinkDialog.waitForDialogVisible();
            });
        }
    },


});
module.exports = textComponent;


