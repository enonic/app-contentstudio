/**
 * Created on 11.01.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const InsertLinkDialog = require('../../page_objects/wizardpanel/insert.link.modal.dialog.cke');

describe('htmlarea.insert.link.to.content.spec: insert `content-link` into htmlArea',
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();
        let SITE;

        it(`Preconditions: new site should be created`,
            async () => {
                let displayName = contentBuilder.generateRandomName('site');
                SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
                await studioUtils.doAddSite(SITE);
            });

        it(`GIVEN content link is inserted in htmlarea WHEN 'Edit link' modal dialog is opened THEN Content tab should be active and expected content should be present in selected options`,
            async () => {
                let htmlAreaForm = new HtmlAreaForm();
                await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
                await htmlAreaForm.pause(1000);
                //1. Open Insert Link dialog:
                let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
                //2. insert a content-link and close the modal dialog
                await studioUtils.insertContentLinkInCke("test-content-link", "Templates")
                //3. toolbar should be visible here, so click on Insert Link button and open the modal dialog  again
                await htmlAreaForm.clickOnInsertLinkButton();
                studioUtils.saveScreenshot('htmlarea_content_link_reopened');
                let isActive = await insertLinkDialog.isTabActive('Content');
                assert.isTrue(isActive, '`Content` tab should be active');
                let result = await insertLinkDialog.getSelectedOptionDisplayName();
                assert.equal(result, "Templates", "Expected selected option should be displayed in the  tab");
            });

        //Verify issue Less strict Regexp for HtmlArea links
        // https://github.com/enonic/app-contentstudio/issues/1458
        it(`GIVEN 'Insert Link' dialog is opened WHEN link to another section has been typed in the URL-input AND 'Insert' button pressed THEN modal dialog should be closed and the link is inserted`,
            async () => {
                let htmlAreaForm = new HtmlAreaForm();
                await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
                await htmlAreaForm.pause(1000);
                //1. Open Insert Link dialog:
                let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
                //2. create a link to another section on the same page #section2
                await insertLinkDialog.typeText("Go to Section 2");
                await insertLinkDialog.typeUrl("#section2");
                //3. toolbar should be visible here, so click on Insert Link button and open the modal dialog  again
                await insertLinkDialog.clickOnInsertButton();
                studioUtils.saveScreenshot('insert_link_dialog_anchor1');
                //4. Verify that validation message is not displayed and dialog is closed:
                let result = await insertLinkDialog.waitForValidationMessage();
                assert.isFalse(result, "Validation message should not be displayed");
                await insertLinkDialog.waitForDialogClosed();
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    });
