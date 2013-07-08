function createLatestBuildsGraph(data) {

  console.log(data);
  var dataset = data;       // global variable to hold JSON data once loaded
  drawLatestHisto(dataset); // Draw the graph
}

function drawLatestHisto(dataset) {

  var w           = 500;
  var h           = 350;
  var xPadding    = 30;
  var yPadding    = 40;
  var textPadding = 30;

  // Set X and Y scales for dynamic data handling
  var xScale = d3.scale.ordinal()
              .domain(d3.range(dataset.length))
              .rangeRoundBands([0, w - xPadding], 0.05);

  var yScale = d3.scale.linear()
              .domain([0, d3.max(dataset, function(d)
                { return parseInt(d.jenkins_build_time.toFixed(2)); })])
              .range([h - yPadding, 0]);

  // Create the SVG canvas
  var svg = d3.select('#latestBuildsGraph')
              .append('svg')
              .attr({width: w, height: h });

  // Create the package build time bars
  svg.selectAll('rect')
    .data(dataset)
    .enter()
    .append('rect')
    .attr('class', 'histoBar')
    .sort(function(a, b) {
      return d3.ascending(a.date, b.date);
    })
    .attr('x', function(d, i) {
      return xScale(i) + xPadding;
     })
    .attr('y', function(d) {
      return yScale(d.jenkins_build_time.toFixed(2)) + yPadding / 2;
    } )
    .attr('height', function(d) {
      return h - yScale(d.jenkins_build_time.toFixed(2)) - yPadding;
    })
    .attr('width', xScale.rangeBand())
    .attr('fill', 'cornflowerblue')
    .attr('fill-opacity', '0.7')
    .on('mouseover', function(d) {
      var tooltipID = '#latestBuildsToolTip';
      var contentID = '#latestBuildsToolTipTitle';
      var xPosition = parseFloat(d3.select(this).attr('x'));
      var yPosition = parseFloat(d3.select(this).attr('y')) + 100;

      displayHistoTooltip(tooltipID, contentID, xPosition, yPosition, d.package_name, d.jenkins_build_time.toFixed(2));

      d3.select(this)
        .transition()
        .duration(250)
        .attr('fill-opacity', '1');

    })
    .on('mouseout', function(d) {
      var tooltipID = '#latestBuildsToolTip';

      hideTooltip(tooltipID);

      d3.select(this)
        .transition()
        .duration(250)
        .attr('fill-opacity', '0.6');
    });

  // Create the labels
  svg.selectAll('text')
      .data(dataset)
      .enter()
      .append('text')
      .sort(function(a, b) {
        return d3.ascending(a.date, b.date);
       })
      .text(function(d) {
        day  = d.date.slice(6,10).replace('-', '/');
        time = d.date.slice(12,16);
        return day + ' ' + time
      })
      .attr('x', function(d, i) {
        if (d.package_name.length > 8) {
          return xScale(i) + xPadding + textPadding + 2;
        } else {
          return xScale(i) + xPadding + textPadding
        }
      })
      .attr('y', function(d) {
        //return h - (d.jenkins_build_time * 2) - 25;
        return 325 + + yPadding / 2;
      })
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Arial')
      .attr('font-weight', 'bold')
      .attr('font-size', '12px')
      .attr('fill', '');

  // Create the Axes
  var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient('bottom');

  svg.append('g')
      .attr('class', 'x axis xhistoAxis invisAxis')
      .attr('transform', 'translate('+ xPadding +','+ (h - (yPadding - 20)) + ')')
      .call(xAxis)

  var yAxis = d3.svg.axis()
                .scale(yScale)
                .orient('left');

  svg.append('g')
      .attr('class', 'y axis yhistoAxis')
      .attr('transform', 'translate('+ xPadding +','+ yPadding / 2 + ')')
      .call(yAxis)
}

function displayHistoTooltip(tooltipID, contentID, xPosition, yPosition, packageName, buildTime) {

  d3.select(tooltipID)
    .style('left', xPosition + 'px')
    .style('top', yPosition + 'px')
    .select(contentID)
    .text(packageName + ': ' + buildTime + ' seconds');
  d3.select(tooltipID).classed('hidden', false);
}

function hideTooltip(tooltipID) {

  d3.select(tooltipID).classed('hidden', true);
}