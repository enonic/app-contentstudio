/**
 * Created on 04/07/2018.
 */
const Page = require('../page');
const {BUTTONS} = require('../../libs/elements');

const xpath = {
    container: `//section[@data-component='DetailsWidgetContentSection']`,
    pathProperty: "//dt[contains(.,'Path')]/following-sibling::dd[1]",
    displayNameProperty: "//dt[contains(.,'Display name')]/following-sibling::dd[1]",
    publishStatus: `//dt[contains(.,'Status')]/following-sibling::dd[1]//span[@data-component='DiffStatusBadge']/span[1]`,
    statusDiffStatus: `//dt[contains(.,'Status')]/following-sibling::dd[1]//span[@data-component='DiffStatusBadge']/span[2]`,
    statusValidity: `//dt[contains(.,'Status')]/following-sibling::dd[1]//span[@data-component='DiffStatusBadge']//span[contains(@class,'truncate')]`,
};

/*
Example

Status   Offline New Invalid
Display Name
Path
 */
class DetailsWidgetContentSection extends Page {

    get pathProperty() {
        return xpath.container + xpath.pathProperty;
    }

    get displayNameProperty() {
        return xpath.container + xpath.displayNameProperty;
    }

    async waitForPathPropertyDisplayed() {
        try {
            await this.waitForElementDisplayed(this.pathProperty);
        } catch (err) {
            await this.handleError('DetailsWidgetContentSection, path was not displayed', 'err_content_section_path', err);
        }
    }

    async waitForDisplayNamePropertyDisplayed() {
        try {
            await this.waitForElementDisplayed(this.displayNameProperty);
        } catch (err) {
            await this.handleError('DetailsWidgetContentSection, display name was not displayed', 'err_content_section_display_name', err);
        }
    }

    async getTextInPathField() {
        await this.waitForPathPropertyDisplayed();
        return await this.getText(this.pathProperty);
    }

    async getTextInDisplayNameField() {
        await this.waitForDisplayNamePropertyDisplayed();
        return await this.getText(this.displayNameProperty);
    }

    get publishStatus() {
        return xpath.container + xpath.publishStatus;
    }

    get statusDiffStatus() {
        return xpath.container + xpath.statusDiffStatus;
    }

    // Workflow and validation status are displayed in the same element, so we need to check both of them to get the full status info
    get statusValidity() {
        return xpath.container + xpath.statusValidity;
    }

    async getTextInDisplayNameField() {
        await this.waitForDisplayNamePropertyDisplayed();
        return await this.getText(this.displayNameProperty);
    }

    async getTextInPathField() {
        await this.waitForPathPropertyDisplayed();
        return await this.getText(this.pathProperty);
    }

    async getStatusText() {
        await this.waitForElementDisplayed(this.publishStatus);
        const publishStatus = await this.getText(this.publishStatus);
        const diffStatusElements = await this.findElements(this.statusDiffStatus);
        const diffStatus = diffStatusElements.length > 0 ? await diffStatusElements[0].getText() : '';
        const validityElements = await this.findElements(this.statusValidity);
        const validity = validityElements.length > 0 ? await validityElements[0].getText() : '';
        return [publishStatus, diffStatus, validity].filter(t => t).join(' ');
    }
}

module.exports = DetailsWidgetContentSection;
