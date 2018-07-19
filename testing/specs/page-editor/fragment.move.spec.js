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
const contentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const pageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const liveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");
const moveContentDialog = require('../../page_objects/browsepanel/move.content.dialog');
const confirmationDialog = require('../../page_objects/confirmation.dialog');


describe('Move Fragment` specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let CONTROLLER_NAME = 'main region';
    it(`WHEN new site has been added THEN the site should be listed in the grid`,
        () => {
            //this.bail(1);
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App'], CONTROLLER_NAME);
            return studioUtils.doAddSite(SITE).then(() => {
            }).then(() => {
                studioUtils.saveScreenshot(displayName + '_created');
                return studioUtils.findAndSelectItem(SITE.displayName);
            }).then(() => {
                return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            }).then(isDisplayed => {
                assert.isTrue(isDisplayed, 'site should be listed in the grid');
            });
        });

    it(`GIVEN existing site is opened AND Text component has been inserted WHEN text-component has been saved as fragment THEN new Fragment-content should be created`,
        () => {
            return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(() => {
                return contentWizard.clickOnShowComponentViewToggler();
            }).then(() => {
                return pageComponentView.openMenu("main");
            }).then(() => {
                return pageComponentView.selectMenuItem(["Insert", "Text"]);
            }).then(() => {
                return liveFormPanel.typeTextInCKETextComponent('text_component_1');
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                return pageComponentView.openMenu("text_component_1");
            }).then(() => {
                return pageComponentView.clickOnMenuItem(appConstant.MENU_ITEMS.SAVE_AS_FRAGMENT);
            }).pause(2000).then(() => {
                studioUtils.saveScreenshot('text_saved_as_fragment2')
            })
        });
    // Verifies: app-contentstudio#22 Confirmation dialog does not appear, when a fragment is filtered
    it(`GIVEN existing text-fragment is selected WHEN 'Move' button has been pressed and the action is confirmed THEN the fragment should be moved to the root directory`,
        () => {
            return studioUtils.findAndSelectContentByDisplayName('text_component_1').then(() => {
                return contentBrowsePanel.clickOnMoveButton();
            }).then(() => {
                return moveContentDialog.waitForOpened();
            }).then(() => {
                return moveContentDialog.clickOnMoveButton();
            }).pause(2000).then(() => {
                return confirmationDialog.waitForDialogVisible();
            }).then(result => {
                return assert.isTrue(result, 'confirmation dialog should be loaded!');
            }).then(() => {
                return confirmationDialog.clickOnYesButton();
                //You are about to move content out of its site which might make it unreachable. Are you sure?
            }).then(() => {
                studioUtils.saveScreenshot('fragment_is_moved');
                return contentBrowsePanel.waitForNotificationMessage();
            }).then(result => {
                return assert.isTrue(result == `Item \"text_component_1\" is moved.`,
                    'correct notification message should appear');
            })
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
