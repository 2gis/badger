'use strict';

var app = angular.module('testReport.metric.zoom', [
    'ngRoute',
    'testReportServices',
    'datePicker',
    'highcharts-ng'
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/project/:projectId/metric/:metricId/chart', {
        templateUrl: '/static/app/partials/metric/zoom/zoom.html',
        controller: 'MetricZoomCtrl'
    });
    $routeProvider.when('/project/:projectId/metric/:metricId/chart/state', {
        templateUrl: '/static/app/partials/metric/zoom/zoom_state.html',
        controller: 'MetricZoomCtrl'
    });
}]);

app.controller('MetricZoomCtrl', ['$scope', '$rootScope', '$routeParams', 'appConfig', 'Metric', 'MetricValue', 'Calculate', 'ChartConfig', 'Periods',
    function ($scope, $rootScope, $routeParams, appConfig, Metric, MetricValue, Calculate, ChartConfig, Periods) {
        if(!$rootScope.getActiveProject()) {
            $rootScope.selectProject($routeParams.projectId);
        }
        $scope.activeProjectId = $rootScope.getActiveProject();

        $scope.getDateMonthBack = function () {
            var dt = new Date();
            dt.setMonth(dt.getMonth()-1);
            return dt;
        };

        $scope.range = {};
        $scope.range.from = $scope.getDateMonthBack();
        $scope.range.to = new Date();
        $scope.dateList = Periods.period_list();

        if ($routeParams.metricId) {
            $scope.dates = _.map($scope.dateList, function (num, key) {
                return key;
            });
            Metric.get({ metricId: $routeParams.metricId }, function (response) {
                $scope.metric = response;
                $scope.prepareDataForChart($scope.metric, $scope.range.from, $scope.range.to);
            });
        }

        function pushDataToChart(values, stat_name, color, chart_type, zindex, dates) {
            var arr = [];
            for (var i = 0; i < values.length; i++) {
                if (stat_name === 'deviation') {
                    arr.push([dates[i], $scope.metric.stat['deviation1'], $scope.metric.stat['deviation2']]);
                } else {
                    arr.push($scope.metric.stat[stat_name]);
                }
            }
            $scope.metric.chart.series.push({
                name: stat_name,
                data: arr,
                color: color,
                dashStyle: 'ShortDot',
                type: chart_type,
                zIndex: zindex,
                turboThreshold: 0
            });
        }

        function calculate_stat(values) {
            var stat = {};
            if (values.length === 0) {
                stat.min = 0; stat.max = 0; stat.average = 0; stat.median = 0;
                return stat;
            }

            stat.min = _.min(values);
            stat.max = _.max(values);
            stat.average = Math.floor(_.reduce(values, function(memo, num){ return memo + num; }, 0) / values.length);
            stat.median = Calculate.median(values);

            var stdDev = Calculate.deviation(values);
            stat.deviation1 = stat.average - stdDev;
            stat.deviation2 = stat.average + stdDev;
            return stat;
        }

        function dateFormat(date) {
            return date.toISOString().substring(0, 10);
        }

        $scope.prepareDataForChart = function(metric, from, to, days) {
            if (from > to) {
                $scope.range.to = new Date();
                to = new Date();
            }


            var fields = {'metric_id': metric.id, from: dateFormat(from), to: dateFormat(to), page_size: 9999};
            if (typeof days !== 'undefined') {
                fields = {'metric_id': metric.id, days: $scope.dateList[days], page_size: 9999};
            }

            MetricValue.custom_list(fields, function (response) {
                var dates = [];
                var values= [];

                var metricValues = _.sortBy(response.results, 'created');

                _.each(metricValues, function (metricValue) {
                    var d = new Date(metricValue.created);
                    dates.push(d.toLocaleString(LANG, { month: 'numeric', day: 'numeric'}));
                    values.push(metricValue.value)
                });

                // temporarily comment this lines, because highcharts can group points
                //var approx = Calculate.approximate(dates, values, 30, metric.handler);
                //dates = approx[0];
                //values = approx[1];

                metric.chart = {};
                if (dates.length !== 0) {
                    metric.chart = ChartConfig.zoom();
                    metric.chart.xAxis.categories = dates;
                    metric.chart.series.push({
                        name: 'metric value',
                        data: values,
                        zIndex: 2,
                        color: appConfig.CHART_COLORS.blue
                    });
                } else {
                    metric.chart = [];
                }

                metric.isEdit = false;
                metric.stat = calculate_stat(values);
                pushDataToChart(values, 'average', appConfig.CHART_COLORS.red, 'spline', 1);
                pushDataToChart(values, 'median', appConfig.CHART_COLORS.yellow, 'spline', 1);
                pushDataToChart(values, 'deviation', appConfig.CHART_COLORS.grey, 'arearange', 0, dates);

                if (metric.handler === 'cycletime' || metric.handler === 'leadtime') {
                    _.each(metric.stat, function (stat, key) {
                        metric.stat[key] = secondsToString(stat, true);
                    });
                    metric.chart.options.tooltip = {
                        formatter: function() {
                            return '<b>' + this.x + '</b>' + ' - ' + secondsToString(this.y);
                        }
                    };
                    metric.chart.yAxis.labels = {
                        formatter: function () {
                            return secondsToString(this.value, true);
                        }
                    };
                }
            });
        };
        $('body').on('click', '.btn-group button', function (e) {
            $(this).removeClass('active');
        });
    }
]);
