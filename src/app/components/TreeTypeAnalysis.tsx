'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import _ from 'lodash';

const TreeTypeAnalysis = ({ onPlotSelect, selectedPlot }) => {
    const [treeData, setTreeData] = useState([]);
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const treesResponse = await fetch('/trees_finland_and_sweden_parsed.csv');
                const treesText = await treesResponse.text();

                Papa.parse(treesText, {
                    header: true,
                    dynamicTyping: true,
                    complete: (results) => {
                        const enrichedData = results.data
                            .filter(tree => tree.taxonname) // Filter out null/undefined taxonnames
                            .map(tree => ({
                                ...tree,
                                treeType: treeTypeClassification[tree.taxonname] || 'unknown'
                            }));

                        setTreeData(enrichedData);
                        const plotAverages = processTreeTypesByPlot(enrichedData);
                        setChartData(plotAverages);
                    }
                });
            } catch (error) {
                console.error('Error loading tree data:', error);
            }
        };
        loadData();
    }, []);

    const processTreeTypesByPlot = (trees) => {
        const plotGroups = _.groupBy(trees, 'plotcode');
        const plotStats = Object.entries(plotGroups).map(([plotcode, plotTrees]) => {
            const total = plotTrees.length;
            const typeCounts = _.countBy(plotTrees, 'treeType');

            return {
                plotcode,
                total,
                evergreen: (typeCounts.evergreen || 0) / total * 100,
                deciduous: (typeCounts.deciduous || 0) / total * 100,
                unknown: (typeCounts.unknown || 0) / total * 100
            };
        });

        const averages = {
            evergreen: _.meanBy(plotStats, 'evergreen'),
            deciduous: _.meanBy(plotStats, 'deciduous'),
            unknown: _.meanBy(plotStats, 'unknown')
        };

        const stdDev = {
            evergreen: Math.sqrt(_.meanBy(plotStats, p => Math.pow(p.evergreen - averages.evergreen, 2))),
            deciduous: Math.sqrt(_.meanBy(plotStats, p => Math.pow(p.deciduous - averages.deciduous, 2))),
            unknown: Math.sqrt(_.meanBy(plotStats, p => Math.pow(p.unknown - averages.unknown, 2)))
        };

        return [{
            name: 'Average Distribution',
            evergreen: _.round(averages.evergreen, 1),
            deciduous: _.round(averages.deciduous, 1),
            unknown: _.round(averages.unknown, 1),
            evergreenStd: _.round(stdDev.evergreen, 1),
            deciduousStd: _.round(stdDev.deciduous, 1),
            unknownStd: _.round(stdDev.unknown, 1),
            totalPlots: plotStats.length,
            totalTrees: _.sumBy(plotStats, 'total')
        }];
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length > 0) {
            return (
                <div className="bg-white p-3 border rounded shadow">
                    <p className="text-sm font-semibold mb-1">{label}</p>
                    {payload.map((entry) => (
                        <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.value.toFixed(1)}% ± {payload[0].payload[`${entry.dataKey}Std`]}%
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="mb-4">
            <CardHeader>
                <h3 className="text-lg font-semibold">Tree Type Distribution</h3>
                {chartData.length > 0 && (
                    <p className="text-sm text-gray-600">
                        Based on {chartData[0].totalPlots.toLocaleString()} plots,
                        {' '}{chartData[0].totalTrees.toLocaleString()} trees
                    </p>
                )}
            </CardHeader>
            <CardContent>
                <div className="mt-4" style={{ width: '100%', height: 400 }}>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer>
                            <BarChart
                                data={chartData}
                                margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis
                                    domain={[0, 100]}
                                    label={{
                                        value: 'Percentage of Trees',
                                        angle: -90,
                                        position: 'insideLeft',
                                        offset: -30
                                    }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar
                                    dataKey="evergreen"
                                    fill="#2e7d32"
                                    name="Evergreen"
                                />
                                <Bar
                                    dataKey="deciduous"
                                    fill="#ed6c02"
                                    name="Deciduous"
                                />
                                <Bar
                                    dataKey="unknown"
                                    fill="#757575"
                                    name="Unknown"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-gray-500">Loading data...</p>
                        </div>
                    )}
                </div>

                {/* Summary Cards */}
                {chartData.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        {[
                            { label: 'Evergreen', key: 'evergreen', color: '#2e7d32' },
                            { label: 'Deciduous', key: 'deciduous', color: '#ed6c02' },
                            { label: 'Unknown', key: 'unknown', color: '#757575' }
                        ].map(({ label, key, color }) => (
                            <div
                                key={key}
                                className="p-4 rounded-lg bg-gray-50 border border-gray-200"
                            >
                                <div className="text-lg font-semibold" style={{ color }}>
                                    {label}
                                </div>
                                <div className="text-gray-600">
                                    {chartData[0][key]}% ± {chartData[0][`${key}Std`]}%
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// Tree type classification
const treeTypeClassification = {
    'Picea abies (L.) H.Karst.': 'evergreen',  // Norway Spruce
    'Pinus sylvestris L.': 'evergreen',        // Scots Pine
    'Pinus contorta Douglas ex Loudon': 'evergreen', // Lodgepole Pine
    'Picea spp.': 'evergreen',                 // Spruce species
    'Pinus mugo Turra': 'evergreen',           // Mountain Pine
    'Juniperus spp.\n': 'evergreen',           // Juniper species
    'Other conifers': 'evergreen',             // Other coniferous trees

    'Betula pendula Roth': 'deciduous',        // Silver Birch
    'Betula pubescens Ehrh.': 'deciduous',     // Downy Birch
    'Betula spp.': 'deciduous',                // Birch species
    'Populus tremula L.': 'deciduous',         // European Aspen
    'Alnus glutinosa (L.) Gaertn.': 'deciduous', // Black Alder
    'Alnus incana (L.) Moench': 'deciduous',   // Grey Alder
    'Alnus spp.': 'deciduous',                 // Alder species
    'Salix caprea L.': 'deciduous',            // Goat Willow
    'Salix spp.': 'deciduous',                 // Willow species
    'Sorbus aucuparia L.': 'deciduous',        // Rowan
    'Sorbus intermedia (Ehrh.) Pers.': 'deciduous', // Swedish Whitebeam
    'Sorbus spp.': 'deciduous',                // Sorbus species
    'Acer platanoides L.': 'deciduous',        // Norway Maple
    'Acer pseudoplatanus L.': 'deciduous',     // Sycamore Maple
    'Fraxinus excelsior L.': 'deciduous',      // European Ash
    'Quercus spp.': 'deciduous',               // Oak species
    'Tilia spp.': 'deciduous',                 // Lime/Linden species
    'Ulmus spp.': 'deciduous',                 // Elm species
    'Carpinus betulus L.': 'deciduous',        // European Hornbeam
    'Fagus sylvatica L.': 'deciduous',         // European Beech
    'Prunus avium L.': 'deciduous',            // Wild Cherry
    'Other broadleaved': 'deciduous',          // Other broadleaf trees
    'Larix spp.': 'deciduous'                  // Larch species (deciduous conifer)
};

export default TreeTypeAnalysis;