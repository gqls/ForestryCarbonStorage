'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import PlotAnalysis from "@/app/components/PlotAnalysis";
import AggregatedPlotsAnalysis from "@/app/components/AggregatedPlotsAnalysis";
import TreeTypeAnalysis from "@/app/components/TreeTypeAnalysis";

const SentinelExplorer = () => {
  const [yearData, setYearData] = useState({});
  const [yearStdData, setYearStdData] = useState({});
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedView, setSelectedView] = useState('backscatter');
  const [selectedPlot, setSelectedPlot] = useState('1014301');
  //fixme const years = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
  const years = [2017, 2018];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    const loadData = async () => {
      console.log("sentinel explorer starting data load . . .");
      const yearDataObj = {};
      const yearStdDataObj = {};

      for (const year of years) {
        try {
          console.log(`sentinel explorer loading data for year ${year}...`)
          const [meanResponse, stdResponse] = await Promise.all([
            fetch(`/features_${year}_mean.csv`),
            fetch(`/features_${year}_stdD.csv`)
          ]);

          const [meanText, stdText] = await Promise.all([
            meanResponse.text(),
            stdResponse.text()
          ]);

          // Use Promise to handle async parsing
          const meanData = await new Promise(resolve => {
            Papa.parse(meanText, {
              header: true,
              dynamicTyping: true,
              complete: (results) => {
                console.log(`sentinel explorer parsed mean data for ${year}, rows:`, results.data.length);
                resolve(results.data);
              }
            });
          });

          const stdData = await new Promise(resolve => {
            Papa.parse(stdText, {
              header: true,
              dynamicTyping: true,
              complete: (results) => {
                console.log(`sentinel explorer parsed std data for ${year}, rows:`, results.data.length);
                resolve(results.data);
              }
            });
          });

          yearDataObj[year] = meanData;
          yearStdDataObj[year] = stdData;
          //console.log(`year data obj {yearDataObj[year]}:`, yearStdDataObj[year], `year {year}`, year); // good

        } catch (error) {
          console.error(`Error loading ${year} data:`, error);
        }
      }

      console.log("sentinel explorer setting state with loaded data.")
      setYearData(yearDataObj);
      setYearStdData(yearStdDataObj);

      // Debug log the first plot's data
      let firstPlot = yearDataObj[years[0]]?.[0];
      console.log("Data structure check:", {
        years: Object.keys(yearDataObj),
        samplePlotIndex: firstPlot?.indexField,
        samplePlotcode: firstPlot?.plotcode,
        availableColumns: firstPlot ? Object.keys(firstPlot) : [],
        sampleData: firstPlot ? firstPlot : "no sample data to be had",
      });

      /*
      11_B7: null
      11_B8: null
      11_B8A: null
      11_B9: null
      index: 0
      indexField: 1
      latitude_generalised: 67.0164661885414
      longitude_generalised: 24.1602326383978
      plotcode: 1013901
      sgdd: 738.609166666667
      surveydate1: "1986-09-11"
      surveydate2: "1995-08-02"
      wai: 0.183627785414202
      year1: 1986
      year2: 1995
       */
    };
    loadData();
  }, []);

  // Add a separate useEffect to monitor state changes
  useEffect(() => {
    if (Object.keys(yearData).length > 0) {
      const firstPlot = yearData[years[0]]?.[0];
      console.log("State updated - Data structure check:", {
        years: Object.keys(yearData),
        samplePlotIndex: firstPlot?.indexField,
        samplePlotcode: firstPlot?.plotcode,
        availableColumns: firstPlot ? Object.keys(firstPlot) : [],
        sampleData: firstPlot || "no sample data to be had",
      });
    }
  }, [yearData]);


  const processMultiYearData = (data) => {

    console.log("========== START PROCESSING ==========");
    console.log("data", data)
    console.log("Input state:", {
      selectedYear,
      selectedPlot,
      hasData: !!data,
      yearKeys: data ? Object.keys(data) : []
    });

    if (!data || Object.keys(data).length === 0) {
      console.log("No data available, returning empty array");
      return [];
    }

    if (selectedYear === 'all') {
      console.log("Processing all years mode")
      const processedData = months.map((month, idx) => {
        const entry = { month };
        years.forEach(year => {
          if (!data[year]) {
            console.log(`No data for year ${year}`);
            return;
          }

          // Find the correct plot in the data array
          const plotData = data[year].find(row => row.plotcode === selectedPlot);

          console.log(`Year ${year}, Month ${month}:`, {
            foundPlot: !!plotData,
            plotId: plotData?.index,
            sampleValues: plotData ? {
              VH: plotData[`${idx}_VHAsc`],
              VV: plotData[`${idx}_VVAsc`],
              B4: plotData[`${idx}_B4`]
            } : null
          });

          if (plotData) {
            console.log(`Found data for year ${year}, month ${month}, plot ${selectedPlot}`);
            entry[`VH_Asc_${year}`] = plotData[`${idx}_VHAsc`];
            entry[`VV_Asc_${year}`] = plotData[`${idx}_VVAsc`];
            entry[`VH_Des_${year}`] = plotData[`${idx}_VHDes`];
            entry[`VV_Des_${year}`] = plotData[`${idx}_VVDes`];
            entry[`B2_${year}`] = plotData[`${idx}_B2`];
            entry[`B3_${year}`] = plotData[`${idx}_B3`];
            entry[`B4_${year}`] = plotData[`${idx}_B4`];
            entry[`B8_${year}`] = plotData[`${idx}_B8`];

            // Calculate NDVI if possible
            if (plotData[`${idx}_B8`] != null && plotData[`${idx}_B4`] != null) {
              entry[`NDVI_${year}`] = (plotData[`${idx}_B8`] - plotData[`${idx}_B4`]) /
                  (plotData[`${idx}_B8`] + plotData[`${idx}_B4`]);
            }
          }
        });
        return entry;
      });
      return processedData;
    }

    // Single year processing
    const targetData = data[selectedYear];
    if (!targetData) {
      console.log("No data found for year:", selectedYear);
      return [];
    }

    const plotData = targetData.find(row => row.plotcode === selectedPlot);
    if (!plotData) {
      console.log("No data found for plot:", selectedPlot, "in year:", selectedYear);
      return [];
    }

    console.log("Found plot data:", {
      year: selectedYear,
      plot: selectedPlot,
      sampleKeys: Object.keys(plotData).slice(0, 5)
    });

    if (selectedPlot === null) {
      // Handle "All Plots" case - average across all plots
      return months.map((idx) => {
        const entry = { month: months[idx] };
        years.forEach(year => {
          if (!data[year]) return;

          // Calculate averages for each metric
          const plotsData = data[year];
          const validPlots = plotsData.filter(plot => plot[`${idx}_VHAsc`] !== null);

          if (validPlots.length > 0) {
            // Calculate averages for each metric
            entry[`VH_Asc_${year}`] = validPlots.reduce((sum, plot) => sum + plot[`${idx}_VHAsc`], 0) / validPlots.length;
            entry[`VV_Asc_${year}`] = validPlots.reduce((sum, plot) => sum + plot[`${idx}_VVAsc`], 0) / validPlots.length;
            entry[`B2_${year}`] = validPlots.reduce((sum, plot) => sum + (plot[`${idx}_B2`] || 0), 0) / validPlots.length;
            entry[`B3_${year}`] = validPlots.reduce((sum, plot) => sum + (plot[`${idx}_B3`] || 0), 0) / validPlots.length;
            entry[`B4_${year}`] = validPlots.reduce((sum, plot) => sum + (plot[`${idx}_B4`] || 0), 0) / validPlots.length;
            entry[`B8_${year}`] = validPlots.reduce((sum, plot) => sum + (plot[`${idx}_B8`] || 0), 0) / validPlots.length;

            // Calculate NDVI from averaged B4 and B8
            if (entry[`B8_${year}`] && entry[`B4_${year}`]) {
              entry[`NDVI_${year}`] = (entry[`B8_${year}`] - entry[`B4_${year}`]) /
                  (entry[`B8_${year}`] + entry[`B4_${year}`]);
            }
          }
        });
        return entry;
      });
    }

    return months.map((month, idx) => {
      const monthData = {
        month,
        VH_Asc: plotData[`${idx}_VHAsc`],
        VV_Asc: plotData[`${idx}_VVAsc`],
        VH_Des: plotData[`${idx}_VHDes`],
        VV_Des: plotData[`${idx}_VVDes`],
        B2: plotData[`${idx}_B2`],
        B3: plotData[`${idx}_B3`],
        B4: plotData[`${idx}_B4`],
        B8: plotData[`${idx}_B8`]
      };
      console.log(`Month ${month} data:`, monthData);

      if (plotData[`${idx}_B8`] != null && plotData[`${idx}_B4`] != null) {
        monthData.NDVI = (plotData[`${idx}_B8`] - plotData[`${idx}_B4`]) /
            (plotData[`${idx}_B8`] + plotData[`${idx}_B4`]);
      }

      return monthData;
    });
  };


  const views = {
    backscatter: {
      title: "Sentinel-1 Backscatter",
      lines: selectedYear === 'all'
          ? years.flatMap(year => [
            { key: `VH_Asc_${year}`, color: `hsl(${(year-2017)*30}, 70%, 50%)`, name: `VH Asc ${year}` },
            { key: `VV_Asc_${year}`, color: `hsl(${(year-2017)*30}, 70%, 70%)`, name: `VV Asc ${year}` }
          ])
          : [
            { key: "VH_Asc", color: "#8884d8", name: "VH Ascending" },
            { key: "VV_Asc", color: "#82ca9d", name: "VV Ascending" },
            { key: "VH_Des", color: "#ffc658", name: "VH Descending" },
            { key: "VV_Des", color: "#ff7300", name: "VV Descending" }
          ],
      yAxisDomain: [-20, -5]
    },
    optical: {
      title: "Sentinel-2 Optical",
      lines: selectedYear === 'all'
          ? years.flatMap(year => [
            { key: `B2_${year}`, color: `hsl(${(year-2017)*30}, 70%, 40%)`, name: `Blue ${year}` },
            { key: `B3_${year}`, color: `hsl(${(year-2017)*30}, 70%, 50%)`, name: `Green ${year}` },
            { key: `B4_${year}`, color: `hsl(${(year-2017)*30}, 70%, 60%)`, name: `Red ${year}` },
            { key: `B8_${year}`, color: `hsl(${(year-2017)*30}, 70%, 70%)`, name: `NIR ${year}` }
          ])
          : [
            { key: "B2", color: "#3498db", name: "Blue (B2)" },
            { key: "B3", color: "#2ecc71", name: "Green (B3)" },
            { key: "B4", color: "#e74c3c", name: "Red (B4)" },
            { key: "B8", color: "#8884d8", name: "NIR (B8)" }
          ],
      yAxisDomain: [0, 5000]
    },
    ndvi: {
      title: "Vegetation Index",
      lines: selectedYear === 'all'
          ? years.map(year => (
              { key: `NDVI_${year}`, color: `hsl(${(year-2017)*30}, 70%, 50%)`, name: `NDVI ${year}` }
          ))
          : [
            { key: "NDVI", color: "#2ecc71", name: "NDVI" }
          ],
      yAxisDomain: [-1, 1]
    }
  };

  const currentView = views[selectedView];
  console.log('Year data into processMultiYearData:', yearData);
  const processedMeanData = processMultiYearData(yearData);
  const processedStdData = processMultiYearData(yearStdData);

  return (
      <div className="space-y-4">
        {/* Control Panel */}
        <div className="flex gap-4 mb-4">
          <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 rounded border"
          >
            <option value="all">All Years</option>
            {years.map(year => (
                <option key={year} value={year}>{year}</option>
            ))}
          </select>
          {Object.keys(views).map(view => (
              <button
                  key={view}
                  onClick={() => setSelectedView(view)}
                  className={`px-4 py-2 rounded ${
                      selectedView === view
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 hover:bg-gray-300'
                  }`}
              >
                {views[view].title}
              </button>
          ))}
        </div>

        {/* Visualization Section */}
        {selectedPlot === null ? (
            // Aggregated view for all plots
            <AggregatedPlotsAnalysis
                yearData={yearData}
                yearStdData={yearStdData}
                selectedYear={selectedYear}
                selectedView={selectedView}
                years={years}
                months={months}
            />
        ) : (
            // Individual plot view
            <>
              {/* Mean Values Chart */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">
                    {selectedYear === 'all' ? 'All Years' : selectedYear} Mean {currentView.title}
                  </h3>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400} className="min-h-[400px]">
                    <LineChart data={processedMeanData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis
                          domain={currentView.yAxisDomain}
                          tickCount={10}
                          label={{
                            value: currentView.title === "Sentinel-1 Backscatter" ? 'Backscatter (dB)' : 'Value',
                            angle: -90,
                            position: 'insideLeft'
                          }}
                      />
                      <Tooltip />
                      <Legend />
                      {currentView.lines.map(line => (
                          <Line
                              key={line.key}
                              type="monotone"
                              dataKey={line.key}
                              stroke={line.color}
                              name={line.name}
                              dot={false}
                              isAnimationActive={false}
                          />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Standard Deviation Chart */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">
                    {selectedYear === 'all' ? 'All Years' : selectedYear} Standard Deviation {currentView.title}
                  </h3>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400} className="min-h-[400px]">
                    <LineChart data={processedStdData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis
                          domain={['auto', 'auto']}
                          tickCount={10}
                          label={{
                            value: 'Standard Deviation',
                            angle: -90,
                            position: 'insideLeft'
                          }}
                      />
                      <Tooltip />
                      <Legend />
                      {currentView.lines.map(line => (
                          <Line
                              key={line.key}
                              type="monotone"
                              dataKey={line.key}
                              stroke={line.color}
                              name={line.name}
                              dot={false}
                              isAnimationActive={false}
                          />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
        )}

        {/* Plot Selection Component */}
        <PlotAnalysis onPlotSelect={setSelectedPlot} />
        <div className="mb-5 mt-100">
          <br /><br /><br />
        </div>
        <TreeTypeAnalysis
            onPlotSelect={setSelectedPlot}
            selectedPlot={selectedPlot}
        />

        {/* Bottom Spacing */}
        <div className="mb-5 mt-100">
          <br /><br /><br />
        </div>
      </div>
  );
};

export default SentinelExplorer;