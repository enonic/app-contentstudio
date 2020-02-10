/**
 * Created on 15.10.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const LiveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');

describe('insert.part.htmlarea.spec - insert a html-part in htlmlarea-content', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    let CONTROLLER_NAME = 'main region';
    let CONTENT_NAME;

    let TEST_TEXT = "Test text";

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    // verifies - Page Editor is not updated after content is saved #1096
    it(`GIVEN html-area content is opened AND part with html-example has been inserted WHEN text has been typed in the html-area THEN the text should appear in the Page Editor`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let liveFormPanel = new LiveFormPanel();
            let htmlAreaForm = new HtmlAreaForm();

            CONTENT_NAME = contentBuilder.generateRandomName('content');
            // Open new html-area wizard, type the name and type the initial text in the html-area :
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await contentWizard.typeDisplayName(CONTENT_NAME);
            await htmlAreaForm.typeTextInHtmlArea("test1");
            //1 Click on the toggler and open 'Page Editor'
            await contentWizard.clickOnPageEditorToggler();
            //2 Select the page descriptor
            await contentWizard.selectPageDescriptor("main region");
            //3 Open 'Page Components' modal dialog:
            await contentWizard.clickOnShowComponentViewToggler();
            //4 Open the context menu
            await pageComponentView.openMenu("main");
            //5 click on the 'Insert Part' menu item:
            await pageComponentView.selectMenuItem(["Insert", "Part"]);
            //6 Type the name and select the filtered option(select the part):
            await liveFormPanel.selectPartByDisplayName("Html Area Example");
            await contentWizard.switchToMainFrame();
            //7. Type a text in the html-area
            await htmlAreaForm.typeTextInHtmlArea(TEST_TEXT);
            //8. Save the content:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.switchToLiveEditFrame();
            //9. wait for the text is updated in Page Editor:
            studioUtils.saveScreenshot("text_in_part_updated");
            let actualText = await liveFormPanel.getTextInPart();
            assert.equal(actualText, TEST_TEXT, "Text should be updated in 'Page Editor'");
        });

    //Verifies (Case 1): https://github.com/enonic/app-contentstudio/issues/1487 Custom icon is overwritten with the default icon
    it(`GIVEN existing content with part(custom icon) is opened WHEN the part has been duplicated THEN the duplicated part should displayed with custom icon`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            //1. Open the content:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            await contentWizard.clickOnShowComponentViewToggler();
            //2. Open the context menu and duplicate existing part(the content should be saved automatically!):
            await pageComponentView.openMenu("Html Area Example");
            await pageComponentView.selectMenuItem(["Duplicate"]);
            //3. Verify that the default icon should be replaced with a custom icon:
            let isDefaultIcon = await pageComponentView.isItemWithDefaultIcon("Html Area Example", 0);
            assert.isFalse(isDefaultIcon, "The initial part should be displayed with the custom icon");
            isDefaultIcon = await pageComponentView.isItemWithDefaultIcon("Html Area Example", 1);
            assert.isFalse(isDefaultIcon, "The duplicated part should be displayed with the custom icon");
        });

    //Verifies(Case 2) : https://github.com/enonic/app-contentstudio/issues/1487 Custom icon is overwritten with the default icon
    it(`WHEN existing content with 2 parts(custom icon) is opened THEN the both parts should displayed with custom icon`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            //1. Open the content:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            await contentWizard.clickOnShowComponentViewToggler();
            //2. Verify that the custom icon should be displayed in each component:
            let isDefaultIcon = await pageComponentView.isItemWithDefaultIcon("Html Area Example", 0);
            assert.isFalse(isDefaultIcon, "The first part should be displayed with the custom icon");
            isDefaultIcon = await pageComponentView.isItemWithDefaultIcon("Html Area Example", 1);
            assert.isFalse(isDefaultIcon, "The second part should be displayed with the custom icon");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
