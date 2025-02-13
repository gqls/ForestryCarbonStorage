'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import AggregatedPlotsAnalysis from "@/app/components/AggregatedPlotsAnalysis";
import TreeTypeAnalysis from "@/app/components/TreeTypeAnalysis";

const SentinelExplorer = ({ selectedPlot }) => {
  const [yearData, setYearData] = useState({});
  const [yearStdData, setYearStdData] = useState({});
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedView, setSelectedView] = useState('backscatter');
  const years = [2017, 2018];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    const loadData = async () => {
      console.log("sentinel explorer starting data load . . .");
      const yearDataObj = {};
      const yearStdDataObj = {};

      for (const year of years) {
        try {
          const [meanResponse, stdResponse] = await Promise.all([
            fetch(`/features_${year}_mean.csv`),
            fetch(`/features_${year}_stdD.csv`)
          ]);

          const [meanText, stdText] = await Promise.all([
            meanResponse.text(),
            stdResponse.text()
          ]);

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

        } catch (error) {
          console.error(`Error loading ${year} data:`, error);
        }
      }

      setYearData(yearDataObj);
      setYearStdData(yearStdDataObj);
    };
    loadData();
  }, []);

  const processMultiYearData = (data) => {
    if (!data || Object.keys(data).length === 0) {
      return [];
    }

    if (selectedYear === 'all') {
      return months.map((month, idx) => {
        const entry = { month };
        years.forEach(year => {
          if (!data[year]) return;

          const plotData = data[year].find(row => row.plotcode === selectedPlot);

          if (plotData) {
            entry[`VH_Asc_${year}`] = plotData[`${idx}_VHAsc`];
            entry[`VV_Asc_${year}`] = plotData[`${idx}_VVAsc`];
            entry[`VH_Des_${year}`] = plotData[`${idx}_VHDes`];
            entry[`VV_Des_${year}`] = plotData[`${idx}_VVDes`];
            entry[`B2_${year}`] = plotData[`${idx}_B2`];
            entry[`B3_${year}`] = plotData[`${idx}_B3`];
            entry[`B4_${year}`] = plotData[`${idx}_B4`];
            entry[`B8_${year}`] = plotData[`${idx}_B8`];

            if (plotData[`${idx}_B8`] != null && plotData[`${idx}_B4`] != null) {
              entry[`NDVI_${year}`] = (plotData[`${idx}_B8`] - plotData[`${idx}_B4`]) /
                  (plotData[`${idx}_B8`] + plotData[`${idx}_B4`]);
            }
          }
        });
        return entry;
      });
    }

    // Single year processing
    const targetData = data[selectedYear];
    if (!targetData) return [];

    const plotData = targetData.find(row => row.plotcode === selectedPlot);
    if (!plotData) return [];

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
            <AggregatedPlotsAnalysis
                yearData={yearData}
                yearStdData={yearStdData}
                selectedYear={selectedYear}
                selectedView={selectedView}
                years={years}
                months={months}
            />
        ) : (
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

        {/* Tree Type Analysis */}
        <TreeTypeAnalysis selectedPlot={selectedPlot} />

        {/* Bottom Spacing */}
        <div className="mb-5 mt-100">
          <br /><br /><br />
        </div>
      </div>
  );
};

export default SentinelExplorer;