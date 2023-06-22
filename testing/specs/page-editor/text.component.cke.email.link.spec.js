/**
 * Created on 14.06.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const SiteFormPanel = require('../../page_objects/wizardpanel/site.form.panel');
const ContentWizardPanel = require('../../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../../libs/app_const');

describe('Text Component with CKE - insert email link  specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let TEST_EMAIL = 'test@mail.com';
    let CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;
    const EXPECTED_SRC = '<p><a href="mailto:test@mail.com">test</a></p>';


    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN Text component is inserted AND 'Insert Link' dialog is opened WHEN 'email-link' has been inserted THEN correct data should be present in the CKE`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentCke = new TextComponentCke();
            let pageComponentView = new PageComponentView();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert new text-component
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.switchToLiveEditFrame();
            // 4. Open 'Insert Link' dialog and insert email-link:
            await textComponentCke.clickOnInsertLinkButton();
            await studioUtils.insertEmailLinkInCke('test', TEST_EMAIL);
            await contentWizard.pause(1000);
            await textComponentCke.switchToLiveEditFrame();
            // 5. Verify inserted link in the page:
            await studioUtils.saveScreenshot('email_link_inserted');
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
            await studioUtils.saveScreenshot('email_link_present');
            assert.isTrue(isDisplayed, 'email link should be present in the page');
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/3476
    //B/I/U disappeared from Text component's toolbar #3476
    it(`GIVEN Text component is inserted THEN B/I/U buttons should be present in the cke-toolbar`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentCke = new TextComponentCke();
            let pageComponentView = new PageComponentView();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert new text-component
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.switchToLiveEditFrame();
            // 4. Verify B/I/U buttons
            await studioUtils.saveScreenshot('bold_italic_buttons_text_component');
            await textComponentCke.waitForBoldButtonDisplayed();
            await textComponentCke.waitForItalicButtonDisplayed();
            await textComponentCke.waitForUnderlineButtonDisplayed();
        });

    // Verifies issue: https://github.com/enonic/app-contentstudio/issues/4301
    // Text Component - text area gets focus only after double click
    it("WHEN text component has been inserted in a site THEN text area should be focused in the live edit",
        async () => {
            let pageComponentView = new PageComponentView();
            let textComponent = new TextComponentCke();
            let siteFormPanel = new SiteFormPanel();
            let contentWizard = new ContentWizardPanel();
            //1. Open new site-wizard, select an application and controller:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await siteFormPanel.addApplications([appConst.APP_CONTENT_TYPES]);
            await contentWizard.selectPageDescriptor(CONTROLLER_NAME);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            //3. Verify that the text area is focused:
            await studioUtils.saveScreenshot('text_component_focused');
            let isFocused = await textComponent.isTextAreaFocused();
            assert.isTrue(isFocused, 'text area should be focused in the text component');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
