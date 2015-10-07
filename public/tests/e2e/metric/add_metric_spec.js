describe('Add metric', function () {

    var metricPage = require('./add_metric_page.js');

    var mockModule;

    beforeEach(function() {
        browser.clearMockModules();
        mockModule = require('./add_metric_mock.js');
        browser.addMockModule('metricMock', mockModule.metricMock);
        browser.get('/#/project/1/metrics');
    });

    afterEach(function() {
        browser.removeMockModule('metricMock');
    });

    it('"Add new metric" should navigate to the add-page', function () {
        metricPage.addNewMetricButton.click();
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/project/1/metric/add');
    });

    it('Button "Add new" should create new metric', function () {
        metricPage.addNewMetricButton.click();
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/project/1/metric/add');

        metricPage.addMetricName.sendKeys('NEW METRIC');
        metricPage.addMetricJiraFilter.sendKeys('NEW QUERY');
        metricPage.addMetricHandler.sendKeys('Total count');
        metricPage.saveNewMetricButton.click();

        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/project/1/metrics');
        metrics = element.all(by.repeater('metric in metrics'));
        expect(metrics.count()).toBe(1);
    });

    it('Try to create existent metric should show alert', function () {
        metricPage.addNewMetricButton.click();
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/project/1/metric/add');

        metricPage.addMetricName.sendKeys('EXISTENT METRIC');
        metricPage.addMetricJiraFilter.sendKeys('NEW QUERY');
        metricPage.addMetricHandler.sendKeys('Total count');
        metricPage.saveNewMetricButton.click();

        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/project/1/metric/add');
        expect(metricPage.formErrorsAlert.getAttribute('class')).not.toMatch('disabled');
        expect(metricPage.formErrorsAlert.getText()).toBe('Metric already exist, choose another name');
    });

    it('Try to create metric without name', function () {
        metricPage.addNewMetricButton.click();
        metricPage.saveNewMetricButton.click();
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/project/1/metric/add');
    });

    it('Try to create metric without jira filter', function () {
        metricPage.addNewMetricButton.click();
        metricPage.addMetricName.sendKeys('NEW METRIC');
        metricPage.saveNewMetricButton.click();
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/project/1/metric/add');
    });

    it('Try to create metric without handler', function () {
        metricPage.addNewMetricButton.click();
        metricPage.addMetricName.sendKeys('NEW METRIC');
        metricPage.addMetricJiraFilter.sendKeys('NEW QUERY');
        metricPage.saveNewMetricButton.click();
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/project/1/metric/add');
    });

    it('"Restore data" should show additional fields', function () {
        metricPage.addNewMetricButton.click();
        metricPage.addMetricName.sendKeys('NEW METRIC');
        metricPage.addMetricJiraFilter.sendKeys('NEW QUERY');
        metricPage.addMetricHandler.sendKeys('Total count');

        metricPage.restoreMetricData.click();
        expect(metricPage.restoreFilter.isDisplayed()).toBe(true);
        expect(metricPage.restoreHandler.isDisplayed()).toBe(true);
        expect(metricPage.restoreStep.isDisplayed()).toBe(true);
    });

    it('"Restore data" create metric with additional fields', function () {
        metricPage.addNewMetricButton.click();
        metricPage.addMetricName.sendKeys('NEW METRIC');
        metricPage.addMetricJiraFilter.sendKeys('NEW QUERY');
        metricPage.addMetricHandler.sendKeys('Total count');

        metricPage.restoreMetricData.click();
        metricPage.restoreFilter.sendKeys('RESTORE FILTER');
        metricPage.restoreHandler.sendKeys('created');
        metricPage.restoreStep.sendKeys('7');

        metricPage.saveNewMetricButton.click();
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/project/1/metrics');
    });

    it('"Restore data" not required without filter', function () {
        metricPage.addNewMetricButton.click();
        metricPage.addMetricName.sendKeys('NEW METRIC');
        metricPage.addMetricJiraFilter.sendKeys('NEW QUERY');
        metricPage.addMetricHandler.sendKeys('Total count');

        metricPage.restoreMetricData.click();
        metricPage.saveNewMetricButton.click();
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/project/1/metrics');
    });

    it('"Restore data" required if filter not empty', function () {
        metricPage.addNewMetricButton.click();
        metricPage.addMetricName.sendKeys('NEW METRIC');
        metricPage.addMetricJiraFilter.sendKeys('NEW QUERY');
        metricPage.addMetricHandler.sendKeys('Total count');

        metricPage.restoreMetricData.click();
        metricPage.restoreFilter.sendKeys('RESTORE FILTER');

        metricPage.saveNewMetricButton.click();
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/project/1/metric/add');
    });

    it('"Restore data" without step', function () {
        metricPage.addNewMetricButton.click();
        metricPage.addMetricName.sendKeys('NEW METRIC');
        metricPage.addMetricJiraFilter.sendKeys('NEW QUERY');
        metricPage.addMetricHandler.sendKeys('Total count');

        metricPage.restoreMetricData.click();
        metricPage.restoreFilter.sendKeys('RESTORE FILTER');
        metricPage.restoreHandler.sendKeys('created');

        metricPage.saveNewMetricButton.click();
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/project/1/metric/add');
    });

});