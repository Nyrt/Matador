//module.exports = {
    function drawGraph(info){
    console.log(info)
    d3.csv(info)
      .row(function(d) {
        d.date = new Date(d.Timestamp * 1000);
        return d;
      })
      .get(function(error, rows) { renderChart(rows); });

    function renderChart(data) {
        var chart = fc.chart.linearTimeSeries()
            .xDomain(fc.util.extent(data, 'date'))
            .yDomain(fc.util.extent(data, ['open', 'close']))
            .yTicks(5)
            .xTicks(5)
            .yNice(5);

      var area = fc.series.area()
        .yValue(function(d) { return d.open; });

      var line = fc.series.line()
        .yValue(function(d) { return d.open; });

      var gridlines = fc.annotation.gridline()
        .yTicks(5)
        .xTicks(0);

      var multi = fc.series.multi()
        .series([gridlines, area, line]);
      
      chart.plotArea(multi);

      d3.select('#time-series')
            .datum(data)
            .call(chart);

    }
  /*    data.crosshair = []; 

      // add a crosshair
      var crosshair = fc.tool.crosshair()
                .snap(fc.util.seriesPointSnapXOnly(line, data))
                .xLabel(function(d) { return dateFormat(d.datum.date); })
                .yLabel(function(d) { return priceFormat(d.datum.close); })
                .decorate(function(sel) {
                    sel.enter().select('circle').attr('r', 3);
                    addCallout(sel);
                    addXCallout(sel);
                })
                .on('trackingmove', function(crosshairData) {
                    renderLegend(crosshairData[0].datum);
                })
                .on('trackingend', function() {
                    renderLegend(data[data.length - 1]);
                });
*/
    }
//}