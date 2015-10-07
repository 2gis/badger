'use strict';

var app = angular.module('testReport.metric.add', [
    'ngRoute',
    'angular-cron-jobs'
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/project/:projectId/metric/add', {
        templateUrl: '/static/app/partials/metric/add/add_metric.html',
        controller: 'AddMetricCtrl'
    });
}]);

app.controller('AddMetricCtrl', ['$rootScope', '$scope', '$routeParams', '$location', 'Metric',
    function ($rootScope, $scope, $routeParams, $location, Metric) {
        if(!$rootScope.getActiveProject()) {
            $rootScope.selectProject($routeParams.projectId);
        }

        $scope.cronDefault = '0 0 * * *';
        $scope.recovery = false;

        $scope.options = [
            {name: 'Total count', code: 'count'},
            {name: 'Cycle time', code: 'cycletime'},
            {name: 'Lead time', code: 'leadtime'}
        ];
        $scope.sorted_fields = ['created', 'resolutiondate'];

        function validateFormData(formData) {
            if (formData.name && formData.query && formData.handler) {
                if (formData.handler === 'count') {
                    if (formData.query_period && (!formData.query_field || !formData.query_step)) {
                        return false;
                    }
                }
                if (formData.handler === 'cycletime' || formData.handler === 'leadtime') {
                    if (formData.query_period && !formData.query_step) {
                        return false;
                    }
                }
                return true;
            }
        }

        $scope.save = function(formData) {
            if (validateFormData(formData)) {
                var metric;
                $scope.master = angular.copy(formData);
                metric = new Metric();
                metric.project = $routeParams.projectId;
                metric.schedule = $scope.cronOutput;
                angular.forEach(formData, function (value, property) {
                    metric[property] = value;
                });
                if (metric.handler === 'cycletime' || metric.handler === 'leadtime') {
                    metric.query_field = 'finish_date';
                }
                Metric.save(metric, function(result) {
                   $location.path('project/' + $routeParams.projectId + '/metrics');
                }, function (result) {
                    if (result.data.detail) {
                        $scope.formErrors = result.data.detail;
                    }
                    if (result.data.message) {
                        $scope.formErrors = result.data.message;
                    }
                });
            }
        };
    }
]);
