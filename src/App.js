import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client"; // Import topojson-feature function
import "./App.css";

function App() {
  const svgRef = useRef();
  const [data, setData] = useState({ educationData: null, countyData: null });
  const [loading, setLoading] = useState(true); // Add a loading state

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
        // Convert both responses to JSON
        return Promise.all([educationResponse.json(), countyResponse.json()]);
      })
      .then(([educationJson, countyJson]) => {
        // Convert Topology to GeoJSON using topojson
        const countiesGeoJson = feature(
          countyJson,
          countyJson.objects.counties
        );
        const statesGeoJson = feature(countyJson, countyJson.objects.states); // Extract state boundaries

        // Set the state with both data sets
        setData({
          educationData: educationJson,
          countyData: countiesGeoJson,
          stateData: statesGeoJson,
        });
        setLoading(false); // Set loading to false once data has loaded
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false); // Set loading to false even if there was an error
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
      .style("display", "block") // Ensure no extra space around the SVG
      .style("margin", "0 auto") // Center horizontally
      .attr("viewBox", `0 0 ${width} ${height}`); // Preserve aspect ratio

    // Manually scale and center the map based on the bounding box
    const path = d3.geoPath(); // No projection applied

    // Draw states first
    svg
      .selectAll(".state")
      .data(data.stateData.features)
      .enter()
      .append("path")
      .attr("class", "state")
      .attr("d", path)
      .attr("fill", "#f0f0f0")
      .attr("stroke", "#000")
      .attr("stroke-width", 1);

    // Draw counties
    svg
      .selectAll(".county")
      .data(data.countyData.features)
      .enter()
      .append("path")
      .attr("class", "county")
      .attr("d", path)
      .attr("fill", "#d1d1d1")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 0.7);
  }, [data]);

  if (loading) {
    return <div>Loading...</div>; // Show loading while fetching data
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
