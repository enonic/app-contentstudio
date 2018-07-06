/**
 * Created on 03.05.2018.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const contentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const htmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const contentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const insertImageDialog = require('../../page_objects/wizardpanel/insert.image.dialog.cke');
const insertAnchorDialog = require('../../page_objects/wizardpanel/insert.anchor.dialog.cke');
const insertSpecialDialog = require('../../page_objects/wizardpanel/insert.special.character.dialog.cke');
const insertMacroDialog = require('../../page_objects/wizardpanel/insert.macro.dialog.cke');
const insertLinkDialog = require('../../page_objects/wizardpanel/insert.link.modal.dialog.cke');

describe('htmlarea.cke.toolbar.spec:  toolbar in html area with CKE`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let EXPECTED_URL = '<p><a href="http://google.com">test</a></p>';

    it(`WHEN site with content types has been added THEN the site should be listed in the grid`,
        () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            return studioUtils.doAddSite(SITE).then(() => {
            }).then(() => {
                return studioUtils.findAndSelectItem(SITE.displayName);
            }).then(() => {
                return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            }).then(isDisplayed => {
                assert.isTrue(isDisplayed, 'site should be listed in the grid');
            });
        });

    it(`GIVEN 'htmlArea' content is opened WHEN 'insert image' icon has been clicked THEN 'Insert Image Dialog' should appear`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, ':htmlarea0_1').then(() => {
                return htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            }).then(() => {
                return insertImageDialog.waitForDialogVisible();
            }).then(result => {
                studioUtils.saveScreenshot('cke_insert_image_dialog');
                assert.isTrue(result, 'Insert Image Dialog should appear');
            });
        });
    it(`GIVEN 'htmlArea' content is opened WHEN 'insert anchor' icon has been clicked THEN 'Insert Anchor Dialog' should appear`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, ':htmlarea0_1').then(() => {
                return htmlAreaForm.showToolbarAndClickOnInsertAnchorButton();
            }).then(() => {
                return insertAnchorDialog.waitForDialogLoaded();
            }).then(result => {
                studioUtils.saveScreenshot('cke_insert_anchor_dialog');
                assert.isTrue(result, 'Insert Anchor Dialog should appear');
            });
        });

    it(`GIVEN 'htmlArea' content is opened WHEN 'insert special characters' icon has been clicked THEN 'Insert Special Characters Dialog' should appear`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, ':htmlarea0_1').then(() => {
                return htmlAreaForm.showToolbarAndClickOnInsertSpecialCharactersButton();
            }).then(() => {
                return insertSpecialDialog.waitForDialogLoaded();
            }).then(result => {
                studioUtils.saveScreenshot('cke_insert_special_char_dialog');
                assert.isTrue(result, 'Insert Special Characters Dialog should appear');
            });
        });

    it(`GIVEN 'htmlArea' content is opened WHEN 'insert macro' icon has been clicked THEN 'Insert Macro Dialog' should appear`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, ':htmlarea0_1').then(() => {
                return htmlAreaForm.showToolbarAndClickOnInsertMacroButton();
            }).then(() => {
                return insertMacroDialog.waitForDialogVisible();
            }).then(result => {
                studioUtils.saveScreenshot('cke_insert_macro_dialog');
                assert.isTrue(result, 'Insert Macro Dialog should appear');
            }).then(() => {
                return insertMacroDialog.clickOnCancelButton();
            }).then(() => {
                return assert.eventually.isTrue(insertMacroDialog.waitForDialogClosed(),
                    "Insert Macro should be closed, when Cancel button has been pressed");
            })
        });

    it(`GIVEN 'htmlArea' content is opened WHEN 'insert link' icon has been clicked THEN 'Insert Link Dialog' should appear`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, ':htmlarea0_1').then(() => {
                return htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            }).then(() => {
                return insertLinkDialog.waitForDialogLoaded();
            }).then(result => {
                studioUtils.saveScreenshot('cke_insert_link_dialog');
                assert.isTrue(result, 'Insert Link Dialog should appear');
            });
        });
    it(`WHEN 'htmlArea' content is opened THEN bold, italic, Underline,  buttons should be present on the toolbar`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, ':htmlarea0_1').then(() => {
                return htmlAreaForm.showToolbar();
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isBoldButtonDisplayed(), 'Bold button should be present');
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isItalicButtonDisplayed(), 'Italic button should be present');
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isUnderlineButtonDisplayed(), 'Underline button should be present');
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isBulletedListButtonDisplayed(), 'Bulleted List button should be present');
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isAlignLeftButtonDisplayed(), 'Align Left button should be present');
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isNumberedListButtonDisplayed(), 'Bulleted List button should be present');
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isAlignRightButtonDisplayed(), 'Align Right button should be present');
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isCenterButtonDisplayed(), 'Center button should be present');
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isIncreaseIndentButtonDisplayed(), 'Increase Indent button should be present');
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isTableButtonDisplayed(), 'Table button should be present');
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isIncreaseIndentButtonDisplayed(), 'Increase Indent button should be present');
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isDecreaseIndentDisplayed(), 'Decrease Indent button should be present');
            });
        });

    it(`GIVEN wizard for 'htmlArea 0:1' is opened AND 'Insert Link' button has been pressed WHEN 'url-link' has been inserted, THEN correct data should be in CKE`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, ':htmlarea0_1').pause(1000).then(() => {
                return htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            }).then(() => {
                return insertLinkDialog.typeText('test');
            }).then(() => {
                return insertLinkDialog.typeUrl('http://google.com');
            }).then(() => {
                return insertLinkDialog.clickOnInsertButton();
            }).pause(500).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                return htmlAreaForm.getTextFromHtmlArea();
            }).then(result => {
                studioUtils.saveScreenshot('htmlarea_0_1_url_link');
                assert.equal(result[0], EXPECTED_URL, 'correct data should be in CKE');
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
