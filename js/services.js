var services = angular.module('services', ['ionic', 'ainscow.config', 'lib']);
services.factory('LoginService', function (uiService, $http, DataService, $ionicHistory, $state, config) {
    return {
        buttonText: "Sign In",
        noErrors: true,
        login: function (username, password) {
            var loginService = this,
                    url = config.serverUrl + "/ainscow/login",
                    loginSuccess = function (response) {
                        DataService.rawData = response.data;
                        DataService.data = DataService.addProgrammeDate(response.data);//TODO let the server provide this
                        $ionicHistory.nextViewOptions({
                            disableBack: true
                        });
                        $state.go('ainscow.home');
                    },
                    loginFailed = function (response) {
                        loginService.loginError(response.status, response.statusText);
                        loginService.noErrors = false;
                    };
            uiService.showWaiting();
            console.log("Doing GET for " + url);
            $http.get(url).then(loginSuccess, loginFailed)
                    .finally(function () {
                        uiService.endWaiting();
                    });
        },
        clearErrors: function () {
            this.buttonText = "Sign In";
            this.noErrors = true;
        },
        loginError: function (status, statusText) {
            console.log("Login failed: ",status," Reason: ",statusText);
            this.noErrors = false;
            switch (status) {
                case 401 :
                    this.buttonText = 'Could not connect';
                    break;
                case 403 :
                    this.buttonText = 'Unauthorized';
                    break;
                case 500 :
                    this.buttonText = 'Server Error';
                    break;
                default :
                    this.buttonText = 'Error';
            }
        }
    };
});
services.factory('DataService', function (_, moment, $http, config, $q, ChartFiltersService, configFilterPrefs) {
    return {
        rawData: null,
        data: null,
        standingData: null,
        filterPrefs: null,
        addProgrammeDate: function (data) { //MUST GET THIS FROM THE SERVER..
            //add a field for programmeDate as well as broadcastDateTime, then modify data such that
            //the array is grouped by programmeDate and summed for its metric
            return _.map(data, function (obj, idx) {//add programmeDate as a Date object
                obj.programmeDate = new Date(obj.broadcastDateTime);
                obj.programmeDate.setHours(0, 0, 0, 0);
                return obj;
            });
        },
        getChartData: function () {
            var dfd = $q.defer();
            this.createFilterValues();
            var chartData = {}, filterFromMoment = moment(this.filterPrefs.fromDate);//create new moment for this, because the subtract method modifies original            
            chartData.data = this.filterForDateRange(this.data, filterFromMoment.subtract(1, 'days'), this.filterPrefs.toDate);//to ensure ends of range are included
            chartData.data = this.getTopXByMetric(chartData.data, 20, this.filterPrefs.metric);
            chartData.rangeValues = this.getValueRange(chartData.data);
            chartData.data = this.createDateValueArray(chartData.data);
            dfd.resolve(chartData);
            return dfd.promise;            
        },
        createFilterValues: function () {
            //return defaults if no filter value can be read from the local storage
            this.filterPrefs = ChartFiltersService.filterPrefs;
            //if default specified, use last 7 days and turn dates into moments
            this.filterPrefs.fromDate = this.filterPrefs.fromDate === 'default' ? moment(new Date()).subtract(7, 'days') : moment(this.filterPrefs.fromDate);
            this.filterPrefs.toDate = this.filterPrefs.toDate === 'default' ? moment(new Date()) : moment(this.filterPrefs.toDate);

        },
        filterForDateRange: function (data, fromMoment, toMoment) {
            var filtered = _.filter(data, function (obj) {
                var programmeMoment = moment(obj.programmeDate);
                return programmeMoment.isBetween(fromMoment, toMoment);
            });
            return filtered;
        },
        getStandingData: function () {
            var url = config.serverUrl + "/ainscow/standingData",
                    dataService = this,
                    success = function (response) {
                        dataService.standingData = response.data;
                    },
                    failure = function (response) {
                        console.log(response.status);
                    };
            return $http.get(url).then(success, failure).finally();

        },
        getMetrics: function () {
            var dfd = $q.defer(),
                    dataService = this;
            dfd.resolve(dataService.standingData['metrics']);
            return dfd.promise;
        },
        getCurrentlySelectedMetric: function () {
            var dfd = $q.defer();
                    
            dfd.resolve({selectedMetric: ChartFiltersService.filterPrefs.metric});
            return dfd.promise;
        },
        getProgrammeById: function (id) {
            var iid = parseInt(id);
            for (var i = 0; i < this.rawData.length; i++) {
                if (this.rawData[i].id === iid) {
                    return this.rawData[i];
                }
            }
            return null;
        },
        getDateRange: function () {
            var result = [];
            result.push(_.min(this.rawData, function (obj) {
                return obj.broadcastDateTime;
            }));
            result.push(_.max(this.rawData, function (obj) {
                return obj.broadcastDateTime;
            }));
            result[0] = new Date(result[0].broadcastDateTime);
            result[1] = new Date(result[1].broadcastDateTime);
            return result;
        },
        getTopXByMetric: function (data, topX, metric) {

            //var data = this.addProgrammeDate(this.rawData);//will allow grouping by date rather than dateTime
            //var data = this.data;
            return _.chain(data)
                    .filter(function (element) {//filter on requested metric
                        return element.metric === metric;
                    })
                    .groupBy(function (obj) {//group on programmeId ==> {programmeId:[{},{}]}
                        return obj.programmeId;
                    })
                    .map(function (objArray, key) { // ==> [{programmeId:i, totalMetrics:n},{}...]
                        var totalMetric = 0;
                        _.each(objArray, function (object, idx) {
                            _.each(object, function (value, key) {
                                if (key === 'value') {
                                    totalMetric += parseInt(value);
                                }
                            });
                        });
                        return {programmeId: key, totalMetric: totalMetric};
                    })
                    .sort(function (a, b) {//sort the array in descending order
                        return b.totalMetric - a.totalMetric;
                    })
                    .slice(0, topX) //=> [{programmeId:i, totalMetrics:n},{}...](
                    .map(function (obj, i) {//==> [[{programmeId:i,...},{programmeId:i,...},{programmeId:i,..}],[{programmeId:j,...},{programmeId:j,...}],[],[]]
                        var progRecords = _.where(data, {programmeId: parseInt(obj.programmeId), metric: metric});
                        _.each(progRecords, function (obj) {//add a rank to each programmeRecord
                            obj['rank'] = i + 1;
                        });
                        return progRecords;
                    })
                    .map(function (objArray, idx) {//now need to group by programmeDate and sum metric in case >1 episode per day
                        var sumValue = function (objArray) {//aggregates the value property for each programmeDate
                            var result = _(objArray).reduce(function (memo, obj) {
                                return memo + parseInt(obj.value);
                            }, 0);
                            return result;
                        };
                        return _.chain(objArray)
                                .groupBy('programmeDate')
                                .map(function (objArray, key) {
                                    return {
                                        programmeId: objArray[0].programmeId,
                                        rank: objArray[0].rank,
                                        metric: objArray[0].metric,
                                        broadcastChannel: objArray[0].broadcastChannel,
                                        programmeTitle: objArray[0].programmeTitle,
                                        broadcastDateTime: objArray[0].broadcastDateTime,
                                        programmeDate: new Date(Date.parse(key)), //key here is a string, so we need to recast it to Date
                                        value: sumValue(objArray)
                                    };
                                })
                                .value();
                    })
                    .flatten()
                    .value();
        },
        aggregateDataByProgrammeId: function (array) {
            return _.groupBy(array, function (obj) {
                return obj.programmeId;
            });
        },
        filterArrayByMetric: function (array, metric) {
            return array.filter(function (element) {
                return element.metric === metric;
            });
        },
        createDateValueArray: function (objArray) {
            var result = [];
            _.chain(objArray)
                    .groupBy('programmeId')
                    .each(function (objArray, key, list) {
                        var dateValues = _.map(objArray, function (obj, ix) {
                            return [obj.programmeDate, obj.value, obj];
                        });
                        dateValues = {id: key, rank: objArray[0].rank, programmeTitle: objArray[0].programmeTitle, broadcastChannel: objArray[0].broadcastChannel, dateValues: dateValues};
                        result.push(dateValues);
                    });
            return _.sortBy(result, 'rank');
        },
        getValueRange: function (array) {
            var minValue = _.min(array, function (d) {
                return d.value;
            }),
                    maxValue = _.max(array, function (d) {
                        return d.value;
                    });
            return [minValue.value, maxValue.value];
        }

    };
});
services.factory("uiService", function ($ionicLoading) {

    return {
        showWaiting: function () {

            $ionicLoading.show({
                content: '<i class="icon ion-loading-d"></i>',
                animation: 'fade-in',
                showBackdrop: true,
                maxWidth: 200,
                showDelay: 5
            });
        },
        endWaiting: function () {
            $ionicLoading.hide();
        }

    };
});
services.factory('ConfigService', function () {
    return {
        defaultFilters: {
            fromDate: new Date(2015, 5, 06),
            toDate: new Date(2015, 5, 12),
            metric: 'AVE'
        },
        channelColours: {
            "CHANNEL 4": '#ffc900',
            "ITV1": '#11c1f3',
            "CHANNEL 5": '#886aea',
            "BBC ONE": "#ef473a"
        }
    };
});
services.factory('ChartFiltersService', function (configFilterPrefs, LocalStorageService) {
    return {
        filterPrefs: null,
        createFilterPrefs: function () {
            console.debug("Checking for stored preferences");
            var storedPrefs = LocalStorageService.getObject('filterPrefs');
            if (storedPrefs === null) {
                console.log("Could not find any stored preferences, using default values...");
                storedPrefs = configFilterPrefs;                
            }
            this.setFilterPrefs(storedPrefs);
        },
        setFilterPrefs: function (newPrefs) {
            this.filterPrefs = newPrefs;
            LocalStorageService.setObject('filterPrefs', this.filterPrefs);
        },
        setFilter: function(key,value){
          this.filterPrefs[key] = value; 
          this.setFilterPrefs(this.filterPrefs);
        },
        getFilterPref: function (key) {
            return this.filterPrefs[key];
        }
    };

});
services.factory('LocalStorageService', function ($window, configFilterPrefs) {
    return {
        set: function (key, value) {
            $window.localStorage[key] = value;
        },
        get: function (key, defaultValue) {
            return $window.localStorage[key] || defaultValue;
        },
        setObject: function (key, value) {
            $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function (key) {
            return JSON.parse($window.localStorage[key] || 'null');
        }
    };

});
