/**
 * Created on 11.08.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');

describe("insert.component.workflow.spec - insert a component and click on 'Mark as ready button'", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let CONTROLLER_NAME = 'main region';
    const TEXT_WITH_SPACES = 'test text2   ';

    it("Precondition - new site should be added",
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it("GIVEN a text component has been inserted in the site WHEN 'Mark as ready' button has been pressed THEN site's status gets 'Ready for publishing'",
        async () => {
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Open an existing site (work in progress)
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            await pageComponentView.openMenu("main");
            // 3. Insert Text Component with test text and save it:
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, appConst.PCV_MENU_ITEM.TEXT]);
            await textComponentCke.typeTextInCkeEditor("test text");
            // 4. Click on 'Mark as Ready' button:
            await contentWizard.clickOnMarkAsReadyButton();
            let expectedMessage = appConst.itemMarkedAsReadyMessage(SITE.displayName);
            let actualMessage = await contentWizard.waitForNotificationMessage();
            assert.equal(actualMessage, expectedMessage, "Item is marked as ready - this message should appear");
            // Publish Wizard loads automatically , close it :
            await contentPublishDialog.clickOnCancelTopButton();
            await studioUtils.saveScreenshot("text_component_mark_as_ready_pressed");
            // 5. Verify the workflow state get 'Ready for publishing'
            await contentWizard.clickOnMinimizeLiveEditToggler();
            let actualWorkflow = await contentWizard.getContentWorkflowState();
            assert.equal(actualWorkflow, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING,
                "Ready for publishing status should be displayed in the wizard");
            // 6. Verify that Publish button gets displayed in the wizard-toolbar
            await contentWizard.waitForPublishButtonDisplayed();
            // 7. Verify the workflow status in Browse Panel:
            await studioUtils.doSwitchToContentBrowsePanel();
            actualWorkflow = await contentBrowsePanel.getWorkflowStateByDisplayName(SITE.displayName);
            assert.equal(actualWorkflow, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING,
                "'Ready for publishing' should be displayed in browse panel");
        });

    it("GIVEN text with spaces has been inserted in a text component WHEN 'Save' button has been pressed THEN 'Saved' button should appear in the wizard toolbar",
        async () => {
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            let contentWizard = new ContentWizard();
            // 1. Open an existing site and insert new text component:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, appConst.PCV_MENU_ITEM.TEXT]);
            // 3. insert a text with spaces:
            await textComponentCke.insertTextInCkeEditor(TEXT_WITH_SPACES);
            await textComponentCke.insertTextInCkeEditor(TEXT_WITH_SPACES);
            // 4. Click on 'Save' button:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await contentWizard.pause(2000);
            await studioUtils.saveScreenshot("text_component_saved_button");
            // 5. Verify that Saved button gets visible in the toolbar:
            await contentWizard.waitForSavedButtonVisible();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
