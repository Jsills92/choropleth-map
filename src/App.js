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
      .attr("stroke-width", 2);

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
      "#C9E1EC", // Lightest color (0-15%)
      "#BCC9D9", // Next shade (16-30%)
      "#A2C8D5", // Next shade (31-45%)
      "#8AA7B3", // Darkest color (46-60%)
    ];

    // Draw counties and add tooltip behavior
    svg
      .selectAll(".county")
      .data(data.countyData.features)
      .enter()
      .append("path")
      .attr("class", "county")
      .attr("d", path)
      .attr("fill", (d) => {
        const countyData = data.educationData.find(
          (county) => county.fips === d.id
        );
        const educationPercentage = countyData ? countyData.bachelorsOrHigher : 0;
    
        // Map the education percentage to a color from softColors
        if (educationPercentage <= 15) {
          return softColors[0]; // 0-15% -> Lightest color
        } else if (educationPercentage <= 30) {
          return softColors[1]; // 16-30% -> Second lightest color
        } else if (educationPercentage <= 45) {
          return softColors[2]; // 31-45% -> Third lightest color
        } else {
          return softColors[3]; // 46-60% -> Darkest color
        }
      })
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


/* Need to fix the legend so that percentages actually line up with the colors of counties percentages */

const legendScale = d3.scaleLinear()
  .domain([0, 15, 30, 45, 60]) // Set the domain to the ranges
  .range([0, 100, 200, 300, 400]); // This sets the spacing of the ticks

// Create the legend
const legend = svg.append("g")
  .attr("class", "legend")
  .attr("transform", "translate(600, 710)");

// Add the legend color bar (gradient)
legend.append("g")
  .attr("class", "legendColor")
  .selectAll("rect")
  .data(softColors) // Use the same color array
  .enter()
  .append("rect")
  .attr("x", (d, i) => legendScale([0, 15, 30, 45, 60][i])) // Position each color based on the range
  .attr("width", 100)
  .attr("height", 10)
  .attr("fill", (d) => d);

// Add the legend ticks
legend.append("g")
  .attr("class", "legendTicks")
  .selectAll("line")
  .data([0, 15, 30, 45, 60]) // Ticks corresponding to the range values
  .enter()
  .append("line")
  .attr("x1", (d) => legendScale(d))
  .attr("x2", (d) => legendScale(d))
  .attr("y1", 0)
  .attr("y2", 10)
  .attr("stroke", "#000");

// Add the labels to the ticks
legend.append("g")
  .attr("class", "legendLabels")
  .selectAll("text")
  .data([0, 15, 30, 45, 60]) // Labels corresponding to the range values
  .enter()
  .append("text")
  .attr("x", (d) => legendScale(d))
  .attr("y", 30)
  .attr("text-anchor", "middle")
  .text((d) => `${d}%`);


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
