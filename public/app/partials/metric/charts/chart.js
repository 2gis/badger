'use strict';

var app = angular.module('testReport.metric.charts', [
    'ngRoute',
    'testReportServices',
    'testReportFilters'
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/project/:projectId/metric/charts', {
        templateUrl: '/static/app/partials/metric/charts/chart.html',
        controller: 'MetricChartCtrl'
    });
}]);

app.controller('MetricChartCtrl', ['$scope', '$rootScope', '$filter', '$routeParams', 'appConfig', 'Project', 'Metric', 'MetricValue', 'Calculate', 'Periods', 'ChartConfig',
    function ($scope, $rootScope, $filter, $routeParams, appConfig, Project, Metric, MetricValue, Calculate, Periods, ChartConfig) {
        if(!$rootScope.getActiveProject()) {
            $rootScope.selectProject($routeParams.projectId);
        }

        $scope.default_days = Periods.default_period();
        $scope.dateList = Periods.period_list();

        if ($routeParams.projectId) {
            $scope.projectId = $routeParams.projectId;
            Project.get({projectId: $routeParams.projectId}, function (response) {
                $scope.project = response;
                $scope.dates = _.map($scope.dateList, function (num, key) {
                    return key;
                });
                fetchData();
            });
        }

        function fetchData() {
            $scope.project.metrics = [];
            Metric.get({ project: $scope.project.id }, function (response) {
                $scope.project.metrics = _.sortBy(response.results, 'weight');
                _.each($scope.project.metrics, function(metric) {
                    $scope.prepareDataForChart(metric, $scope.default_days);
                });
            });
        }

        function calculate_stat(values) {
            var stat = {};
            stat.min = _.min(values);
            stat.max = _.max(values);
            stat.average = Math.floor(_.reduce(values, function(memo, num){ return memo + num; }, 0) / values.length);
            stat.median = Calculate.median(values);
            return stat;
        }

        $scope.prepareDataForChart = function(metric, days) {
            metric.days = $scope.dateList[days];
            MetricValue.custom_list({'metric_id': metric.id, days: $scope.dateList[days], page_size: 9999}, function (response) {
                var dates = [];
                var values= [];

                var metricValues = _.sortBy(response.results, 'created');
                if (metricValues.length !== 0) {
                    metric.lastValue = metricValues[metricValues.length - 1].value;
                    metric.lastDate = metricValues[metricValues.length - 1].created;
                }

                _.each(metricValues, function (metricValue) {
                    var d = new Date(metricValue.created);
                    dates.push(d.toLocaleString(LANG, { month: 'numeric', day: 'numeric'}));
                    values.push(metricValue.value);
                });

                // temporarily comment this lines, because highcharts can group points
                //var approx = Calculate.approximate(dates, values, 20, metric.handler);
                //dates = approx[0];
                //values = approx[1];

                metric.chart = {};
                if (dates.length !== 0) {
                    metric.chart = ChartConfig.charts();
                    metric.chart.xAxis.categories = dates;
                    metric.chart.yAxis.labels = {
                        formatter: function() {
                            if (metric.handler === 'cycletime' || metric.handler === 'leadtime') {
                                return secondsToString(this.value, true);
                            }
                            return this.value;
                        }
                    };
                    metric.chart.options.tooltip = {
                        formatter: function () {
                            if (metric.handler === 'cycletime' || metric.handler === 'leadtime') {
                                return '<b>' + this.x + '</b>' + ' - ' + secondsToString(this.y, true);
                            }
                            return '<b>' + this.x + '</b>' + ' - ' + this.y;
                        }
                    };
                    metric.chart.series.push({
                        data: values,
                        marker: {
                            symbol: 'circle',
                            radius: 3
                        },
                        showInLegend: false,
                        fillOpacity: 0.3,
                        animation: false,
                        color: '#7CB5EC'
                    });
                } else {
                    metric.chart = [];
                }

                metric.stat = calculate_stat(values);
                if (metric.handler === 'cycletime' || metric.handler === 'leadtime') {
                    _.each(metric.stat, function(stat, key) {
                        metric.stat[key] = secondsToString(stat, true);
                    });
                    metric.lastValue = secondsToString(metric.lastValue);
                }
            });
        };
    }
]);
