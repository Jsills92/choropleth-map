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

    // Draw counties and add tooltip behavior
    svg
      .selectAll(".county")
      .data(data.countyData.features)
      .enter()
      .append("path")
      .attr("class", "county")
      .attr("d", path)
      .attr("fill", "#4682b4")
      .on("mouseover", function (event, d) {
        // Find matching education data for the county
        const countyEducationData = data.educationData.find(
          (county) => county.fips === d.id
        );

        // Show tooltip with education data
        d3.select(this).raise().attr("stroke", "#000").attr("stroke-width", 2);

        // Set the tooltip content and make it visible
        tooltip.style("visibility", "visible").html(`
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
