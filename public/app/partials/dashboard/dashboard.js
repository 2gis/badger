'use strict';

var app = angular.module('testReport.dashboard', [
    'ngRoute',
    'testReportServices',
    'highcharts-ng'
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/dashboard', {
        templateUrl: '/static/app/partials/dashboard/main_dashboard.html',
        controller: 'MainDashboardCtrl'
    });

    $routeProvider.when('/dashboard/:projectId/', {
        templateUrl: '/static/app/partials/dashboard/dashboard.html',
        controller: 'DashboardCtrl'
    });
}]);

app.controller('MainDashboardCtrl', ['$scope', '$rootScope', 'appConfig', 'Project', 'TestPlan', 'Launch', 'HandleTestplans', 'HandleLaunches', 'GroupLaunches', 'CreateCharts',
    function ($scope, $rootScope, appConfig, Project, TestPlan, Launch, HandleTestplans, HandleLaunches, GroupLaunches, CreateCharts) {
        $scope.default_days = appConfig.DEFAULT_DAYS;

        Project.query(function (response) {
            $scope.projects = response.results;
            fetchData();
        });

        function fetchData() {
            _.each($scope.projects, function (project) {
                TestPlan.get({ projectId: project.id }, function (response) {
                    project.statistics = HandleTestplans(response.results);
                    _.each(project.statistics, function (statistic_testplan) {
                        $scope.prepareDataForChart(statistic_testplan, appConfig.DEFAULT_DAYS);
                    });
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
                var launches = HandleLaunches(testplan, response.results);
                var chartLaunches = GroupLaunches(launches, 'groupDate');

                testplan.charts = {};
                CreateCharts(testplan, chartLaunches, days);
            });
        };
    }
]);

app.controller('DashboardCtrl', ['$scope', '$rootScope', '$filter', '$routeParams', 'appConfig', 'Project', 'TestPlan', 'Launch', 'Stage', 'HandleTestplans', 'HandleLaunches', 'GroupLaunches', 'CreateCharts',
    function ($scope, $rootScope, $filter, $routeParams, appConfig, Project, TestPlan, Launch, Stage, HandleTestplans, HandleLaunches, GroupLaunches, CreateCharts) {
        $scope.projects = [];
        $rootScope.isMainDashboard = false;
        $scope.chartPercentType = 'failed';

        $rootScope.selectProject($routeParams.projectId);
        Project.get({projectId: $routeParams.projectId}, function (response) {
            $scope.project = response;
            fetchData();
        });

        function fetchData() {
            TestPlan.get({ projectId: $scope.project.id }, function (response) {
                $scope.project.statistics = HandleTestplans(response.results);
                _.each($scope.project.statistics, function (statistic_testplan) {
                    $scope.prepareDataForChart(statistic_testplan, appConfig.DEFAULT_DAYS);
                });
            });
            Stage.get({ projectId: $scope.project.id }, function (response) {
               $scope.project.stages = _.sortBy(response.results, 'weight');
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
                var launches = HandleLaunches(testplan, response.results);

                var chartLaunches = GroupLaunches(launches, 'groupDate');
                var chartLaunchesByBranch = GroupLaunches(launches, 'branch');

                testplan.charts = {};
                CreateCharts(testplan, chartLaunches, days);
                CreateCharts(testplan, chartLaunchesByBranch, days, 'branch');
            });
        };
    }
]);

app.factory('HandleTestplans', ['$rootScope', function($rootScope) {
    return function(testplans) {
        var stat_plans = [];
        _.each(testplans, function (testplan) {
            if (testplan.main === true) {
                if (testplan.hidden === false) {
                    stat_plans.push(testplan);
                } else {
                    if ($rootScope.profile && testplan.owner === $rootScope.profile.id) {
                        stat_plans.push(testplan);
                    }
                }
            }
        });
        return _.sortBy(stat_plans, 'name');
    }
}]).factory('HandleLaunches', function() {
    return function(testplan, launches) {
        _.each(launches, function(launch) {
                var d = new Date(launch.created);
                launch.groupDate = d.toLocaleDateString(LANG);
                if (typeof launch.parameters.env !== 'undefined' &&
                        typeof launch.parameters.env[testplan.variable_name] !== 'undefined') {
                    launch.branch = launch.parameters.env[testplan.variable_name];
                } else {
                    launch.branch =  'unknown_build';
                }
            });
        return launches;
    }
}).factory('UpdateStatistics', function() {
    return function(launch) {
        function getPercent(count, total) {
            if (total === 0) {
                return 100.0;
            }
            return (count / total) * 100.0;
        }

        _.extend(launch, {
            percent_of_failed: getPercent(launch.counts.failed + launch.counts.blocked, launch.counts.total),
            percent_of_skipped: getPercent(launch.counts.skipped, launch.counts.total),
            total_count: launch.counts.total
        });
        return launch;
    }
}).factory('GroupLaunches', function() {
    return function(launches, group_field) {
        return _.map(_.groupBy(launches, group_field), function (group) {
            return _.max(group, 'id');
        });
    }
}).factory('GetDataForCharts', ['UpdateStatistics', function(UpdateStatistics) {
    return function(testplan, launches, type) {
        var labels = [];
        var failed = [];
        var skipped = [];
        var total = [];

        launches = _.sortBy(launches, 'id');
        if (typeof type === 'undefined') {
            _.map(launches, function(item) {
                item = UpdateStatistics(item);
                labels.push(item.groupDate);
                failed.push({ y: item.percent_of_failed, id: item.id });
                skipped.push({ y: item.percent_of_skipped, id: item.id });
                total.push({ y: item.total_count, id: item.id });
            });
        } else {
            _.map(launches, function(item) {
                var pattern = (testplan.variable_value_regexp !== '') ?
                        new RegExp(testplan.variable_value_regexp, 'm') : /.*/;
                if (pattern.test(item.branch)) {
                    item = UpdateStatistics(item);
                    labels.push(item.branch + ' (' + item.groupDate + ')');
                    failed.push({ y: item.percent_of_failed, id: item.id });
                    skipped.push({ y: item.percent_of_skipped, id: item.id });
                    total.push({y: item.total_count, id: item.id});
                }
            });
        }
        return {labels: labels, failed: failed, skipped: skipped, total: total};
    }
}]).factory('CreateCharts', ['GetDataForCharts', 'PrepareTestConfig', 'PrepareReleaseConfig',
    function(GetDataForCharts, PrepareTestConfig, PrepareReleaseConfig) {
        return function (testplan, launches, days, type) {
            var data = GetDataForCharts(testplan, launches, type);

            if (typeof type === 'undefined') {
                if (data.labels.length !== 0) {
                    PrepareTestConfig(testplan, data, days);
                } else {
                    testplan.charts = [];
                }
            } else {
                if (data.labels.length !== 0) {
                    PrepareReleaseConfig(testplan, data, days);
                } else {
                    testplan.charts.branch = [];
                }
            }
        }
}]).factory('PrepareTestConfig', ['ChartConfig', 'appConfig', function(ChartConfig, appConfig) {
    return function(testplan, data, days) {
        testplan.charts.failed = ChartConfig.column();
        testplan.charts.failed.xAxis.categories = data.labels;
        testplan.charts.failed.series.push({
            name: '% of failure for last '.concat(days, ' days'),
            data: data.failed,
            color: appConfig.CHART_COLORS.red
        });
        testplan.charts.failed.series.push({
            name: '% of skipped for last '.concat(days, ' days'),
            data: data.skipped,
            color: appConfig.CHART_COLORS.yellow,
            visible: false
        });

        testplan.charts.total = ChartConfig.column();
        testplan.charts.total.xAxis.categories = data.labels;
        testplan.charts.total.series.push({
            name: 'Total tests count for last '.concat(days, ' days'),
            data: data.total,
            color: appConfig.CHART_COLORS.blue
        });
        testplan.charts.total.options.tooltip = {
            formatter: function () {
                return this.y;
            }
        };
    }
}]).factory('PrepareReleaseConfig', ['ChartConfig', 'appConfig', function(ChartConfig, appConfig) {
    return function(testplan, data, days) {
        testplan.charts.branch = ChartConfig.column();
        testplan.charts.branch.xAxis.categories = data.labels;
        testplan.charts.branch.series.push({
            name: '% of failure for last '.concat(days, ' days'),
            data: data.failed,
            color: appConfig.CHART_COLORS.red
        });
        testplan.charts.branch.series.push({
            name: '% of skipped for last '.concat(days, ' days'),
            data: data.skipped,
            color: appConfig.CHART_COLORS.yellow,
            visible: false
        });
        testplan.charts.branch.series.push({
            name: 'Total tests count for last '.concat(days, ' days'),
            data: data.total,
            color: appConfig.CHART_COLORS.blue,
            visible: false
        });
        testplan.charts.branch.options.tooltip = {
            formatter: function () {
                if (this.color === '#7cb5ec') {
                    return this.y;
                } else {
                    return this.y.toFixed(3) + '%';
                }
            }
        };
    }
}]);
