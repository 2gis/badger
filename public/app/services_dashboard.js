'use strict';

var servicesDashboard = angular.module('testReportServicesDashboard', ['ngResource']);

servicesDashboard.factory('Filters', ['$rootScope', function ($rootScope) {
    return {
        isMain: isMain,
        removeHidden: removeHidden
    };

    function isMain(item) {
        return item.main === true;
    }

    function removeHidden(item) {
        if ($rootScope.profile) {
            return item.hidden === false || item.owner === $rootScope.profile.id;
        }
        return item.hidden === false;
    }
}]).factory('LaunchHelpers', function() {
    return {
        cutDate: cutDate,
        addDuration: addDuration,
        addEnvVariable: addEnvVariable,
        addStatisticData: addStatisticData
    };

    function cutDate(launches, options) {
        _.each(launches, function (launch) {
            var d = new Date(launch.created);
            if (options) {
                launch.groupDate = d.toLocaleDateString(LANG, options);
            } else {
                launch.groupDate = d.toLocaleDateString(LANG);
            }
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

    function addDuration(launches) {
        _.each(launches, function(launch) {
            launch.duration = launch.duration ? parseInt(launch.duration / 60) :
                                parseInt((Date.parse(launch.finished) - Date.parse(launch.created)) / (1000 * 60));
        });
        return launches;
    }

    function addStatisticData(launches) {
        function getPercent(count, total) {
            if (total === 0) {
                return 0.0;
            }
            return (count / total) * 100.0;
        }

        _.each(launches, function(launch) {
            _.extend(launch, {
                percents: {
                    failed: getPercent(launch.counts.failed, launch.counts.total),
                    blocked: getPercent(launch.counts.blocked, launch.counts.total),
                    skipped: getPercent(launch.counts.skipped, launch.counts.total),
                    passed: getPercent(launch.counts.passed, launch.counts.total),
                    total: launch.counts.total
                }
            });
        });

        return launches;
    }
}).factory('LaunchFilters', function() {
    return {
        byDate: byDate,
        byEnvVar: byEnvVar,
        byRegExp: byRegExp,
        isEmptyResults: isEmptyResults
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

    function isEmptyResults(launch) {
        return launch.counts.total !== 0;
    }

}).factory('GetChartsData', function() {
    return {
        series: series,
        labels: labels
    };

    function series(launches) {
        var failed = [];
        var skipped = [];
        var passed = [];
        var total = [];
        var duration = [];

        function clearArrays() {
            failed = [];
            skipped = [];
            passed = [];
            total = [];
        }

        function fillArrays(object, id) {
            failed.push({ y: object.failed + object.blocked, id: id });
            skipped.push({ y: object.skipped, id: id });
            passed.push({ y: object.passed, id: id });
            total.push({ y: object.total, id: id });
        }

        var result = {};
        _.each(launches, function(launch) {
            fillArrays(launch.percents, launch.id);
        });
        result.percents = { failed: failed, skipped: skipped, passed: passed, total: total };

        clearArrays();
        _.each(launches, function(launch) {
            fillArrays(launch.counts, launch.id);
        });
        result.absolute = { failed: failed, skipped: skipped, passed: passed, total: total };

        _.each(launches, function(launch) {
            duration.push({ y: launch.duration, id: launch.id });
        });
        result.duration = duration;

        return result;
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
        getPercent: getPercent,
        getAbsolute: getAbsolute,
        getTotal: getTotal,
        getDuration: getDuration,
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
            color: appConfig.CHART_COLORS.yellow
        };
    }

    function passedStruct(data) {
        return {
            name: '% of passed',
            data: data,
            color: appConfig.CHART_COLORS.green
        };
    }

    function totalStruct(data) {
        return {
            name: 'total tests count',
            data: data,
            color: appConfig.CHART_COLORS.blue
        };
    }

    function durationStruct(data) {
        return {
            name: 'duration',
            data: data,
            color: appConfig.CHART_COLORS.green
        };
    }

    function getFailedAndSkipped(array_of_failed, array_of_skipped) {
        return [ failedStruct(array_of_failed), skippedStruct(array_of_skipped)];
    }

    function getPercent(array_of_failed, array_of_skipped, array_of_passed) {
        return [ failedStruct(array_of_failed), skippedStruct(array_of_skipped), passedStruct(array_of_passed)];
    }

    function getAbsolute(array_of_failed, array_of_skipped, array_of_passed) {
        var failed = failedStruct(array_of_failed);
        failed.name = 'failed tests count';
        var skipped = skippedStruct(array_of_skipped);
        skipped.name = 'skipped tests count';
        var passed = passedStruct(array_of_passed);
        passed.name = 'passed tests count';
        return [failed, skipped, passed];
    }

    function getTotal(array_of_total) {
        return [ totalStruct(array_of_total) ];
    }

    function getDuration(array_of_duration) {
        return [ durationStruct(array_of_duration) ];
    }

    function getAll(array_of_failed, array_of_skipped, array_of_total) {
        var total =  totalStruct(array_of_total);
        total.visible = false;
        return [failedStruct(array_of_failed), skippedStruct(array_of_skipped), total];
    }

}]).factory('Tooltips', function() {
    return {
        total: total,
        duration: duration,
        envVar: envVar,
        areaPercent: AreaPercent,
        areaAbsolute: AreaAbsolute
    };

    function total() {
        return {
            formatter: function () {
                return this.y;
            }
        }
    }

    function duration() {
        return {
            formatter: function () {
                return this.y + 'min';
            }
        }
    }

    function envVar() {
        return {
            formatter: function () {
                if (this.color === '#7cb5ec') {
                    return this.y;
                } else {
                    return Math.round(this.y * 1000) / 1000 + '%';
                }
            }
        }
    }

    function AreaPercent() {
        return {
            formatter: function () {
                var s = '<b>' + this.x + '</b>';
                _.each(this.points, function (point) {
                    s += '<br/><span style="color:'+ point.series.color +'">\u25CF</span> '
                        + Math.round(point.y * 1000) / 1000 + '%';
                });
                return s;
            },
            shared: true
        }
    }

    function AreaAbsolute() {
        return {
            formatter: function () {
                var s = '<b>' + this.x + '</b>';
                _.each(this.points, function (point) {
                    s += '<br/><span style="color:'+ point.series.color +'">\u25CF</span> ' + point.y;
                });
                return s;
            },
            shared: true
        }
    }

}).factory('GetChartStructure', ['ChartConfig', function(ChartConfig) {
    return function(chart_type, labels, series, tooltip) {
        var chart = {};
        switch (chart_type) {
            case 'column':
                chart = ChartConfig.column();
                break;
            case 'area_percent':
                chart = ChartConfig.area();
                break;
            case 'area_absolute':
                chart = ChartConfig.area();
                chart.options.plotOptions.area.stacking = 'normal';
                break;
            default:
                chart = ChartConfig.column();
                break;
        }
        chart.xAxis.categories = labels;
        chart.series = series;
        if (tooltip) {
            chart.options.tooltip = tooltip;
        }
        return chart;
    }
}]);

