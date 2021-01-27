/**
 * Created on 14.05.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const InsertLinkDialog = require('../../page_objects/wizardpanel/insert.link.modal.dialog.cke');
const MoveContentDialog = require('../../page_objects/browsepanel/move.content.dialog');

describe('Text Component with CKE - insert download-link  specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let TEST_CONTENT_DISPLAY_NAME = 'server';
    let CONTROLLER_NAME = 'main region';
    const EXPECTED_SRC = '<p><a href="media://download/';

    it(`Precondition: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App'], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it(`Precondition: *.sh file should be moved to the site`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let moveContentDialog = new MoveContentDialog();
            await studioUtils.findAndSelectItem("server.sh");
            await contentBrowsePanel.clickOnMoveButton();
            await moveContentDialog.waitForOpened();
            await moveContentDialog.typeTextAndClickOnOption(SITE.displayName);
            await moveContentDialog.clickOnMoveButton();
        });

    it(`GIVEN Text component is inserted AND 'Insert Link' dialog is opened WHEN 'download-link' has been inserted THEN correct data should be present in the CKE`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            //1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.clickOnShowComponentViewToggler();
            await pageComponentView.openMenu("main");
            //2. Insert text component:
            await pageComponentView.selectMenuItem(["Insert", "Text"]);
            await textComponentCke.switchToLiveEditFrame();
            //3. Open Insert Link dialog:
            await textComponentCke.clickOnInsertLinkButton();
            //4. Type a link-name and select a target:
            await studioUtils.insertDownloadLinkInCke("test", TEST_CONTENT_DISPLAY_NAME);
            await textComponentCke.switchToLiveEditFrame();
            studioUtils.saveScreenshot('download_link_inserted');
            //5. Verify the text in CKE:
            let actualText = await textComponentCke.getTextFromEditor();
            assert.include(actualText, EXPECTED_SRC, "Expected text should be in CKE");
            //Save the changes:
            await textComponentCke.switchToParentFrame();
            await contentWizard.waitAndClickOnSave();
        });

    it(`GIVEN site is selected WHEN 'Preview' button has been pressed THEN download-link should be present in the page`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select the site and click on Preview button
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnPreviewButton();
            await studioUtils.switchToContentTabWindow(SITE.displayName);
            //2. Verify that new added link is present
            let isDisplayed = await studioUtils.isElementDisplayed(`a=test`);
            studioUtils.saveScreenshot('download_link_present');
            assert.isTrue(isDisplayed, 'download link should be present on the page');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => {
        let insertLinkDialog = new InsertLinkDialog();
        return insertLinkDialog.isDialogOpened().then(result => {
            if (result) {
                return insertLinkDialog.clickOnCancelButton();
            }
        }).then(() => {
            return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        })
    });
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
