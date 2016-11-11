'use strict';

var app = angular.module('testReport.testResult', [
    'ngRoute',
    'testReportServices'
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/testresult/:testResultId', {
        templateUrl: '/static/app/partials/testresult/testresult.html',
        controller: 'TestResultCtrl'
    });
}]);

app.controller('TestResultCtrl', ['$scope', '$routeParams', 'TestResult', 'GetChartStructure',
    function ($scope, $routeParams, TestResult, GetChartStructure) {
        // Fix absent scrollbar
        var $body = angular.element('body');
        if ($body.hasClass('modal-open')) {
            $body.removeClass('modal-open');
            $('.modal-backdrop').remove();
        }

        var videoMimeTypes = ['video/mpeg', 'video/mp4', 'video/ogg',
                                 'video/quicktime', 'video/webm', 'video/x-ms-wmv',
                                 'video/x-flv', 'video/3gpp', 'video/3gpp2'];

        $scope.isVideoMimeType = function(type) {
            return videoMimeTypes.indexOf(type) !== -1;
        };

        $scope.activeTab = 'message';
        $scope.setActiveTab = function(tabName) {
            $scope.activeTab = tabName;
        };

        var options = {
            month: 'numeric',
            day: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        };

        TestResult.get({ testResultId: $routeParams.testResultId}, function (result) {
            $scope.testResult = result;
            try {
                $scope.testResult.failure_reason_obj = JSON.parse(result.failure_reason);
                $scope.testResult.json = true;
                $scope.testResult.charts = [];
                _.each($scope.testResult.failure_reason_obj.series, function(serie) {
                    serie.y = _.map(serie.y, function(label) {
                        var d = new Date(label);
                        return d.toLocaleDateString(LANG, options);
                    });
                    var chart = GetChartStructure(
                        'area_absolute',
                        serie.y,
                        [{name: serie.name, data: serie.x, color: '#a5aad9'}]
                    );
                    chart.options.plotOptions.series.point.events = {};
                    chart.size.width = 550;
                    $scope.testResult.charts.push(chart);
                });
            } catch (error) {
                $scope.testResult.failure_reason = result.failure_reason;
            }
        });
    }
]);
