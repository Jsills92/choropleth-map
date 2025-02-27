import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import "./App.css";

function App() {
  const svgRef = useRef();
  const [data, setData] = useState({ educationData: null, countyData: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use Promise.all to fetch both JSON files concurrently
    Promise.all([
      fetch(
        "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json"
      ),
      fetch(
        "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json"
      ),
    ])
      .then(([educationResponse, countyResponse]) => {
        return Promise.all([educationResponse.json(), countyResponse.json()]);
      })
      .then(([educationJson, countyJson]) => {
        const countiesGeoJson = feature(
          countyJson,
          countyJson.objects.counties
        );
        const statesGeoJson = feature(countyJson, countyJson.objects.states);

        setData({
          educationData: educationJson,
          countyData: countiesGeoJson,
          stateData: statesGeoJson,
        });
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!data.educationData || !data.countyData || !data.stateData) return;

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = 1200 - margin.left - margin.right;
    const height = 800 - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width - 200} ${height}`);

    const path = d3.geoPath();

    // Draw states first
    svg
      .selectAll(".state")
      .data(data.stateData.features)
      .enter()
      .append("path")
      .attr("class", "state")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-width", 1);

    d3.select("#tooltip").remove();

    // Tooltip creation
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("id", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "#222831")
      .style("border-radius", "5px")
      .style("padding", "5px 10px")
      .style("font-size", "10px")
      .style("color", "#EEEEEE")
      .style("z-index", "10")
      .style("max-width", "200px") // Limiting the width of the tooltip
      .style("max-height", "150px") // Limit height if the content becomes long
      .style("overflow", "auto"); // Allow scrolling if content overflows

    // Define a palette of soft pastel colors for the counties
    const softColors = [
      "#8AA7B3", // Darker shade of Light SteelBlue
      "#A2C8D5", // Darker shade of Lighter SteelBlue
      "#BCC9D9", // Darker shade of Very light steelblue
      "#C9E1EC", // Darker shade of Almost pastel steelblue
    ];

    // Draw counties and add tooltip behavior
    svg
      .selectAll(".county")
      .data(data.countyData.features)
      .enter()
      .append("path")
      .attr("class", "county")
      .attr("d", path)
      .attr("fill", (d, i) => softColors[i % softColors.length]) // Use the pastel shades in a repeating pattern
      // Add data-fips and data-education attributes
      .attr("data-fips", (d) => {
        const countyData = data.educationData.find(
          (county) => county.fips === d.id
        );
        return countyData ? countyData.fips : null;
      })
      .attr("data-education", (d) => {
        const countyData = data.educationData.find(
          (county) => county.fips === d.id
        );
        return countyData ? countyData.bachelorsOrHigher : null;
      })
      .on("mouseover", function (event, d) {
        // Find matching education data for the county
        const countyEducationData = data.educationData.find(
          (county) => county.fips === d.id
        );

        // Show tooltip with education data
        d3.select(this).raise().attr("stroke", "#000").attr("stroke-width", 2);

        // Set the tooltip content and make it visible
        tooltip
          .style("visibility", "visible")
          .attr(
            "data-education",
            countyEducationData ? countyEducationData.bachelorsOrHigher : null
          ).html( // Use the correct data field
        `
            <strong>County:</strong> ${
              countyEducationData ? countyEducationData.area_name : "Unknown"
            }<br>
            <strong>Education Level:</strong> ${
              countyEducationData
                ? countyEducationData.bachelorsOrHigher
                : "N/A"
            }%<br>
            <strong>FIPS Code:</strong> ${d.id}
          `);

        // Position the tooltip near the mouse cursor
        tooltip
          .style("top", event.pageY + 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseout", function () {
        // Remove the stroke and hide the tooltip
        d3.select(this).attr("stroke", "none");
        tooltip.style("visibility", "hidden");
      });

    // Define the custom color scale for the percentage of people with a bachelor's degree
    const colorScale = d3
      .scaleLinear()
      .domain([0, 20, 40, 60, 80, 100]) // Education percentage range (0% to 100%)
      .range([
        "#BCC9D9", // Lightest blue
        "#C9E1EC", // Almost pastel steelblue
        "#A2C8D5", // Darker shade of Lighter SteelBlue
        "#8AA7B3", // Darker shade of Light SteelBlue
        "#5F7585", // A deeper shade (optional)
        "#3B4A53", // Even darker shade (optional)
      ]); // Range of blue shades you defined earlier

    // Define the legend color scale using the same thresholds
    const legendScale = d3
      .scaleLinear()
      .domain([0, 100]) // Percentage range
      .range([0, 300]); // Width of the legend bar

    const legendAxis = d3
      .axisBottom(legendScale)
      .tickSize(13)
      .tickValues([0, 20, 40, 60, 80, 100]) // Add custom ticks at regular intervals (0%, 20%, 40%, etc.)
      .tickFormat((d) => `${d}%`); // Format the ticks to show percentage

    // Append the legend group
    const legend = svg
      .append("g")
      .attr("id", "legend")
      .attr("transform", `translate(600, 700)`); // Adjust position as needed

    // Add the colored rectangles for the legend using the predefined range of colors
    legend
      .selectAll("rect")
      .data(colorScale.range()) // Use colorScale.range() directly
      .enter()
      .append("rect")
      .attr("x", (d, i) =>
        legendScale(i * (100 / (colorScale.range().length - 1)))
      ) // Spread the colors across the range
      .attr(
        "width",
        (d, i) =>
          legendScale((i + 1) * (100 / (colorScale.range().length - 1))) -
          legendScale(i * (100 / (colorScale.range().length - 1)))
      )
      .attr("height", 10)
      .style("fill", (d) => d); // Use the color value directly for each rectangle

    // Append the axis for the legend
    legend.call(legendAxis);

    // Style the legend text and axis line
    legend.select(".domain").remove(); // Remove axis line

    legend
      .selectAll("text")
      .style("fill", "#000") // White text
      .style("font-size", "12px");
  }, [data]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 id="title">United States Educational Attainment</h1>
      <h2 id="description">
        Percentage of adults age 25 and older with a bachelor's degree or higher
        (2010-2014)
      </h2>
      <svg ref={svgRef}></svg>
    </div>
  );
}

export default App;
