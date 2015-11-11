'use strict';

var common = angular.module('testReportCommon', ['ngResource']);

common.factory('HandleTestplans', ['$rootScope', function($rootScope) {
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
    return function(testplan, launches, regexp) {
        function pushCommonData(item) {
            item = UpdateStatistics(item);
            failed.push({ y: item.percent_of_failed, id: item.id });
            skipped.push({ y: item.percent_of_skipped, id: item.id });
            total.push({ y: item.total_count, id: item.id });
        }
        function pushData(item) {
            pushCommonData(item);
            labels.push(item.groupDate);
        }
        function pushDataRegexp(item) {
            var pattern = (testplan.variable_value_regexp !== '') ? new RegExp(testplan.variable_value_regexp, 'm') : /.*/;
            if (pattern.test(item.branch)) {
                pushCommonData(item);
                labels.push(item.branch + ' (' + item.groupDate + ')');
            }
        }

        var labels = [];
        var failed = [];
        var skipped = [];
        var total = [];

        launches = _.sortBy(launches, 'id');
        if (regexp) {
            _.map(launches, pushDataRegexp);
        } else {
            _.map(launches, pushData);
        }
        return {labels: labels, failed: failed, skipped: skipped, total: total};
    }
}]).factory('CreateTestChart', ['GetDataForCharts', 'PrepareTestConfig',
    function(GetDataForCharts, PrepareTestConfig) {
        return function (testplan, launches, days) {
            var data = GetDataForCharts(testplan, launches);
            if (data.labels.length !== 0) {
                PrepareTestConfig(testplan, data, days);
            } else {
                testplan.charts = [];
            }
        }
}]).factory('CreateReleaseChart', ['GetDataForCharts', 'PrepareReleaseConfig',
    function(GetDataForCharts, PrepareReleaseConfig) {
        return function (testplan, launches, days) {
            var data = GetDataForCharts(testplan, launches, true);
            if (data.labels.length !== 0) {
                PrepareReleaseConfig(testplan, data, days);
            } else {
                testplan.charts.branch = [];
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