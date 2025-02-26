import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client"; // Import topojson-feature function
import './App.css';

function App() {
  const svgRef = useRef();
  const [data, setData] = useState({ educationData: null, countyData: null });
  const [loading, setLoading] = useState(true); // Add a loading state

  useEffect(() => {
    // Use Promise.all to fetch both JSON files concurrently
    Promise.all([
      fetch("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json"),
      fetch("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json")
    ])
      .then(([educationResponse, countyResponse]) => {
        // Convert both responses to JSON
        return Promise.all([educationResponse.json(), countyResponse.json()]);
      })
      .then(([educationJson, countyJson]) => {
        // Convert Topology to GeoJSON using topojson
        const countiesGeoJson = feature(countyJson, countyJson.objects.counties);
        const statesGeoJson = feature(countyJson, countyJson.objects.states); // Extract state boundaries
        console.log("County JSON Objects Available:", Object.keys(countyJson.objects));
        console.log("First few counties:", countiesGeoJson.features.slice(0, 5));

        // Set the state with both data sets
        setData({ educationData: educationJson, countyData: countiesGeoJson, stateData: statesGeoJson });
        setLoading(false); // Set loading to false once data has loaded
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false); // Set loading to false even if there was an error
      });
  }, []);

  useEffect(() => {
    if (!data || !data.educationData || !data.countyData || !data.stateData) return;

    const margin = { top: 20, right: 20, bottom: 20, left: 20 }; // Adjusted margins for better centering
    const width = 1200 - margin.left - margin.right;
    const height = 800 - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .style("margin", "0 auto"); // Centering the SVG

    // Set up the map projection using geoAlbersUsa
    const projection = d3.geoAlbersUsa().scale(1000).translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection); // Use the path with the projection

    // Draw the states first as outlines with a fill to see them
    svg
      .selectAll(".state")
      .data(data.stateData.features)
      .enter()
      .append("path")
      .attr("class", "state")
      .attr("d", path)
      .attr("fill", "#f0f0f0") // Add a fill color for visibility
      .attr("stroke", "#000")
      .attr("stroke-width", 1);

    // Draw the counties afterward
    /*svg
      .selectAll(".county")
      .data(data.countyData.features)
      .enter()
      .append("path")
      .attr("class", "county")
      .attr("d", path)
      .attr("fill", "#d1d1d1")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 0.7);
      */

    // Add graticule (latitude/longitude lines)
    const graticule = d3.geoGraticule();

    svg
      .append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path) // Use geoPath to create path for graticule
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 0.5);

  }, [data]);

  if (loading) {
    return <div>Loading...</div>; // Show loading while fetching data
  }

  return (
    <div>
      <h1>Choropleth Map</h1>
      <svg ref={svgRef}></svg>
    </div>
  );
}

export default App;
