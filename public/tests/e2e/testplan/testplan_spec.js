describe('Testplan', function () {

    var testplanPage = require('./testplan_page.js');

    var mockModule;

    beforeEach(function() {
        mockModule = require('./testplan_mock.js');
        browser.addMockModule('testplanMock', mockModule.testplanMock);
        browser.get('/#/testplan/100');
    });

    afterEach(function() {
        browser.removeMockModule('testplanMock');
    });

    it('delete dialog window', function () {
        testplanPage.actionsList.click();
        testplanPage.deleteButton.click();
        browser.sleep(1000);
        element(by.className('modal-body')).getText().then(function(text) {
           expect(text).toBe('Are you sure you want to delete testplan "Barsuk"?');
        });
    });

    it('delete dialog window cancel button', function () {
        testplanPage.actionsList.click();
        testplanPage.deleteButton.click();
        browser.sleep(1000);
        var modalFooter = element(by.className('modal-footer'));
        var buttons = modalFooter.all(by.tagName('button'));
        expect(buttons.count()).toBe(2);
        buttons.first().click();
        expect(testplanPage.deleteButton.isEnabled()).toBe(true);
    });

    it('delete dialog window submit button', function () {
        testplanPage.actionsList.click();
        testplanPage.deleteButton.click();
        browser.sleep(1000);
        var modalFooter = element(by.className('modal-footer'));
        var buttons = modalFooter.all(by.tagName('button'));
        expect(buttons.count()).toBe(2);
        buttons.last().click();
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/dashboard');
    });

    it('checkbox in show statistics open filter field', function () {
        testplanPage.actionsList.click();
        testplanPage.showStatistics.click();
        expect(testplanPage.statisticFilter.isDisplayed()).toBe(true);
        testplanPage.showStatistics.click();
        expect(testplanPage.statisticFilter.isDisplayed()).toBe(false);
    });

    it('update settings', function () {
        testplanPage.actionsList.click();
        testplanPage.showStatistics.click();
        testplanPage.statisticFilter.sendKeys('full');
        testplanPage.updateButton.click();
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/testplan/100');
    });

});