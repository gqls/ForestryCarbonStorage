import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import _ from 'lodash';

const TreeTypeAnalysis = ({ selectedPlot }) => {
    const [treeData, setTreeData] = useState([]);
    const [chartData, setChartData] = useState([]);

    // Tree type classification mapping
    const treeTypeClassification = {
        'Picea abies (L.) H.Karst.': 'evergreen',  // Norway Spruce
        'Pinus sylvestris L.': 'evergreen',        // Scots Pine
        'Pinus contorta Douglas ex Loudon': 'evergreen', // Lodgepole Pine
        'Picea spp.': 'evergreen',                 // Spruce species
        'Pinus mugo Turra': 'evergreen',           // Mountain Pine
        'Juniperus spp.': 'evergreen',           // Juniper species
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

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetch('/trees_finland_and_sweden_parsed.csv');
                const text = await response.text();

                Papa.parse(text, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const enrichedData = results.data
                            .filter(tree => tree.taxonname && tree.plotcode) // Filter out null/undefined taxonnames
                            .map(tree => ({
                                ...tree,
                                treeType: treeTypeClassification[tree.taxonname] || 'unknown'
                            }));

                        setTreeData(enrichedData);

                        // Process data for either selected plot or all plots
                        const processedData = processTreeTypes(enrichedData, selectedPlot);
                        setChartData(processedData);
                    }
                });
            } catch (error) {
                console.error('Error loading tree data:', error);
            }
        };
        loadData();
    }, [selectedPlot]);

    const processTreeTypes = (trees, selectedPlot) => {
        // Filter trees based on plot selection
        const relevantTrees = selectedPlot ?
            trees.filter(tree => String(tree.plotcode) === String(selectedPlot)) :
            trees;

        // Calculate total trees and type counts
        const total = relevantTrees.length;
        const typeCounts = _.countBy(relevantTrees, 'treeType');

        // Calculate percentages and standard deviations
        const plotGroups = _.groupBy(trees, 'plotcode');
        const plotPercentages = Object.values(plotGroups).map(plotTrees => {
            const plotTotal = plotTrees.length;
            return {
                evergreen: (plotTrees.filter(t => t.treeType === 'evergreen').length / plotTotal) * 100,
                deciduous: (plotTrees.filter(t => t.treeType === 'deciduous').length / plotTotal) * 100,
                unknown: (plotTrees.filter(t => t.treeType === 'unknown').length / plotTotal) * 100
            };
        });

        const stdDev = {
            evergreen: Math.sqrt(_.meanBy(plotPercentages, p => Math.pow(p.evergreen - (typeCounts.evergreen || 0) / total * 100, 2))),
            deciduous: Math.sqrt(_.meanBy(plotPercentages, p => Math.pow(p.deciduous - (typeCounts.deciduous || 0) / total * 100, 2))),
            unknown: Math.sqrt(_.meanBy(plotPercentages, p => Math.pow(p.unknown - (typeCounts.unknown || 0) / total * 100, 2)))
        };

        return [{
            name: selectedPlot ? `Plot ${selectedPlot}` : 'Average Distribution',
            evergreen: _.round((typeCounts.evergreen || 0) / total * 100, 1),
            deciduous: _.round((typeCounts.deciduous || 0) / total * 100, 1),
            unknown: _.round((typeCounts.unknown || 0) / total * 100, 1),
            evergreenStd: _.round(stdDev.evergreen, 1),
            deciduousStd: _.round(stdDev.deciduous, 1),
            unknownStd: _.round(stdDev.unknown, 1),
            totalPlots: selectedPlot ? 1 : Object.keys(plotGroups).length,
            totalTrees: total
        }];
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length > 0) {
            return (
                <div className="bg-white p-3 border rounded shadow">
                    <p className="text-sm font-semibold mb-1">{label}</p>
                    {payload.map((entry) => (
                        <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.value.toFixed(1)}%
                            {entry.payload[`${entry.dataKey}Std`] !== undefined &&
                                ` ± ${entry.payload[`${entry.dataKey}Std`]}%`}
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

export default TreeTypeAnalysis;