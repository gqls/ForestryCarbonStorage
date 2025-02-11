'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

const SentinelExplorer = () => {
  const [meanData, setMeanData] = useState([]);
  const [selectedView, setSelectedView] = useState('backscatter');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    const loadData = async () => {
      try {
        const meanResponse = await fetch('/features_2017_mean.csv');
        const meanText = await meanResponse.text();
        Papa.parse(meanText, {
          header: true,
          dynamicTyping: true,
          complete: (results) => setMeanData(results.data)
        });
      } catch (error) {
        console.error('Error:', error);
      }
    };
    loadData();
  }, []);

  const processData = (data) => {
    if (!data.length) return [];
    const month_keys = [0,1,2,3,4,5,6,7,8,9,10,11];
    return month_keys.map((idx) => ({
      month: months[idx],
      VH_Asc: data[66][`${idx}_VHAsc`],
      VV_Asc: data[66][`${idx}_VVAsc`]
    }));
  };

  const views = {
    backscatter: {
      title: "Sentinel-1 Backscatter",
      lines: [
        { key: "VH_Asc", color: "#8884d8", name: "VH Ascending" },
        { key: "VV_Asc", color: "#82ca9d", name: "VV Ascending" }
      ]
    }
  };

  const currentView = views[selectedView];
  const processedMeanData = processData(meanData);

  console.log("Processed Data:", processedMeanData);
  console.log("Lines Config:", currentView.lines);

  return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Mean {currentView.title}</h3>
          </CardHeader>
          <CardContent className="h-[500px]">
            <ResponsiveContainer width="100%" height={400} className="min-h-[400px]">
              <LineChart data={processedMeanData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[-20, -5]} tickCount={10} />
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