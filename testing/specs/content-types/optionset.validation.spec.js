/**
 * Created on 24.05.2021.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const MultiSelectionOptionSet = require('../../page_objects/wizardpanel/optionset/multi.selection.option.set');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const appConst = require('../../libs/app_const');

describe("optionset.validation.spec: tests for validation of option set", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const DISPLAY_NAME = contentBuilder.generateRandomName('optionset');
    const OPTION_SET_UNLIM = contentBuilder.generateRandomName('optionset');

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    //Verifies: https://github.com/enonic/xp/issues/8765
    //Option-set with unlimited number of allowed selections is considered invalid #8765
    it(`GIVEN option set with default selected option is opened WHEN the default option has been unselected AND saved THEN the content should be valid in wizard`,
        async () => {
            let optionSetUnlimitedOptions = new MultiSelectionOptionSet();
            let contentWizard = new ContentWizard();
            //1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'optionset1');
            await contentWizard.typeDisplayName(DISPLAY_NAME);
            //2. Click  and unselect the default option :
            await optionSetUnlimitedOptions.clickOnOption("Option 2");
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('item_set_unlimited1');
            await contentWizard.waitUntilInvalidIconDisappears();
        });

    //Option-set with unlimited number of allowed selections is considered invalid #8765
    it(`GIVEN option set with default selected option is opened WHEN the default option has been unselected AND saved THEN the content should be valid in wizard`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'opt-set-unlim');
            await contentWizard.typeDisplayName(OPTION_SET_UNLIM);
            //2. save only the display name:
            await contentWizard.waitAndClickOnSave();
            //3. switch to the browse panel:
            await studioUtils.doSwitchToContentBrowsePanel();
            //4. Select the option set content:
            await studioUtils.findAndSelectItem(OPTION_SET_UNLIM);
            await studioUtils.saveScreenshot('item_set_unlimited2');
            //5. Verify that the content is valid:
            let isInvalid = await contentBrowsePanel.isRedIconDisplayed(OPTION_SET_UNLIM);
            assert.isFalse(isInvalid, "Option Set content should be valid in Grid");
        });

    //Verifies: https://github.com/enonic/xp/issues/8765
    //Option-set with unlimited number of allowed selections is considered invalid #8765
    it("WHEN existing option set has been filtered THEN the content should be valid in grid",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. select the existing option set:
            await studioUtils.findAndSelectItem(DISPLAY_NAME);
            await studioUtils.saveScreenshot('item_set_unlimited3');
            //2. Verify the content is valid
            let isInvalid = await contentBrowsePanel.isRedIconDisplayed(DISPLAY_NAME);
            assert.isFalse(isInvalid, "Option Set content should be valid in Grid");
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
