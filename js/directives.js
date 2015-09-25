var directives = angular.module('directives', []);
directives.directive('programmeCircles', ['DataService', 'ConfigService', 'd3Service', '$window', 'moment',
    function (dataService, config, d3, $window, moment) {

        return {
            restrict: 'E',
            scope: {chartData: '=chartData'},
            link: function (scope, element, attrs) {

                var d3Format = d3.time.format("%d-%m-%y"),
                        d3Date = function (date) {
                            return d3Format.parse(d3Format(date));
                        };

                $window.onresize = function () {
                    scope.$apply();
                };

                // Watch for resize event; will fire render() when initialized as well as on resize
                scope.$watch(function () {
                    return angular.element($window)[0].innerWidth;
                }, function () {
                    scope.render(scope.chartData);
                });

                scope.$watch('chartData', function (newChartData, oldChartData) {
                    scope.render(newChartData);
                });


                var svg = d3.select('programme-circles')
                        .append('svg')
                        .style('width', '100%');

                scope.render = function (chartData) {

                    var data = chartData.data,
                            numberOfDays = dataService.filterPrefs.toDate.diff(dataService.filterPrefs.fromDate, 'days') + 1,
                            rangeValues = chartData.rangeValues,
                            // setup layout variables
                            totalWidth = d3.select(element[0]).node().offsetWidth,
                            availableWidth = totalWidth * 0.9, //there is a css 5% border each side
                            graphicWidth = availableWidth * 0.5, // how much width the graphic part has, the text fills the rest
                            rowHeight = 25,
                            maxCircleRadius = ((graphicWidth / numberOfDays) / 2) > rowHeight / 2 ? (rowHeight / 2) - 1.5 : ((graphicWidth / numberOfDays) / 2) - 1.5,
                            axisYOffset = 50, //otherwise the axis is hidden to the top of the svg
                            axisXOffset = 20, //otherwise the axis starts display to the left of the svg
                            axisBottomMargin = 30, //gap between the axis and first row of data
                            textLeftMargin = 30, //gap between end of graphic and beginning of text

                            // calculate the height required for the svg
                            height = (data.length * rowHeight) + axisYOffset + axisBottomMargin,
                            // Use the category20() scale function for multicolor support
                            color = d3.scale.category20c(),
                            axisFormat = function (date, idx, c) {
                                //fn to conditionally draw axis labels based on graphicWidth.  If the screen is too small it will drop every other tick
                                if (graphicWidth < 400 && idx !== 0 && idx !== numberOfDays - 1 && idx % 2 === 1) {
                                    return '';
                                } else {
                                    return d3.time.format('%d/%m')(date);
                                }
                            },
                            x = d3.time.scale()
                            .domain([dataService.filterPrefs.fromDate.toDate(), dataService.filterPrefs.toDate.toDate()])
                            .range([0, graphicWidth]),
                            xAxis = d3.svg.axis()
                            .scale(x)
                            .orient('top')
                            .ticks(d3.time.days, 1)
                            .tickSize(4, 1)
                            .tickFormat(axisFormat)
                            .tickPadding(8);

                    var rScale = d3.scale.linear()
                            .domain([rangeValues[0], rangeValues[1]])
                            .rangeRound([2, maxCircleRadius]);

                    svg.selectAll('.x')
                            .remove();

                    // set the height based on the calculations above
                    svg.attr('height', height);
                    svg.append('g')
                            .attr('class', 'x axis')
                            .attr('transform', 'translate(' + axisXOffset + ',' + axisYOffset + ')')
                            .call(xAxis);

                    /*console.debug('Max row height: ' + rowHeight);
                     console.debug('Number of days: ' + numberOfDays);
                     console.debug('graphicWidth: ' + graphicWidth);
                     console.debug('graphicWidth/7: ' + (graphicWidth / numberOfDays));
                     console.debug('maxCircleradius: ' + maxCircleRadius);*/

                    //data looks like this:
                    //[{id:x, programmeTitle:[y],broadcastChannel:z,rank:i,dateValues:[[Date,value,obj],[Date,value,obj]...]},{}...]


                    var programmeLine = svg.selectAll(".programme-line")
                            .data(data, function (d, idx) {
                                return d.id;
                            });
                    programmeLine.exit()
                            .transition()
                            .duration(2000)
                            .attr('transform', 'translate(400,0)')
                            .remove();

                    programmeLine.enter()
                            .append("g")
                            .attr("class", "programme-line")
                            .attr('transform', 'translate(' + axisXOffset + ',' + (axisYOffset + axisBottomMargin) + ')');


                    var textDesc = programmeLine.selectAll(".desc-text")
                            .data(function (d, idx) {
                                return [[d.rank, d.programmeTitle]];
                            });
                    
                    var textDescEnter = textDesc.enter()
                            .append('text')
                            .attr('fill', '#000')
                            .attr('class', 'desc-text')
                            .attr('x', graphicWidth + textLeftMargin)
                            .attr('alignment-baseline', 'central');

                    textDesc
                            .transition()
                            .duration(2000)
                            .text(function (d, i) {
                                return d[1];//programmeTitle
                            })
                            .attr('y', function (d, i) {
                                return (d[0] - 1) * rowHeight;//rank -1 * rowHeight
                            });

                    var circles = programmeLine.selectAll("circle")
                            .data(function (d, idx) {
                                return d.dateValues;
                            });
                    var circlesEnter = circles.enter()
                            .append('circle')
                            .attr('class', 'circle-text')
                            .attr('fill','#fff')
                    circles
                            .transition()
                            .duration(2000)
                            .attr('r', function (d) {
                                return rScale(d[1]);
                            })
                            .attr('cx', function (d, idx) {
                                return x(d3Date(d[0]))
                            })//place circle underneath date tick in axis
                            .attr('cy', function (d) {
                                return (d[2].rank - 1) * rowHeight;//use rank to determine rowheight.  Not that straightforward to determine parent node's index here
                            })
                            .attr('fill', function (d) {
                                return color(d[2].rank - 1);
                            });

                };
            }
        };
    }]);

