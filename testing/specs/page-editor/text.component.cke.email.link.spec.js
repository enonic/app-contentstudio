/**
 * Created on 14.06.2018.
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

describe('Text Component with CKE - insert email link  specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let TEST_EMAIL = 'test@mail.com';
    let CONTROLLER_NAME = 'main region';
    const EXPECTED_SRC = '<p><a href="mailto:test@mail.com">test</a></p>';


    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN Text component is inserted AND 'Insert Link' dialog is opened WHEN 'email-link' has been inserted THEN correct data should be present in the CKE`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentCke = new TextComponentCke();
            let pageComponentView = new PageComponentView();
            //1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.clickOnShowComponentViewToggler();
            //2. Insert new text-component
            await pageComponentView.openMenu("main");
            await pageComponentView.selectMenuItem(["Insert", "Text"]);
            await textComponentCke.switchToLiveEditFrame();
            //3. Open 'Insert Link' dialog and insert email-link:
            await textComponentCke.clickOnInsertLinkButton();
            await studioUtils.insertEmailLinkInCke("test", TEST_EMAIL);
            await contentWizard.pause(1000);
            await textComponentCke.switchToLiveEditFrame();
            //4. Verify inserted link in the page:
            studioUtils.saveScreenshot('email_link_inserted');
            let actualText = await textComponentCke.getTextFromEditor();
            assert.include(actualText, EXPECTED_SRC, 'expected data should be in CKE');
            //Save the changes:
            await textComponentCke.switchToParentFrame();
            await contentWizard.waitAndClickOnSave();
        });

    it(`GIVEN site is selected WHEN 'Preview' button has been pressed THEN email-link should be present in the page`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select the site and click on Preview button:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnPreviewButton();
            await contentBrowsePanel.pause(1000);
            await studioUtils.switchToContentTabWindow(SITE.displayName);
            //2. Verify that the link is present:
            let isDisplayed = await studioUtils.isElementDisplayed(`a=test`);
            studioUtils.saveScreenshot('email_link_present');
            assert.isTrue(isDisplayed, 'email link should be present in the page');
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/3476
    //B/I/U disappeared from Text component's toolbar #3476
    it(`GIVEN Text component is inserted THEN B/I/U buttons should be present in the cke-toolbar`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentCke = new TextComponentCke();
            let pageComponentView = new PageComponentView();
            //1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.clickOnShowComponentViewToggler();
            //2. Insert new text-component
            await pageComponentView.openMenu("main");
            await pageComponentView.selectMenuItem(["Insert", "Text"]);
            await textComponentCke.switchToLiveEditFrame();
            //3. Verify B/I/U buttons
            await studioUtils.saveScreenshot("bold_italic_buttons_text_component");
            await textComponentCke.waitForBoldButtonDisplayed();
            await textComponentCke.waitForItalicButtonDisplayed();
            await textComponentCke.waitForUnderlineButtonDisplayed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
