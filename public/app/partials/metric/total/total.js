'use strict';

var app = angular.module('testReport.metric.total', [
    'ngRoute',
    'testReportServices',
    'datePicker',
    'highcharts-ng'
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/project/:projectId/metric/charts/total', {
        templateUrl: '/static/app/partials/metric/total/total.html',
        controller: 'MetricsTotalCtrl'
    });
}]);

app.controller('MetricsTotalCtrl', ['$q', '$scope', '$rootScope', '$routeParams', 'appConfig', 'Metric', 'MetricValue', 'Calculate', 'ChartConfig', 'Periods',
    function ($q, $scope, $rootScope, $routeParams, appConfig, Metric, MetricValue, Calculate, ChartConfig, Periods) {

        if(!$rootScope.getActiveProject()) {
            $rootScope.selectProject($routeParams.projectId);
        }
        $scope.activeProjectId = $rootScope.getActiveProject();

        $scope.getDateMonthBack = function () {
            var dt = new Date();
            dt.setMonth(dt.getMonth()-1);
            return dt;
        };

        $scope.default_days = Periods.default_period();
        $scope.dateList = Periods.period_list();

        Metric.get({ project: $scope.activeProjectId }, function (response) {
            $scope.metrics = response.results;
            $scope.dates = _.map($scope.dateList, function (num, key) {
                return key;
            });
            $scope.drawChart($scope.default_days);
        });

        $scope.drawChart = function(days) {
            addMetricValuesToMetric(days).then(function(data) {
                $scope.prepareDataForChart(data, days);
            });
        };

        function getMetricValues(metric, days) {
            var deferred = $q.defer();

            var fields = {'metric_id': metric.id, days: $scope.dateList[days], page_size: 9999};

            MetricValue.custom_list(fields, function (response) {
                var values = _.sortBy(response.results, 'created');
                values.metric_name = metric.name;
                deferred.resolve(values);
            });
            return deferred.promise;
        }

        function addMetricValuesToMetric(days) {
            var promises = [];
            _.each($scope.metrics, function(metric) {
                //skip cycletime and leadtime metrics
                if (metric.handler === 'cycletime' || metric.handler === 'leadtime') {
                    return;
                }
                var promise = getMetricValues(metric, days);
                promises.push(promise);
            });
            return $q.all(promises);
        }

        $scope.prepareDataForChart = function(data) {
            var colors = ['#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#A85AFF',
                '#FF9655', '#FFF263', '#6AF9C4', '#FF5A5F'];
            var labels = [];
            _.each(data, function(metricValues) {
                _.each(metricValues, function(metricValue) {
                    var d = new Date(metricValue.created);
                    metricValue.group_date = d.toLocaleString(LANG, { month: 'numeric', day: 'numeric'});
                    labels.push(metricValue.created);
                });
            });
            labels = labels.sort();
            labels = _.map(labels, function(label) {
                var d = new Date(label);
                return d.toLocaleString(LANG, { month: 'numeric', day: 'numeric'});
            });
            labels = _.uniq(labels, true);

            var series = [];
            _.each(data, function(metricValues) {
                var metricData = createMetricData(labels, metricValues);
                series.push({name: metricValues.metric_name, data: metricData, visible: false, color: colors.shift()})
            });
            series[0].visible = true;

            $scope.chart = {};
                if (labels.length !== 0) {
                    $scope.chart = ChartConfig.charts();
                    $scope.chart.xAxis.categories = labels;

                    $scope.chart.options.tooltip = {
                        formatter: function () {
                            return '<b>' + this.x + '</b>' + ' - ' + this.y;
                        }
                    };
                    $scope.chart.options.plotOptions = {
                        series: {
                            marker: {
                                symbol: 'circle',
                                radius: 2
                            },
                            connectNulls: true
                        }
                    };
                    $scope.chart.options.chart.type = 'spline';
                    $scope.chart.size.height = 500;
                    $scope.chart.series = series;
                } else {
                    $scope.chart = [];
                }
        };

        function createMetricData(labels, metricValues) {
            //max value from one days values
            var groupValues = _.groupBy(metricValues, 'group_date');
            var metricValues = _.map(groupValues, function(groupValue) {
                return _.max(groupValue, 'id');
            });

            var data = [];
            _.each(labels, function(label) {
                var found = false;
                _.each(metricValues, function(metricValue) {
                    if(label === metricValue.group_date) {
                        found = true;
                        data.push(metricValue.value);
                        return;
                    }
                });
                if (!found) {
                    data.push(null);
                }
            });
            return data;
        }

        $('body').on('click', '.btn-group button', function (e) {
            $(this).removeClass('active');
        });
    }
]);
