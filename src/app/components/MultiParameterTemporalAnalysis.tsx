'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MultiParameterTemporalAnalysis = ({ yearData, treeData }) => {
    const [selectedView, setSelectedView] = useState('radar');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const formatChartData = () => {
        if (!yearData || !yearData[2017]) return [];

        return Object.entries(yearData[2017]).map(([monthIndex, data]) => ({
            month: months[parseInt(monthIndex)],
            // All parameters from data
            ...data
        }));
    };

    const viewConfigs = {
        radar: {
            title: "Radar Parameters",
            charts: [
                {
                    title: 'VH Ascending (dB)',
                    dataKey: 'vhAsc',
                    domain: [-6, -4],
                    color: '#2196f3',
                    description: 'Cross-polarization backscatter'
                },
                {
                    title: 'VV Ascending (dB)',
                    dataKey: 'vvAsc',
                    domain: [-4, -2],
                    color: '#4caf50',
                    description: 'Co-polarization backscatter'
                },
                {
                    title: 'VH/VV Ratio',
                    dataKey: 'vhvvRatio',
                    domain: [-4, 0],
                    color: '#ff9800',
                    description: 'Ratio of VH to VV backscatter'
                }
            ]
        },
        optical: {
            title: "Optical Parameters",
            charts: [
                {
                    title: 'NDVI',
                    dataKey: 'ndvi',
                    domain: [0, 1],
                    color: '#00796b',
                    description: 'Normalized Difference Vegetation Index'
                },
                {
                    title: 'Red Edge (B5)',
                    dataKey: 'redEdge',
                    domain: [0, 1500],
                    color: '#d32f2f',
                    description: 'Red Edge band reflectance'
                },
                {
                    title: 'Red (B4)',
                    dataKey: 'red',
                    domain: [0, 1500],
                    color: '#c62828',
                    description: 'Red band reflectance'
                }
            ]
        },
        swir: {
            title: "SWIR Parameters",
            charts: [
                {
                    title: 'SWIR (B11)',
                    dataKey: 'swir',
                    domain: [0, 3000],
                    color: '#7b1fa2',
                    description: 'Short-wave infrared band 1'
                },
                {
                    title: 'SWIR2 (B12)',
                    dataKey: 'swir2',
                    domain: [0, 3000],
                    color: '#6a1b9a',
                    description: 'Short-wave infrared band 2'
                }
            ]
        },
        environmental: {
            title: "Environmental Parameters",
            charts: [
                {
                    title: 'Water Availability Index',
                    dataKey: 'wai',
                    domain: ['auto', 'auto'],
                    color: '#0288d1',
                    description: 'Water Availability Index'
                },
                {
                    title: 'Growing Degree Days',
                    dataKey: 'sgdd',
                    domain: ['auto', 'auto'],
                    color: '#ffa000',
                    description: 'Sum of Growing Degree Days'
                }
            ]
        }
    };

    const data = formatChartData();
    console.log("Formatted data first point:", data[0]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 rounded shadow">
                    <p className="font-bold mb-1">{label}</p>
                    <p className="text-sm">
                        Value: {payload[0].value?.toFixed(3)}
                    </p>
                    {payload[0].payload[`${payload[0].dataKey}_std`] && (
                        <p className="text-sm text-gray-600">
                            Std Dev: {payload[0].payload[`${payload[0].dataKey}_std`]?.toFixed(3)}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 bg-white p-6">
            <div className="flex flex-col space-y-2">
                <h2 className="text-2xl font-bold">Forest Parameter Analysis</h2>
                <p className="text-gray-600">Temporal analysis of forest parameters (2017)</p>
            </div>

            <div className="flex flex-wrap gap-4 mb-4">
                {Object.entries(viewConfigs).map(([key, config]) => (
                    <button
                        key={key}
                        onClick={() => setSelectedView(key)}
                        className={`px-6 py-3 rounded-lg transition-colors duration-200 font-semibold ${
                            selectedView === key
                                ? 'bg-blue-500 text-white shadow-lg'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                    >
                        {config.title}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {viewConfigs[selectedView].charts.map((config) => (
                    <Card key={config.dataKey} className="w-full bg-white shadow-lg">
                        <CardHeader>
                            <CardTitle>{config.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div style={{ width: '100%', height: '300px' }}>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart
                                        data={data}
                                        margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                        <XAxis
                                            dataKey="month"
                                            stroke="#666"
                                        />
                                        <YAxis
                                            domain={config.domain}
                                            stroke="#666"
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line
                                            type="monotone"
                                            dataKey={config.dataKey}
                                            stroke={config.color}
                                            strokeWidth={2}
                                            dot
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="mt-4 text-sm text-gray-600">{config.description}</p>
                            <p className="text-xs text-gray-500 mt-2">
                                Measurements per month: {data[0]?.count || 'N/A'}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default MultiParameterTemporalAnalysis;