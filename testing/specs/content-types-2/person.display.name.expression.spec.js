/**
 * Created on 28.03.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const PersonFormPanel = require('../../page_objects/wizardpanel/person.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');

describe('person.display.name-expression.spec: tests for Display name expression', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTENT_NAME = contentBuilder.generateRandomName('person');
    const PERSON_FIRST_NAME = "John";
    const PERSON_LAST_NAME = "O'Brien";
    const EXPECTED_NAME_EXPRESSION = "John O 'Brien";
    const EXPECTED_CONTENT_NAME = "john-o-brien"

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/4172
    //DisplayNameResolver spawns error on field values with a single quote #4172
    it("GIVEN wizard for content with name expression is opened WHEN name and last name have been filled in THEN expected expression should be present in the display name input",
        async () => {
            let personForm = new PersonFormPanel();
            let contentWizard = new ContentWizard();
            //1. open new wizard and fill in the name input:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.PERSON);
            //2. Fill in the first name input
            await personForm.typeInFirstNameInput(PERSON_FIRST_NAME);
            //3. Fill in the last name input
            await personForm.typeInLastNameInput(PERSON_LAST_NAME);
            //4. Fill in the city name input
            await personForm.typeInCItyInput("Oslo");
            await studioUtils.saveScreenshot('person_1_expression');
            let actualDisplayNAme = await contentWizard.getDisplayName();
            //5. Click on Save button:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            //6. Verify the name expression
            assert.equal(actualDisplayNAme, EXPECTED_NAME_EXPRESSION, "Expected display name should be displayed");
        });

    it("WHEN the content has been selected THEN expected title-expression should be displayed in the grid",
        async () => {
            //1. find and select the person content:
            await studioUtils.findAndSelectItem(EXPECTED_CONTENT_NAME);
            await studioUtils.saveScreenshot('person_1_title_expression');
            let contentBrowsePanel = new ContentBrowsePanel();
            //2. Verify that expected title-expression should be displayed in the grid
            let result = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.equal(result[0], "John O'Brien from Oslo", "Expected title-expression should be displayed");
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
