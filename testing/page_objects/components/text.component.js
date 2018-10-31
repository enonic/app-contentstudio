/**
 * Created on 10.05.2018.
 */
const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const utils = require('../../libs/studio.utils');
const insertLinkDialog = require('../../page_objects/wizardpanel/insert.link.modal.dialog.cke');
const insertAnchorDialog = require('../../page_objects/wizardpanel/insert.anchor.dialog.cke');

const component = {
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
    insertAnchorButton: {
        get: function () {
            return `${component.toolbox}` + `//a[contains(@class,'cke_button') and contains(@title,'Anchor')]`;
        }
    },
    typeTextInCkeEditor: {
        value: function (text) {
            return this.switchToLiveEditFrame().then(() => {
                return this.waitForVisible(elements.RICH_TEXT_EDITOR, appConst.TIMEOUT_3);
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
            return this.waitForVisible(elements.RICH_TEXT_EDITOR, appConst.TIMEOUT_3).then(() => {
                return this.getIdOfEditor();
            }).then(id => {
                return utils.getTextInCKE(id);
            }).then(result => {
                return result.value.trim();
            });
        }
    },
    getIdOfEditor: {
        value: function () {
            return this.getAttribute(elements.RICH_TEXT_EDITOR, 'id');
        }
    },

    switchToLiveEditFrame: {
        value: function () {
            return this.getBrowser().element("//iframe[contains(@class,'live-edit-frame')]").then(result => {
                return this.frame(result.value);
            });
        }
    },
    switchToCKETableFrameAndInsertTable: {
        value: function () {
            return this.getBrowser().frameParent().then(() => {
                return this.getDisplayedElements("//iframe[contains(@class,'cke_panel_frame')]");
            }).then(result => {
                return this.frame(result.value);
            }).pause(5000).then(() => {
                return this.doClick("//div[contains(@class,'cke_panel_block')]");
            }).pause(5000).then(() => {
                return this.getBrowser().frameParent();
            })
        }
    },
    switchToParentFrame: {
        value: function () {
            return this.getBrowser().frameParent();
        }
    },
    clickOnInsertTableButton: {
        value: function () {
            return this.waitForVisible(elements.RICH_TEXT_EDITOR, appConst.TIMEOUT_3).then(result => {
                return this.doClick(this.insertTableButton);
            }).then(() => {
                console.log('Insert Table dialog');
                //TODO finish it when bug with Table will be fixed
                //return insertTableDialog.waotForVisible();
            });
        }
    },
    clickOnInsertLinkButton: {
        value: function () {
            return this.waitForVisible(elements.RICH_TEXT_EDITOR, appConst.TIMEOUT_3).catch(err => {
                this.saveScreenshot('err_text_component_open_cke');
                throw new Error('Text Component - rich editor is not focused!');
            }).then(result => {
                return this.doClick(this.insertLinkButton);
            }).then(() => {
                return this.switchToParentFrame();
            }).then(() => {
                return insertLinkDialog.waitForDialogLoaded();
            });
        }
    },
    clickOnInsertAnchorButton: {
        value: function () {
            return this.waitForVisible(elements.RICH_TEXT_EDITOR, appConst.TIMEOUT_3).then(result => {
                return this.doClick(this.insertAnchorButton);
            }).then(() => {
                return this.switchToParentFrame();
            }).then(() => {
                return insertAnchorDialog.waitForDialogLoaded();
            });
        }
    },
});
module.exports = textComponent;


