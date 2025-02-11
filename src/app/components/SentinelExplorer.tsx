'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

const SentinelExplorer = () => {
  const [meanData, setMeanData] = useState([]);
  const [stdData, setStdData] = useState([]);
  const [selectedView, setSelectedView] = useState('backscatter');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    const loadData = async () => {
      try {
        const meanResponse = await fetch('/features_2017_mean.csv');
        const stdResponse = await fetch('/features_2017_stdD.csv');
        
        const meanText = await meanResponse.text();
        const stdText = await stdResponse.text();
        
        Papa.parse(meanText, {
          header: true,
          dynamicTyping: true,
          complete: (results) => setMeanData(results.data)
        });
        
        Papa.parse(stdText, {
          header: true,
          dynamicTyping: true,
          complete: (results) => setStdData(results.data)
        });
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);

  const processData = (data) => {
    if (!data.length) return [];

    const month_keys = [0,1,2,3,4,5,6,7,8,9,10,11];
    return month_keys.map((idx) => {
      const entry = {
        month: months[idx],
        VH_Asc: data[66][`${idx}_VHAsc`],
        VV_Asc: data[66][`${idx}_VVAsc`],
        VH_Des: data[66][`${idx}_VHDes`],
        VV_Des: data[66][`${idx}_VVDes`],
        B2: data[66][`${idx}_B2`],
        B3: data[66][`${idx}_B3`],
        B4: data[66][`${idx}_B4`],
        B8: data[66][`${idx}_B8`]
      };

      if (entry.B8 && entry.B4) {
        entry.NDVI = (entry.B8 - entry.B4) / (entry.B8 + entry.B4);
      }

      return entry;
    });
  };

  const views = {
    backscatter: {
      title: "Sentinel-1 Backscatter",
      lines: [
        { key: "VH_Asc", color: "#8884d8", name: "VH Ascending" },
        { key: "VV_Asc", color: "#82ca9d", name: "VV Ascending" },
        { key: "VH_Des", color: "#ffc658", name: "VH Descending" },
        { key: "VV_Des", color: "#ff7300", name: "VV Descending" }
      ]
    },
    optical: {
      title: "Sentinel-2 Optical Bands",
      lines: [
        { key: "B2", color: "#3498db", name: "Blue (B2)" },
        { key: "B3", color: "#2ecc71", name: "Green (B3)" },
        { key: "B4", color: "#e74c3c", name: "Red (B4)" },
        { key: "B8", color: "#8884d8", name: "NIR (B8)" }
      ]
    },
    ndvi: {
      title: "Vegetation Index",
      lines: [
        { key: "NDVI", color: "#2ecc71", name: "NDVI" }
      ]
    }
  };

  const currentView = views[selectedView];
  const processedMeanData = processData(meanData);
  const processedStdData = processData(stdData);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-4">
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
          <h3 className="text-lg font-semibold">Mean {currentView.title}</h3>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height={400} className="min-h-[400px]">
            <LineChart data={processedMeanData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[-20, -5]} tickCount={10} />

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
          <h3 className="text-lg font-semibold">Standard Deviation {currentView.title}</h3>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height={400} className="min-h-[400px]">
            <LineChart data={processedStdData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
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
    </div>
  );
};

export default SentinelExplorer;
