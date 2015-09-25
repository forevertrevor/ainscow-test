var controllers = angular.module('controllers', ['ionic']);

controllers.controller('LoginController', ['$scope', '$http', '$state', '$ionicHistory', 'LoginService',
    function ($scope, $http, $state, $ionicHistory, loginService) {

        $scope.loginService = loginService;
        $scope.username = null;
        $scope.password = null;

        $scope.clearErrors = function () {
            loginService.clearErrors();
        },
                $scope.login = function () {
                    loginService.login($scope.username, $scope.password);
                };

    }]);

controllers.controller('HomeController', function ($scope,standingData,chartData,ChartFiltersService,DataService) {
       $scope.chartData = chartData;
       var onFilterChanged = function(newPrefs,oldPrefs){
           DataService.getChartData().then(function(data){
               $scope.chartData = data;//$scope.chartData is watched by the programme-circles directive and will cause the chart to re-render with the new params;
           });
       };
       $scope.$watch(function(){//watch for changes to the filterPrefs object in ChartFiltersService.
           return ChartFiltersService.filterPrefs;
       },onFilterChanged,true);
       
});
controllers.controller('SearchController', ['$scope', function ($scope) {

    }]);
controllers.controller('AnalyzeController', ['$scope', function ($scope) {

    }]);
controllers.controller('ChartController', ['$scope', function ($scope) {

    }]);
controllers.controller('FiltersController', ['$scope', function ($scope, $state) {

    }]);
controllers.controller('DatesController', ['$scope', function ($scope) {

    }]);
controllers.controller('MetricsController', function ($scope, metrics, selectedMetric, ChartFiltersService) {
    $scope.metrics = metrics;
    $scope.selectedMetric = selectedMetric;
    $scope.writePrefs = function () {
        console.log("Writing selected metric to prefs: " + $scope.selectedMetric.selectedMetric);
        ChartFiltersService.setFilter('metric',$scope.selectedMetric.selectedMetric);       
    };
    
});
controllers.controller('GenresController', ['$scope', function ($scope) {

    }]);
controllers.controller('ChannelsController', ['$scope', function ($scope) {

    }]);
controllers.controller('BroadcastersController', ['$scope', function ($scope) {

    }]);

