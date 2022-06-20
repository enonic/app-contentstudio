/**
 * Created on 16.05.2018.
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
const appConst = require('../../libs/app_const');

describe('Text Component with CKE - insert content-link  specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let CONTROLLER_NAME = 'main region';
    const EXPECTED_SRC = '<p><a href="content://';

    it(`Precondition: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App'], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN Text component is inserted AND 'Insert Link' dialog is opened WHEN 'content-link' has been inserted THEN expected data should be present in the CKE`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            //1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.clickOnShowComponentViewToggler();
            //2. Insert text-component:
            await pageComponentView.openMenu("main");
            await pageComponentView.selectMenuItem(["Insert", "Text"]);
            //Close the details panel
            await contentWizard.clickOnDetailsPanelToggleButton();
            await textComponentCke.switchToLiveEditFrame();
            //3. Open Insert Link dialog
            await textComponentCke.clickOnInsertLinkButton();
            //4. Insert content-link:
            await studioUtils.insertContentLinkInCke("test", SITE.displayName);
            await textComponentCke.switchToLiveEditFrame();
            //5. Verify the text in CKE html area:
            studioUtils.saveScreenshot('content_link_inserted');
            let actualText = await textComponentCke.getTextFromEditor();
            assert.include(actualText, EXPECTED_SRC, 'expected data should be present in CKE');
            await textComponentCke.switchToParentFrame();
            await contentWizard.waitAndClickOnSave();
        });

    it(`GIVEN site is selected WHEN 'Preview' button has been pressed THEN content-link should be present in the page`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select the site and click on Preview button:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnPreviewButton();
            await studioUtils.switchToContentTabWindow(SITE.displayName);
            //2. Verify the link in the page:
            let isDisplayed = await studioUtils.isElementDisplayed(`a=test`);
            studioUtils.saveScreenshot('content_link_present');
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
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
