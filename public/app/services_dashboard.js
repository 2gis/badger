'use strict';

var servicesDashboard = angular.module('testReportServicesDashboard', ['ngResource']);

servicesDashboard.factory('Filters', ['$rootScope', function ($rootScope) {
    return {
        showOnDashboard: showOnDashboard,
        removeHidden: removeHidden
    };

    function showOnDashboard(item) {
        return item.main === true;
    }

    function removeHidden(item) {
        if ($rootScope.profile) {
            return item.hidden === false || item.owner === $rootScope.profile.id;
        }
        return item.hidden === false;
    }
}]).factory('UpdateLaunches', function() {
    return {
        cutDate: cutDate,
        addEnvVariable: addEnvVariable,
        addStatisticData: addStatisticData
    };

    function cutDate(launches) {
        _.each(launches, function (launch) {
            var d = new Date(launch.created);
            launch.groupDate = d.toLocaleDateString(LANG);
        });
        return launches;
    }

    function addEnvVariable(launches, env_variable) {
        _.each(launches, function(launch) {
            launch.env_var = (launch.parameters.env && launch.parameters.env[env_variable]) ?
                launch.parameters.env[env_variable] : 'unknown_build';
        });
        return launches;
    }

    function addStatisticData(launches) {
        function getPercent(count, total) {
            if (total === 0) {
                return 100.0;
            }
            return (count / total) * 100.0;
        }

        _.each(launches, function(launch) {
            _.extend(launch, {
                percent_of_failed: getPercent(launch.counts.failed + launch.counts.blocked, launch.counts.total),
                percent_of_skipped: getPercent(launch.counts.skipped, launch.counts.total),
                total_count: launch.counts.total
            });
        });

        return launches;
    }

}).factory('FilterLaunches', function() {
    return {
        byDate: byDate,
        byEnvVar: byEnvVar,
        byRegExp: byRegExp
    };

    function byDate(launches) {
        return _.map(_.groupBy(launches, 'groupDate'), function (group) {
            return _.max(group, 'id');
        });
    }

    function byEnvVar(launches) {
        return _.map(_.groupBy(launches, 'env_var'), function (group) {
            return _.max(group, 'id');
        });
    }

    function byRegExp(launches, pattern) {
        pattern = (pattern !== '') ? new RegExp(pattern, 'm') : /.*/;
        return _.filter(launches, function(launch) {
            return pattern.test(launch.env_var);
        });
    }

}).factory('GetChartsData', function() {
    return {
        series: series,
        labels: labels
    };

    function series(launches) {
        var failed = [];
        var skipped = [];
        var total = [];

        _.each(launches, function(launch) {
            failed.push({ y: launch.percent_of_failed, id: launch.id });
            skipped.push({ y: launch.percent_of_skipped, id: launch.id });
            total.push({ y: launch.total_count, id: launch.id });
        });

        return {failed: failed, skipped: skipped, total: total};
    }

    function labels(launches, extended) {
        var labels = [];

        _.each(launches, function(launch) {
            if (extended) {
                labels.push(launch.env_var + ' (' + launch.groupDate + ')');
            } else {
                labels.push(launch.groupDate);
            }
        });

        return labels;
    }

}).factory('SeriesStructure', ['appConfig', function(appConfig) {
    return {
        getFailedAndSkipped: getFailedAndSkipped,
        getTotal: getTotal,
        getAll: getAll
    };

    function failedStruct(data) {
        return {
            name: '% of failure',
            data: data,
            color: appConfig.CHART_COLORS.red
        };
    }

    function skippedStruct(data) {
        return {
            name: '% of skipped',
            data: data,
            color: appConfig.CHART_COLORS.yellow,
            visible: false
        };
    }

    function totalStruct(data) {
        return {
            name: 'total tests count',
            data: data,
            color: appConfig.CHART_COLORS.blue
        };
    }

    function getFailedAndSkipped(array_of_failed, array_of_skipped) {
        return [ failedStruct(array_of_failed), skippedStruct(array_of_skipped) ];
    }

    function getTotal(array_of_total) {
        return [ totalStruct(array_of_total) ];
    }

    function getAll(array_of_failed, array_of_skipped, array_of_total) {
        var total =  totalStruct(array_of_total);
        total.visible = false;
        return [failedStruct(array_of_failed), skippedStruct(array_of_skipped), total];
    }

}]).factory('Tooltips', function() {
    return {
        total: total,
        envVar: envVar
    };

    function total() {
        return {
            formatter: function () {
                return this.y;
            }
        }
    }

    function envVar() {
        return {
            formatter: function () {
                if (this.color === '#7cb5ec') {
                    return this.y;
                } else {
                    return this.y.toFixed(3) + '%';
                }
            }
        }
    }

}).factory('GetChartStructure', ['ChartConfig', function(ChartConfig) {
    return function(labels, series, tooltip) {
        var chart = ChartConfig.column();
        chart.xAxis.categories = labels;
        chart.series = series;
        if (tooltip) {
            chart.options.tooltip = tooltip;
        }
        return chart;
    }
}]);

