import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ErrorBar } from 'recharts';

const SpeciesNDVIPatterns = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const majorSpecies = [
        // Primary Species (>1000 plots)
            'Picea abies (L.) H.Karst.',
                'Pinus sylvestris L.',
                'Betula pubescens Ehrh.',
        // Secondary Species (500-1000 plots)
            'Betula pendula Roth',
                'Populus tremula L.',
        // Less Common Species (>300 plots)
            'Salix caprea L.',
                'Alnus incana (L.) Moench',
                'Alnus glutinosa (L.) Gaertn.',
                'Sorbus aucuparia L.',
                'Pinus contorta Douglas ex Loudon',
        // Rare Species (>50 plots)
            'Acer platanoides L.',
                'Fraxinus excelsior L.'
]

    const speciesColors = {
        // Primary Species (>1000 plots)
        'Picea abies (L.) H.Karst.': '#1b5e20',     // Dark Green
        'Pinus sylvestris L.': '#2e7d32',           // Medium Green
        'Betula pubescens Ehrh.': '#66bb6a',        // Light Green

        // Secondary Species (500-1000 plots)
        'Betula pendula Roth': '#ff9800',           // Orange
        'Populus tremula L.': '#fdd835',            // Yellow

        // Less Common Species (>300 plots)
        'Salix caprea L.': '#1976d2',               // Blue
        'Alnus incana (L.) Moench': '#1565c0',      // Darker Blue
        'Alnus glutinosa (L.) Gaertn.': '#0d47a1',  // Darkest Blue
        'Sorbus aucuparia L.': '#7b1fa2',           // Purple
        'Pinus contorta Douglas ex Loudon': '#6a1b9a', // Dark Purple

        // Rare Species (>50 plots)
        'Acer platanoides L.': '#c62828',           // Red
        'Fraxinus excelsior L.': '#b71c1c'          // Dark Red
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetch('/preprocessed_ndvi_patterns.json');
                if (!response.ok) {
                    throw new Error('Failed to load preprocessed data');
                }
                const jsonData = await response.json();
                setData(jsonData);
            } catch (error) {
                console.error('Error loading preprocessed data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border rounded shadow">
                    <p className="font-semibold">{label}</p>
                    {payload.map((entry) => {
                        const speciesName = entry.dataKey;
                        const stdDev = entry.payload[`${speciesName}_stdDev`];
                        return (
                            <p key={entry.dataKey} style={{ color: entry.color }}>
                                {speciesName.split(' (')[0]}: {entry.value?.toFixed(3)}
                                {stdDev && ` ± ${stdDev.toFixed(3)}`}
                                {entry.payload[`${speciesName}_count`] &&
                                    ` (n=${entry.payload[`${speciesName}_count`]})`}
                            </p>
                        );
                    })}
                </div>
            );
        }
        return null;
    };

    if (loading || !data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold">Loading NDVI Patterns...</h3>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[500px]">
                        <p>Loading data...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <h3 className="text-lg font-semibold">Average Seasonal NDVI Patterns by Species (2017-2024)</h3>
                <p className="text-sm text-gray-600">
                    Showing mean NDVI values with standard deviation error bars, averaged across all available years
                </p>
            </CardHeader>
            <CardContent>
                <div style={{ width: '100%', height: 500 }}>
                    <ResponsiveContainer>
                        <LineChart
                            data={data}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis
                                domain={[-0.2, 1]}
                                tickCount={7}
                                label={{
                                    value: 'NDVI',
                                    angle: -90,
                                    position: 'insideLeft',
                                    offset: -10
                                }}
                            />
                            <Tooltip content={CustomTooltip} />
                            <Legend />
                            {majorSpecies.map(species => (
                                <Line
                                    key={species}
                                    type="monotone"
                                    dataKey={species}
                                    name={species.split(' (')[0]}
                                    stroke={speciesColors[species]}
                                    dot={true}
                                    strokeWidth={2}
                                    connectNulls={true}
                                >
                                    <ErrorBar
                                        dataKey={`${species}_stdDev`}
                                        width={4}
                                        strokeWidth={2}
                                        stroke={speciesColors[species]}
                                        direction="y"
                                    />
                                </Line>
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export default SpeciesNDVIPatterns;