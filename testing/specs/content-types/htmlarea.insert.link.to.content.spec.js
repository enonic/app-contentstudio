/**
 * Created on 11.01.2019.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const InsertLinkDialog = require('../../page_objects/wizardpanel/insert.link.modal.dialog.cke');

describe(
    'htmlarea.insert.link.to.content.spec: insert `content-link` in htmlArea and verify that the content is present in Insert Link modal dialog',
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();
        let SITE;

        it(`Preconditions: new site should be created`,
            () => {
                let contentBrowsePanel = new ContentBrowsePanel();
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

        it(`GIVEN content link is inserted in htmlarea WHEN 'Edit link' modal dialog is opened THEN Content tab should be active and expected content should be present in selected options`,
            () => {
                let htmlAreaForm = new HtmlAreaForm();
                let insertLinkDialog = new InsertLinkDialog();
                return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1').then(()=>{
                    return htmlAreaForm.pause(1000);
                }).then(() => {
                    return htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
                }).then(() => {
                    // insert a content-link and close the modal dialog
                    return studioUtils.insertContentLinkInCke("test-content-link", "Templates")
                }).then(() => {
                    //toolbar should be visible here, so click on Insert Link button and open the modal dialog  again
                    return htmlAreaForm.clickOnInsertLinkButton();
                }).then(() => {
                    studioUtils.saveScreenshot('htmlarea_content_link_reopened');
                    return insertLinkDialog.isTabActive('Content');
                }).then(result => {
                    assert.isTrue(result, '`Content` tab should be active');
                }).then(() => {
                    return insertLinkDialog.getSelectedOptionDisplayName();
                }).then(result => {
                    assert.equal(result, "Templates", "Expected option should be displayed in the dialog");
                })
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    });
