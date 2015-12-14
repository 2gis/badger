'use strict';

var services = angular.module('testReportServices', ['ngResource']);

var API_PATH = location.protocol + "//" + BACKEND_URL;

services.factory('Project', ['$resource',
    function ($resource) {
        return $resource(API_PATH + 'projects/:projectId', {}, {
            query: { method: 'GET' }
        });
    }
]).factory('TestPlan', ['$resource',
    function ($resource) {
        return $resource(API_PATH + 'testplans/:testPlanId/:actionName/?project=:projectId&project_id__in=:projectsIds', {}, {
            get: {method:'GET'},
            custom_list: {
                method:'GET',
                params: {
                    actionName: 'custom_list'
                }
            },
            execute: {
                method: 'POST',
                params: {
                    actionName: 'execute'
                }
            },
            save: {
                method: 'POST'
            },
            update: {method:'PATCH'},
            delete: {method:'DELETE'}
        });
    }
]).factory('TestResult', ['$resource',
    function ($resource) {
        return $resource(API_PATH + 'testresults/:testResultId/:actionName/?launch=:launchId&ordering=:ordering&page=:page&page_size=:pageSize&state=:state&search=:search', {}, {
            get: {method: 'GET'},
            custom_list: {
                method: 'GET',
                params: {
                    actionName: 'custom_list'
                }
            }
        });
    }
]).factory('Launch', ['$resource',
    function ($resource) {
        return $resource(API_PATH + 'launches/:launchId/:actionName/?test_plan=:testPlanId&ordering=:ordering&page=:page&page_size=:pageSize&state=:state&search=:search', {
            page: 1,
            pageSize: 9999
        }, {
            get: {method: 'GET'},
            custom_list: {
                method: 'GET',
                params: {
                    actionName: 'custom_list'
                }
            },
            terminate_tasks: {
                method: 'GET',
                params: {
                    actionName: 'terminate_tasks'
                }
            }
        });
    }
]).factory('LaunchItem', ['$resource',
    function ($resource) {
        return $resource(API_PATH + 'launch-items/:itemId/?test_plan=:testPlanId&ordering=:ordering&type=:type', {}, {
            get:    {method:'GET'},
            save:   {method:'POST'},
            update: {method:'PATCH'},
            query:  {method:'GET', isArray:true},
            delete: {method:'DELETE'}
        });
    }
]).factory('Comment', ['$resource',
    function ($resource) {
        return $resource(API_PATH + 'comments/:commentId/?ordering=:ordering&page=:page&page_size=:pageSize', {
            page: 1,
            pageSize: 9999
        }, {
            save: {
                method: 'POST'
            }
        });
    }
]).factory('Task', ['$resource',
    function ($resource) {
        return $resource(API_PATH + 'tasks/:taskId/:actionName', {}, {
            terminate: {
                method: 'GET',
                params: {
                    actionName: 'terminate/'
                }
            }
        });
    }
]).factory('Bug', ['$resource',
    function ($resource) {
        return $resource(API_PATH + 'bugs/:bugId/', {}, {
            save: {
                method: 'POST'
            }
        });
    }
]).factory('Auth', ['$resource',
    function ($resource) {
        return {
            api: $resource(API_PATH + 'auth/:actionName/', {}, {
                login: {
                    method: 'POST',
                    params: {
                        actionName: 'login'
                    }
                },
                logout: {
                    method: 'GET',
                    params: {
                        actionName: 'logout'
                    }
                },
                get_current: {
                    method: 'GET',
                    params: {
                        actionName: 'get'
                    }
                },
                update: {
                    method: 'POST',
                    params: {
                        actionName: 'update'
                    }
                }
            })
        }
    }
]).factory('Stage', ['$resource',
    function ($resource) {
        return $resource(API_PATH + 'stages/?project=:projectId', {}, {
            query: { method: 'GET' }
        });
    }
]).factory('Metric', ['$resource',
    function ($resource) {
        return $resource(API_PATH + 'metrics/:metricId/', {}, {
            get: {method: 'GET'},
            save: {
                method: 'POST'
            },
            update: {method:'PATCH'},
            delete: {method:'DELETE'}
        });
    }
]).factory('MetricValue', ['$resource',
    function ($resource) {
        return $resource(API_PATH + 'metricvalues/:actionName/?metric_id=:metricId', {}, {
            query: { method: 'GET' },
            custom_list: {
                method: 'GET',
                params: {
                    actionName: 'custom_list'
                }
            },
        });
    }
]).factory('SortLaunchItems', function() {
    return {
        byType: function (results) {
            var deploy = _.sortBy(_.filter(results, function(item) { return item.type === 1 }), 'name');
            var regular = _.sortBy(_.filter(results, function(item) { return item.type === 0 }), 'name');
            var conclusive = _.sortBy(_.filter(results, function(item) { return item.type === 2 }), 'name');

            return deploy.concat(regular, conclusive);
        }
    }
}).factory('Calculate', function() {
    return {
        median: function (values) {
            var res = values.slice().sort(function (a, b) {
                return a - b;
            });
            var half = Math.floor(res.length / 2);
            if (res.length % 2)
                return res[half];
            else
                return (res[half - 1] + res[half]) / 2.0;
        },
        deviation: function(values) {
            var avg = _.reduce(values, function(sum, value){ return sum + value; }, 0) / values.length;
            var squareDiffs = values.map(function(value){
                var diff = value - avg;
                var sqrDiff = diff * diff;
                return sqrDiff;
            });

            var avgSquareDiff = _.reduce(squareDiffs, function(sum, value){ return sum + value; }, 0) / squareDiffs.length;
            var stdDev = Math.sqrt(avgSquareDiff);
            return Math.floor(stdDev);
        },
        approximate: function(dates, values, maxPoints, handler) {
            var step = Math.round(values.length/maxPoints);
            if (step === 0 || step === 1) {
                return [dates, values];
            }

            var sum = function (a, b) {
                return a + b;
            };

            var array_sum = function (values_list) {
                return _.reduce(values_list, sum, 0);
            };

            var average = function (values_list) {
                return Math.floor(
                    array_sum(values_list) / values_list.length);
            };

            var splitBy = function (values, count) {
                var output = [];
                while (values.length !== 0) {
                    output.push(values.splice(0, count));
                }
                return output;
            };

            if (['cycletime', 'leadtime'].indexOf(handler) > -1) {
                return [_.map(splitBy(dates, step), _.last),
                    _.map(splitBy(values, step), average)];
            } else
                return [_.map(splitBy(dates, step), _.last),
                    _.map(splitBy(values, step), array_sum)];
        }
    }
}).factory('Periods', function() {
    return {
        default_period: function() {
            return '1 month';
        },
        period_list: function() {
            return {
                '1 week' : 7,
                '2 weeks' : 14,
                '3 weeks' : 21,
                '1 month' : 30,
                '2 months' : 61,
                '3 months' : 91
            }
        }
    }
}).factory('ChartConfig', ['$rootScope', '$location', function($rootScope, $location) {
    return {
        zoom: function() {
            return {
                options: {
                    chart: {
                        type: 'spline'
                    },
                    plotOptions: {
                        series: {
                            marker: {
                                symbol: 'circle',
                                radius: 3
                            }
                        },
                    },
                    tooltip: {
                        crosshairs: true,
                        style: {
                            padding: 10,
                            fontWeight: 'bold'
                        }
                    }
                },
                title: {
                    text: ''
                },
                credits: {
                    enabled: false
                },
                size: {
                    height: 450,
                },
                xAxis: {
                    tickmarkPlacement: 'on',
                    gridLineWidth: 1,
                    min: 0.5
                },
                yAxis: {
                    title: {
                        enabled: false
                    }
                },
                series: []
            };
        },
        charts: function() {
            return {
                options: {
                    chart: {
                        type: 'areaspline'
                    }
                },
                title: {
                    text: ''
                },
                size: {
                    height: 270
                },
                credits: {
                    enabled: false
                },
                xAxis: {
                    tickmarkPlacement: 'on',
                    gridLineWidth: 1,
                    min: 0.5
                },
                yAxis: {
                    title: {
                        text: null
                    }
                },
                series: []
            }
        },
        column: function () {
            return {
                options: {
                    chart: {
                        type: 'column'
                    },
                    plotOptions: {
                        column: {
                            minPointLength: 3,
                            animation: false
                        },
                        series: {
                            point: {
                                events: {
                                    click: function () {
                                        $rootScope.$apply($location.path('/launch/' + this.id));
                                    }
                                }
                            }
                        }
                    },
                    tooltip: {
                        formatter: function() {
                            return Math.round(this.y * 1000) / 1000 + '%';
                        }
                    }
                },
                credits: {
                    enabled: false
                },
                title: {
                    text: ''
                },
                size: {
                    height: 240
                },
                xAxis: {
                    gridLineWidth: 1
                },
                yAxis: {
                    min: 0,
                    minRange : 0.01,
                    title: {
                        text: ''
                    }
                },
                series: []
            };
        },
        area: function () {
            return {
                options: {
                    chart: {
                        type: 'area'
                    },
                    plotOptions: {
                        area: {
                            stacking: 'percent',
                            lineColor: '#ffffff',
                            lineWidth: 0,
                            marker: {
                                enabled: false,
                                radius: 1,
                                symbol: 'circle',
                                lineWidth: 0,
                                lineColor: '#ffffff'
                            }
                        },
                        column: {
                            stacking: 'percent'
                        },
                        series: {
                            point: {
                                events: {
                                    click: function () {
                                        $rootScope.$apply($location.path('/launch/' + this.id));
                                    }
                                }
                            }
                        }
                    }
                },
                credits: {
                    enabled: false
                },
                title: {
                    text: ''
                },
                size: {
                    height: 240
                },
                xAxis: {
                    tickmarkPlacement: 'on',
                    gridLineWidth: 1
                },
                yAxis: {
                    min: 0,
                    minRange : 0.01,
                    title: {
                        text: ''
                    }
                },
                series: []
            };
        }
    }
}]);
