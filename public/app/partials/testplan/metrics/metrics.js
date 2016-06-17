'use strict';

var app = angular.module('testReport.testPlan.metrics', [
    'ngRoute',
    'ngCookies',
    'testReportServices'
]);

app.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.when('/testplan/:testPlanId/metrics',{
            templateUrl: '/static/app/partials/testplan/metrics/metrics.html',
            controller: 'TestPlanMetrics'
        });
    }
]);

app.controller('TestPlanMetrics', ['$rootScope', '$scope', '$q', '$window', '$location', '$routeParams', '$filter',
    'ngTableParams', 'appConfig', 'TestPlan', 'Launch', 'LaunchItem', 'SortLaunchItems', 'Comment', 'ChartConfig',
    'GetChartsData', 'SeriesStructure', 'Tooltips', 'LaunchHelpers', 'GetChartStructure',
    function ($rootScope, $scope, $q, $window, $location, $routeParams, $filter,
              ngTableParams, appConfig, TestPlan, Launch, LaunchItem, SortLaunchItems, Comment, ChartConfig,
              GetChartsData, SeriesStructure, Tooltips, LaunchHelpers, GetChartStructure) {

        $rootScope.isMainDashboard = false;
        var defaultCountOfLaunches = 10;

        var options = {
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        };

        TestPlan.get({'testPlanId': $routeParams.testPlanId}, function (result) {
            $scope.projectId = result.project;
            $scope.testPlanId = $routeParams.testPlanId;
            $rootScope.selectProject(result.project);
            $scope.testplan = result;
            $scope.name = result.name;
            $rootScope.getProjectSettings(result.project, 'chart_type').then(function(type) {
                $scope.drawTable(defaultCountOfLaunches);
            });
        });

        function getPercent(count, total) {
            if (total === 0) {
                return 100.0;
            }

            return (count / total) * 100.0;
        }

        function updateStats(item) {
            _.extend(item, {
                percent_of_failed: getPercent(item.counts.failed + item.counts.blocked, item.counts.total),
                percent_of_skipped: getPercent(item.counts.skipped, item.counts.total)
            });

            if (item.state === appConfig.LAUNCH_STATE_FINISHED &&
                    item.counts.blocked === 0 && item.counts.failed === 0 && item.counts.passed !== 0) {
                item.state = appConfig.LAUNCH_STATE_SUCCESS;
            }

            return item;
        }

        $scope.drawTable = function(count) {
            Launch.get({
                testPlanId: $routeParams.testPlanId,
                pageSize: count,
                ordering: '-created'
            }, function (result) {
                var tableData = result.results.map(updateStats);

                $scope.charts = [];

                tableData = LaunchHelpers.cutDate(tableData, options);
                tableData = LaunchHelpers.addDuration(tableData);
                tableData = LaunchHelpers.addStatisticData(tableData);
                tableData = _.sortBy(tableData, 'id');
                var seriesData = GetChartsData.series(tableData);
                var labels = GetChartsData.labels(tableData);

                _.each(seriesData.metrics, function(metric, name) {
                    var metrics = {};
                    metrics[name] = metric;
                    $scope.charts.push(
                        GetChartStructure(
                            'line',
                            labels,
                            SeriesStructure.getMetrics(metrics)
                        ));
                });

                _.each($scope.charts, function(chart) {
                    chart.size.height = 270;
                    chart.options.plotOptions.series.connectNulls = true;

                    chart.options.plotOptions.series.point = {
                        events: {
                            click: function () {
                                if (isUrl(this.started_by)) {
                                    $window.open(this.started_by);
                                } else {
                                    $rootScope.$apply($location.path('/launch/' + this.id));
                                }
                            }
                        }
                    };
                    chart.options.legend = {
                        align: 'center',
                        verticalAlign: 'top',
                        borderWidth: 0,
                        itemStyle: {
                            fontSize:'15px'
                        }
                    };
                    chart.xAxis.plotBands = [];
                    for (var i = 0; i < chart.series[0].data.length; i++) {
                        if (chart.series[0].data[i].y == null) {
                            chart.xAxis.plotBands.push({
                                from: i - 1,
                                to: i + 1,
                                color: '#f7f5ef'
                            });
                        }
                    }
                });
            });
        }
    }
]);