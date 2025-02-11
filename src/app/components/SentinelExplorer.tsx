'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import PlotAnalysis from "@/app/components/PlotAnalysis";

const SentinelExplorer = () => {
  const [yearData, setYearData] = useState({});
  const [yearStdData, setYearStdData] = useState({});
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedView, setSelectedView] = useState('backscatter');
  const years = [2017, 2018, 2019, 2020, 2021, 2022];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    const loadData = async () => {
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

          Papa.parse(meanText, {
            header: true,
            dynamicTyping: true,
            complete: (results) => {
              yearDataObj[year] = results.data;
            }
          });

          Papa.parse(stdText, {
            header: true,
            dynamicTyping: true,
            complete: (results) => {
              yearStdDataObj[year] = results.data;
            }
          });
        } catch (error) {
          console.error(`Error loading ${year} data:`, error);
        }
      }
      setYearData(yearDataObj);
      setYearStdData(yearStdDataObj);
    };
    loadData();
  }, []);

  const processData = (data, year) => {
    if (!data) return [];

    const month_keys = [0,1,2,3,4,5,6,7,8,9,10,11];
    return month_keys.map((idx) => ({
      month: months[idx],
      VH_Asc: data[66][`${idx}_VHAsc`],
      VV_Asc: data[66][`${idx}_VVAsc`],
      VH_Des: data[66][`${idx}_VHDes`],
      VV_Des: data[66][`${idx}_VVDes`],
      B2: data[66][`${idx}_B2`],
      B3: data[66][`${idx}_B3`],
      B4: data[66][`${idx}_B4`],
      B8: data[66][`${idx}_B8`],
      NDVI: data[66][`${idx}_B8`] && data[66][`${idx}_B4`] ?
          (data[66][`${idx}_B8`] - data[66][`${idx}_B4`]) / (data[66][`${idx}_B8`] + data[66][`${idx}_B4`]) : 0
    }));
  };

  const processMultiYearDataFilterAbnormalValues = (data) => {
    if (selectedYear === 'all') {
      return months.map((month, idx) => {
        const entry = { month };
        years.forEach(year => {
          if (data[year]?.[66]) {
            // Add normalization check for December
            const vh = data[year][66][`${idx}_VHAsc`];
            const vv = data[year][66][`${idx}_VVAsc`];
            const b4 = data[year][66][`${idx}_B4`];
            const b8 = data[year][66][`${idx}_B8`];

            // Only assign if values are in expected ranges
            entry[`VH_Asc_${year}`] = Math.abs(vh) > 100 ? null : vh;
            entry[`VV_Asc_${year}`] = Math.abs(vv) > 100 ? null : vv;
            entry[`B4_${year}`] = b4;
            entry[`B8_${year}`] = b8;
          }
        });
        return entry;
      });
    }
    return processData(data[selectedYear]);
  };

  const processMultiYearData = (data) => {
    if (selectedYear === 'all') {
      return months.map((month, idx) => {
        const entry = { month };
        years.forEach(year => {
          if (data[year]?.[66]) {
            entry[`VH_Asc_${year}`] = data[year][66][`${idx}_VHAsc`];
            entry[`VV_Asc_${year}`] = data[year][66][`${idx}_VVAsc`];
            entry[`VH_Des_${year}`] = data[year][66][`${idx}_VHDes`];
            entry[`VV_Des_${year}`] = data[year][66][`${idx}_VVDes`];
            entry[`B2_${year}`] = data[year][66][`${idx}_B2`];
            entry[`B3_${year}`] = data[year][66][`${idx}_B3`];
            entry[`B4_${year}`] = data[year][66][`${idx}_B4`];
            entry[`B8_${year}`] = data[year][66][`${idx}_B8`];
            if (data[year][66][`${idx}_B8`] && data[year][66][`${idx}_B4`]) {
              entry[`NDVI_${year}`] = (data[year][66][`${idx}_B8`] - data[year][66][`${idx}_B4`]) /
                  (data[year][66][`${idx}_B8`] + data[year][66][`${idx}_B4`]);
            }
          }
        });
        return entry;
      });
    }
    return processData(data[selectedYear]);
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
        <PlotAnalysis />
      </div>
  );
};

export default SentinelExplorer;