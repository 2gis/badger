describe('Launch', function () {

    var launchPage = require('./launch_page.js');

    var mockModule;

    beforeEach(function() {
        mockModule = require('./launch_mock.js');
        browser.addMockModule('launchMock', mockModule.launchMock);
        browser.get('/#/testplan/100');
    });

    afterEach(function() {
        browser.removeMockModule('addMock');
    });

    it('"Add new launch item" should navigate to the add-page', function () {
        launchPage.launchItemsList.click();
        launchPage.addNewLaunchLink.click();
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/testplan/100/launch-item/add');
    });

    it('save button and radio Deploy should be disable', function(){
        browser.get('/#/testplan/100/launch-item/add');
        expect(launchPage.addNewLaunchSubmit.isEnabled()).toBe(false);
        expect(launchPage.deployRadioButton.isEnabled()).toBe(false);
    });

    it('edit launch item', function(){
        launchPage.launchItemsList.click();
        var itemsList = element.all(by.id('launch-item-edit-button'));
        itemsList.first().click();
        expect(launchPage.editLaunchItemName.isDisplayed()).toBe(true);
        expect(launchPage.editLaunchItemCommand.isDisplayed()).toBe(true);
        expect(launchPage.editLaunchItemTimeout.isDisplayed()).toBe(true);

        launchPage.editLaunchItemName.clear();
        launchPage.editLaunchItemName.sendKeys('EDIT LAUNCH');
        launchPage.editLaunchItemCommand.sendKeys('ECHO 2');
        launchPage.editLaunchItemTimeout.sendKeys('3600');
        launchPage.launchItemSave.click();

        var launches = element.all(by.repeater('launchItem in $data'));
        expect(launches.count()).toBe(3);
        expect(launches.first().all(by.tagName('td')).first().getText()).toBe('EDIT LAUNCH');
    });

    it('delete deploy task button hidden', function() {
        launchPage.launchItemsList.click();
        var item = element.all(by.repeater('launchItem in $data')).first();
        expect(item.element(by.id('launch-item-delete-button')).isDisplayed()).toBe(false);
    });

    it('delete launch item', function() {
        launchPage.launchItemsList.click();
        var itemsList = element.all(by.id('launch-item-delete-button'));
        itemsList.get(1).click();
        browser.sleep(1000);
        expect(element(by.binding('modalBody'))
            .getText()).toBe('Are you sure you want to delete launch item "Regular task"?');
        element(by.css('[ng-click="modalCallBack()"]')).click();
    });

    it('sort launch items', function() {
        launchPage.launchItemsList.click();
        var items = element.all(by.repeater('launchItem in $data'));
        expect(items.first().all(by.tagName('td')).first().getText()).toBe('Deploy task');
        expect(items.get(1).all(by.tagName('td')).first().getText()).toBe('Regular task');
        expect(items.last().all(by.tagName('td')).first().getText()).toBe('Conclusive task');
    });

});