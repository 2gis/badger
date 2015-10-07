describe('ENV and launches pagination', function () {

    var executePage = require('./execute_page.js');

    var mockModule;

    beforeEach(function(){
        mockModule = require('./execute_mock.js');
        browser.addMockModule('executeMock', mockModule.executeMock);
        browser.get('/#/testplan/1/execute');
    });

    afterEach(function(){
        browser.removeMockModule('executeMock');
    });

    it('default selected flag', function () {
        tasks = element.all(by.repeater('item in $data'));
        expect(tasks.count()).toBe(3);
        expect(tasks.first().getAttribute('class')).toMatch('selected-launch-items');
        expect(tasks.get(1).getAttribute('class')).not.toMatch('selected-launch-items');
        expect(tasks.last().getAttribute('class')).not.toMatch('selected-launch-items');
    });

    it('default selected/unselected all', function () {
        tasks = element.all(by.repeater('item in $data'));
        expect(tasks.count()).toBe(3);
        element(by.css('[ng-click="selectAllTasks(true)"]')).click();
        expect(tasks.first().getAttribute('class')).toMatch('selected-launch-items');
        expect(tasks.get(1).getAttribute('class')).toMatch('selected-launch-items');
        expect(tasks.last().getAttribute('class')).toMatch('selected-launch-items');

        element(by.css('[ng-click="selectAllTasks(false)"]')).click();
        expect(tasks.first().getAttribute('class')).toMatch('selected-launch-items');
        expect(tasks.get(1).getAttribute('class')).not.toMatch('selected-launch-items');
        expect(tasks.last().getAttribute('class')).not.toMatch('selected-launch-items');
    });

    it('dialog window should appear if execute only deploy task', function () {
        tasks = element.all(by.repeater('item in $data'));
        element(by.css('[ng-click="execute(testPlan)"]')).click();
        browser.sleep(1000);
        element(by.className('modal-body')).getText().then(function(text) {
           expect(text).toBe('Are you sure you want to execute only deploy script?');
        });
    });

    it('dialog window cancel button', function () {
        tasks = element.all(by.repeater('item in $data'));
        element(by.css('[ng-click="execute(testPlan)"]')).click();
        browser.sleep(1000);
        var modalFooter = element(by.className('modal-footer'));
        var buttons = modalFooter.all(by.tagName('button'));
        expect(buttons.count()).toBe(2);
        buttons.first().click();
        expect(element(by.css('[ng-click="execute(testPlan)"]')).isEnabled()).toBe(true);
    });

    it('dialog window submit button', function () {
        tasks = element.all(by.repeater('item in $data'));
        element(by.css('[ng-click="execute(testPlan)"]')).click();
        browser.sleep(1000);
        var modalFooter = element(by.className('modal-footer'));
        var buttons = modalFooter.all(by.tagName('button'));
        expect(buttons.count()).toBe(2);
        buttons.last().click();
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/testplan/1');
    });

    it('new env should be in post-request', function () {
        element(by.css('[ng-click="addEnvironmentItem()"]')).click();
        expect(executePage.envKey.isDisplayed()).toBe(true);
        expect(executePage.envValue.isDisplayed()).toBe(true);

        executePage.envKey.sendKeys('NEW_ENV_KEY');
        executePage.envValue.sendKeys('NEW_ENV_VALUE');
        element(by.css('[ng-click="selectAllTasks(true)"]')).click();
        element(by.css('[ng-click="execute(testPlan)"]')).click();
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/testplan/1');
    });

    it('deleted env should not be in post-request', function () {
        element(by.css('[ng-click="addEnvironmentItem()"]')).click();
        element(by.css('[ng-click="addEnvironmentItem()"]')).click();

        var keys = element.all(by.model('item.key'));
        var values = element.all(by.model('item.value'));

        expect(keys.count()).toBe(2);
        expect(values.count()).toBe(2);

        keys.first().sendKeys('NEW_ENV_KEY');
        keys.last().sendKeys('SECOND_ENV_KEY');

        values.first().sendKeys('NEW_ENV_VALUE');
        values.last().sendKeys('SECOND_ENV_VALUE');

        var deletes = element.all(by.css('[ng-click="removeEnvironmentItem($index)"]'));
        deletes.last().click();

        element(by.css('[ng-click="selectAllTasks(true)"]')).click();
        element(by.css('[ng-click="execute(testPlan)"]')).click();
    });

    it('pagination should navigate to suitable page', function () {
        browser.get('/#/testplan/1');
        expect(element.all(by.repeater('launch in $data')).count()).toBe(10);

        var pages = element.all(by.css('[ng-click="params.page(page.number)"]'));
        expect(pages.count()).toBe(4);

        pages.get(2).click();
        expect(element.all(by.repeater('launch in $data')).count()).toBe(1);

        var sizes = element.all(by.css('[ng-click="params.count(count)"]'));
        expect(sizes.count()).toBe(3);

        pages.first().click();
        expect(element.all(by.repeater('launch in $data')).count()).toBe(10);

        pages.last().click();
        expect(element.all(by.repeater('launch in $data')).count()).toBe(1);

        sizes.get(1).click();
        expect(element.all(by.repeater('launch in $data')).count()).toBe(11);
        pages = element.all(by.css('[ng-click="params.page(page.number)"]'));
        expect(pages.count()).toBe(0);
    });

    it('sort launch items', function() {
        tasks = element.all(by.repeater('item in $data'));
        expect(tasks.count()).toBe(3);
        expect(tasks.first().all(by.tagName('td')).first().getText()).toBe('Deploy task');
        expect(tasks.get(1).all(by.tagName('td')).first().getText()).toBe('Regular task');
        expect(tasks.last().all(by.tagName('td')).first().getText()).toBe('Conclusive task');
    });

});