import React, { useState, useEffect } from "react";
import * as d3 from "d3";
import './App.css';

function App() {
  const [data, setData] = useState({ educationData: null, countyData: null });

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
        // Set the state with both data sets
        setData({ educationData: educationJson, countyData: countyJson });
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  if (!data.educationData || !data.countyData) {
    return <div>Loading...</div>; // Show loading while fetching data
  }

  return (
    <div>
      <h1>Choropleth Map</h1>
      {/* Your map rendering logic goes here */}
    </div>
  );
}

export default App;
