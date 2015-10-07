'use strict';

var app = angular.module('testReport.dashboard', [
    'ngRoute',
    'testReportServices',
    'highcharts-ng'
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/dashboard', {
        templateUrl: '/static/app/partials/dashboard/dashboard.html',
        controller: 'DashboardCtrl',
        label: 'Dashboard'
    });

    $routeProvider.when('/dashboard/:projectId/', {
        templateUrl: '/static/app/partials/dashboard/dashboard.html',
        controller: 'DashboardCtrl',
        label: 'Dashboard'
    });
}]);

app.controller('DashboardCtrl', ['$scope', '$rootScope', '$filter', '$routeParams', 'appConfig', 'Project', 'TestPlan', 'Launch', 'Stage', 'ChartConfig',
    function ($scope, $rootScope, $filter, $routeParams, appConfig, Project, TestPlan, Launch, Stage, ChartConfig) {
        $scope.projects = [];
        $rootScope.isMainDashboard = false;
        $scope.chartPercentType = 'failed';

        if ($routeParams.projectId) {
            $rootScope.selectProject($routeParams.projectId);
            Project.get({projectId: $routeParams.projectId}, function (response) {
                $scope.projects.push(response);
                fetchData();
                $rootScope.isMainDashboard = false;
            });
        } else {
            $rootScope.selectProject();
            Project.query(function (response) {
                $scope.projects = response.results;
                fetchData();
                $rootScope.isMainDashboard = true;
            });
        }

        function getPercent(count, total) {
            if (total === 0) {
                return 100.0;
            }

            return (count / total) * 100.0;
        }

        function updateStatistics(launch) {
            angular.extend(launch, {
                percent_of_failed: getPercent(launch.counts.failed + launch.counts.blocked, launch.counts.total),
                percent_of_skipped: getPercent(launch.counts.skipped, launch.counts.total),
                count_of_failed: launch.counts.failed,
                total_count: launch.counts.total
            });
            return launch;
        }

        function fetchData() {
            _.each($scope.projects, function (project) {
                project.main = false;
                project.testplans = [];
                project.statistics = [];
                TestPlan.get({ projectId: project.id }, function (response) {
                    _.each(response.results, function (testplan) {
                        if (testplan.hidden === false) {
                            if (testplan.main === true) {
                                project.statistics.push(testplan);
                                project.main = true;
                            }
                            project.testplans.push(testplan);
                        } else {
                            if ($rootScope.profile && testplan.owner === $rootScope.profile.id) {
                                if (testplan.main === true) {
                                    project.statistics.push(testplan);
                                    project.main = true;
                                }
                                project.testplans.push(testplan);
                            }
                        }
                    });
                    project.statistics = _.sortBy(project.statistics, 'name');
                    _.each(project.statistics, function (statistic_testplan) {
                        $scope.prepareDataForChart(statistic_testplan, appConfig.DEFAULT_DAYS);
                    });
                });
                Stage.get({ projectId: project.id }, function (response) {
                   project.stages = _.sortBy(response.results, 'weight');
                });
            });
        }

        $scope.prepareDataForChart = function(testplan, days) {
            testplan.days = days;
            Launch.custom_list({
                testPlanId: testplan.id,
                state: appConfig.LAUNCH_STATE_FINISHED,
                days: days,
                search: testplan.filter
            }, function (response) {
                var launches = response.results;

                _.each(launches, function(item) {
                    var d = new Date(item.created);
                    item.groupDate = d.toLocaleDateString(LANG);
                });

                var chartLaunches = _.map(_.groupBy(launches, 'groupDate'), function (group) {
                    return _.max(group, 'id');
                });

                var labels = [];
                var failed = [];
                var skipped = [];
                var total = [];

                chartLaunches = _.sortBy(chartLaunches, 'id');
                _.map(chartLaunches, function(item) {
                    item = updateStatistics(item);
                    labels.push(item.groupDate);
                    failed.push({ y: item.percent_of_failed, id: item.id });
                    skipped.push({ y: item.percent_of_skipped, id: item.id });
                    total.push({ y: item.total_count, id: item.id });
                });

                testplan.charts = {};
                if (labels.length !== 0) {
                    testplan.charts.failed = ChartConfig.column();
                    testplan.charts.failed.xAxis.categories = labels;
                    testplan.charts.failed.series.push({
                        name: '% of failure for last '.concat(days, ' days'),
                        data: failed,
                        color: appConfig.CHART_COLORS.red
                    });

                    testplan.charts.skipped = ChartConfig.column();
                    testplan.charts.skipped.xAxis.categories = labels;
                    testplan.charts.skipped.series.push({
                        name: '% of skipped for last '.concat(days, ' days'),
                        data: skipped,
                        color: appConfig.CHART_COLORS.yellow
                    });

                    testplan.charts.total = ChartConfig.column();
                    testplan.charts.total.xAxis.categories = labels;
                    testplan.charts.total.series.push({
                        name: 'Total tests count for last '.concat(days, ' days'),
                        data: total,
                        color: appConfig.CHART_COLORS.blue
                    });
                    testplan.charts.total.options.tooltip = {
                        formatter: function() {
                            return this.y;
                        }
                    };
                } else {
                    testplan.charts = [];
                };
            });
        }
    }
]);
