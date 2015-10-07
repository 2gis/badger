var MetricPage = function() {

    this.addNewMetricButton = element(by.id('add-new-metric-button'));
    this.saveNewMetricButton = element(by.id('save-new-metric-button'));
    this.formErrorsAlert = element(by.id('form-errors'));
    this.restoreMetricData = element(by.id('restore-data-link'));

    this.addMetricName = element(by.model('metric.name'));
    this.addMetricJiraFilter = element(by.model('metric.query'));
    this.addMetricHandler = element(by.model('metric.handler'));
    this.addMetricWeight = element(by.model('metric.weight'));

    this.restoreFilter = element(by.model('metric.query_period'));
    this.restoreHandler = element(by.model('metric.query_field'));
    this.restoreStep = element(by.model('metric.query_step'));

};

module.exports = new MetricPage();
