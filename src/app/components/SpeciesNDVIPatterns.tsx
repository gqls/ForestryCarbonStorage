import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ErrorBar } from 'recharts';
import Papa from 'papaparse';
import _ from 'lodash';

const SpeciesNDVIPatterns = () => {
    const [data, setData] = useState([]);
    const [selectedYear, setSelectedYear] = useState(2017);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndices = months.map((_, idx) => idx);

    const majorSpecies = [
        'Pinus sylvestris L.',
        'Picea abies (L.) H.Karst.',
        'Betula pendula Roth',
        'Betula pubescens Ehrh.',
        'Populus tremula L.'
    ];

    const speciesColors = {
        'Pinus sylvestris L.': '#2e7d32',
        'Picea abies (L.) H.Karst.': '#1b5e20',
        'Betula pendula Roth': '#ff9800',
        'Betula pubescens Ehrh.': '#f57c00',
        'Populus tremula L.': '#fdd835'
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                console.log('Starting data load...');
                const treesResponse = await fetch('/trees_finland_and_sweden_parsed.csv');
                const satelliteResponse = await fetch(`/features_${selectedYear}_mean.csv`);

                if (!treesResponse.ok || !satelliteResponse.ok) {
                    throw new Error('Failed to fetch data');
                }

                const [treesText, satelliteText] = await Promise.all([
                    treesResponse.text(),
                    satelliteResponse.text()
                ]);

                const [treeData, satelliteData] = await Promise.all([
                    new Promise((resolve) => {
                        Papa.parse(treesText, {
                            header: true,
                            dynamicTyping: true,
                            complete: results => resolve(results.data)
                        });
                    }),
                    new Promise((resolve) => {
                        Papa.parse(satelliteText, {
                            header: true,
                            dynamicTyping: true,
                            complete: results => resolve(results.data)
                        });
                    })
                ]);

                const plotsBySpecies = {};
                treeData.forEach(tree => {
                    if (tree && tree.taxonname && majorSpecies.includes(tree.taxonname)) {
                        if (!plotsBySpecies[tree.taxonname]) {
                            plotsBySpecies[tree.taxonname] = new Set();
                        }
                        plotsBySpecies[tree.taxonname].add(tree.plotcode);
                    }
                });

                const ndviData = monthIndices.map((monthIdx) => {
                    const entry = { month: months[monthIdx] };

                    majorSpecies.forEach(species => {
                        const plotsForSpecies = Array.from(plotsBySpecies[species] || []);
                        const relevantPlots = satelliteData.filter(plot =>
                            plotsForSpecies.includes(plot.plotcode)
                        );

                        if (relevantPlots.length > 0) {
                            const ndviValues = relevantPlots.map(plot => {
                                const nir = plot[`${monthIdx}_B8`];
                                const red = plot[`${monthIdx}_B4`];

                                if (nir != null && red != null && red !== 0) {
                                    const ndvi = (nir - red) / (nir + red);
                                    if (!isNaN(ndvi) && ndvi >= -1 && ndvi <= 1) {
                                        return ndvi;
                                    }
                                }
                                return null;
                            }).filter(val => val !== null);

                            if (ndviValues.length > 0) {
                                const meanNDVI = _.mean(ndviValues);
                                const stdDev = Math.sqrt(_.sum(ndviValues.map(v =>
                                    Math.pow(v - meanNDVI, 2)
                                )) / ndviValues.length);

                                if (!isNaN(meanNDVI)) {
                                    entry[species] = meanNDVI;
                                    entry[`${species}_count`] = ndviValues.length;
                                    entry[`${species}_stdDev`] = stdDev;
                                    console.log(`Month ${months[monthIdx]}, Species ${species}: NDVI = ${meanNDVI} ± ${stdDev} (n=${ndviValues.length})`);
                                }
                            }
                        }
                    });

                    return entry;
                });

                setData(ndviData);
            } catch (error) {
                console.error('Error processing data:', error);
            }
        };

        loadData();
    }, [selectedYear]);

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

    if (!data || data.length === 0) {
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
                <h3 className="text-lg font-semibold">Seasonal NDVI Patterns by Species ({selectedYear})</h3>
                <p className="text-sm text-gray-600">
                    Showing mean NDVI values with standard deviation error bars
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
                                    name={species}
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