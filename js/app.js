var ainscow = angular.module('ainscow', ['ionic', 'services', 'controllers', 'directives']);

ainscow.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
    $stateProvider.state('login', {
        templateUrl: 'templates/login.html',
        url: '',
        controller: 'LoginController'
    });
    $stateProvider.state('ainscow', {
        abstract: true,
        url: '/ainscow',
        templateUrl: 'templates/tabs.html'
    });
    $stateProvider.state('ainscow.home', {
        url: '/home',
        resolve: {
            standingData: function (DataService) {
                return DataService.getStandingData();
            },
            chartData: function(DataService){
                return DataService.getChartData();
            }
        },
        views: {
            'home-tab': {
                templateUrl: "templates/home.html",
                controller: 'HomeController'
            }
        }
    });

    $stateProvider.state('ainscow.filters', {
        url: '/filters',
        views: {
            'home-tab': {
                templateUrl: "templates/filters-list.html",
                controller: 'FiltersController'
            }
        }
    });
    $stateProvider.state('ainscow.dates', {
        url: '/dates',
        views: {
            'home-tab': {
                templateUrl: "templates/filter-dates.html",
                controller: 'DatesController'
            }
        }
    });
    $stateProvider.state('ainscow.metrics', {
        url: '/metrics',
        resolve: {
            metrics: function (DataService) {
                return DataService.getMetrics();                       
            },
            selectedMetric: function(DataService){
                return DataService.getCurrentlySelectedMetric();
            }
        },
        views: {
            'home-tab': {
                templateUrl: "templates/filter-metrics.html",
                controller: 'MetricsController'
            }
        }
    });
    $stateProvider.state('ainscow.genres', {
        url: '/genres',
        views: {
            'home-tab': {
                templateUrl: "templates/filter-genres.html",
                controller: 'GenresController'
            }
        }
    });
    $stateProvider.state('ainscow.channels', {
        url: '/channels',
        views: {
            'home-tab': {
                templateUrl: "templates/filter-channels.html",
                controller: 'ChannelsController'
            }
        }
    });
    $stateProvider.state('ainscow.broadcasters', {
        url: '/broadcasters',
        views: {
            'home-tab': {
                templateUrl: "templates/filter-broadcasters.html",
                controller: 'BroadcastersController'
            }
        }
    });
    $stateProvider.state('ainscow.search', {
        url: '/search',
        views: {
            'search-tab': {
                templateUrl: "templates/search.html",
                controller: 'SearchController'
            }
        }

    });
    $stateProvider.state('ainscow.analyze', {
        url: '/analyze',
        views: {
            'analyze-tab': {
                templateUrl: "templates/analyze.html",
                controller: 'AnalyzeController'
            }
        }

    });
});

ainscow.controller('AinscowController', function ($scope, $ionicPlatform, ChartFiltersService) {
    $ionicPlatform.ready(function () {
        console.log("Creating local storage");
        ChartFiltersService.createFilterPrefs();
    });
});






