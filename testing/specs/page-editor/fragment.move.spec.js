/**
 * Created on 06.04.2018.
 * Verifies: xp-apps#747 Issues with the moving of fragments(Confirmation dialog does not appear, when a fragment is filtered)
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const LiveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");
const MoveContentDialog = require('../../page_objects/browsepanel/move.content.dialog');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const TextComponent = require('../../page_objects/components/text.component');

describe('Move Fragment` specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let CONTROLLER_NAME = 'main region';

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN existing site is opened AND Text component has been inserted WHEN text-component has been saved as fragment THEN new Fragment-content should be created`,
        () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponent = new TextComponent();
            return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(() => {
                return contentWizard.clickOnShowComponentViewToggler();
            }).then(() => {
                return pageComponentView.openMenu("main");
            }).then(() => {
                return pageComponentView.selectMenuItem(["Insert", "Text"]);
            }).then(() => {
                return textComponent.typeTextInCkeEditor('text_component_1')
            }).then(() => {
                return contentWizard.switchToMainFrame();
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                return contentWizard.pause(1500);
            }).then(() => {
                // wait for (1500) page is rendered and open the menu
                return pageComponentView.openMenu("text_component_1");
            }).then(() => {
                return pageComponentView.clickOnMenuItem(appConstant.MENU_ITEMS.SAVE_AS_FRAGMENT);
            }).then(() => {
                studioUtils.saveScreenshot('text_saved_as_fragment2')
            })
        });
    // Verifies: app-contentstudio#22 Confirmation dialog does not appear, when a fragment is filtered
    it(`GIVEN existing text-fragment is selected WHEN 'Move' button has been pressed and the action is confirmed THEN the fragment should be moved to the root directory`,
        () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let moveContentDialog = new MoveContentDialog();
            let confirmationDialog = new ConfirmationDialog();
            return studioUtils.findAndSelectContentByDisplayName('text_component_1').then(() => {
                return contentBrowsePanel.clickOnMoveButton();
            }).then(() => {
                return moveContentDialog.waitForOpened();
            }).then(() => {
                return moveContentDialog.clickOnMoveButton();
            }).then(() => {
                return confirmationDialog.waitForDialogOpened();
            }).then(result => {
                return assert.isTrue(result, 'confirmation dialog should be loaded!');
            }).then(() => {
                return confirmationDialog.clickOnYesButton();
                //You are about to move content out of its site which might make it unreachable. Are you sure?
            }).then(() => {
                studioUtils.saveScreenshot('fragment_is_moved');
                return contentBrowsePanel.waitForNotificationMessage();
            }).then(result => {
                assert.equal(result, `Item \"text_component_1\" is moved.`, 'Expected notification message should appear');
            })
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
