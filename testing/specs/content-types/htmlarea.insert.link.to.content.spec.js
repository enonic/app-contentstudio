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
                let insertLinkDialog = new InsertLinkDialog();
                await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
                await htmlAreaForm.pause(1000);
                //1. Open Insert Link dialog:
                await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
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

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    });
