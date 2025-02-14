"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import _ from 'lodash';

const TreeTypeSentinelExplorer = ({ selectedPlot }) => {
    const [yearData, setYearData] = useState({});
    const [treeData, setTreeData] = useState([]);
    const [selectedYear, setSelectedYear] = useState('all');
    const [selectedView, setSelectedView] = useState('backscatter');
    const years = [2017, 2018];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const treeTypeClassification = {
        'Picea abies (L.) H.Karst.': 'evergreen',
        'Pinus sylvestris L.': 'evergreen',
        'Pinus contorta Douglas ex Loudon': 'evergreen',
        'Picea spp.': 'evergreen',
        'Pinus mugo Turra': 'evergreen',
        'Juniperus spp.': 'evergreen',
        'Other conifers': 'evergreen',
        'Betula pendula Roth': 'deciduous',
        'Betula pubescens Ehrh.': 'deciduous',
        'Betula spp.': 'deciduous',
        'Populus tremula L.': 'deciduous',
        'Alnus glutinosa (L.) Gaertn.': 'deciduous',
        'Alnus incana (L.) Moench': 'deciduous',
        'Alnus spp.': 'deciduous',
        'Salix caprea L.': 'deciduous',
        'Salix spp.': 'deciduous',
        'Sorbus aucuparia L.': 'deciduous',
        'Sorbus intermedia (Ehrh.) Pers.': 'deciduous',
        'Sorbus spp.': 'deciduous',
        'Acer platanoides L.': 'deciduous',
        'Acer pseudoplatanus L.': 'deciduous',
        'Fraxinus excelsior L.': 'deciduous',
        'Quercus spp.': 'deciduous',
        'Tilia spp.': 'deciduous',
        'Ulmus spp.': 'deciduous',
        'Carpinus betulus L.': 'deciduous',
        'Fagus sylvatica L.': 'deciduous',
        'Prunus avium L.': 'deciduous',
        'Other broadleaved': 'deciduous',
        'Larix spp.': 'deciduous'
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load Sentinel data
                const yearDataObj = {};
                for (const year of years) {
                    const meanResponse = await fetch(`/features_${year}_mean.csv`);
                    const meanText = await meanResponse.text();
                    const meanData = await new Promise(resolve => {
                        Papa.parse(meanText, {
                            header: true,
                            dynamicTyping: true,
                            complete: (results) => resolve(results.data)
                        });
                    });
                    yearDataObj[year] = meanData;
                }
                setYearData(yearDataObj);

                // Load tree data
                const treesResponse = await fetch('/trees_finland_and_sweden_parsed.csv');
                const treesText = await treesResponse.text();
                Papa.parse(treesText, {
                    header: true,
                    dynamicTyping: true,
                    complete: (results) => {
                        const enrichedData = results.data
                            .filter(tree => tree.plotcode && tree.taxonname) // Filter out invalid entries
                            .map(tree => {
                                const taxonname = tree.taxonname.trim(); // Trim any whitespace
                                const treeType = treeTypeClassification[taxonname];
                                // Simple debug log
                                console.log('Tree taxon comparison:', {
                                    'Input taxon': taxonname,
                                    'Input length': taxonname.length,
                                    'Expected taxon': 'Salix caprea L.',
                                    'Expected length': 'Salix caprea L.'.length,
                                    'Has match': Object.keys(treeTypeClassification).includes(taxonname)
                                });

                                return {
                                    ...tree,
                                    plotcode: Number(tree.plotcode),
                                    treeType: treeType || 'unknown',
                                    originalTaxonname: tree.taxonname
                                };
                            });
                        setTreeData(enrichedData);
                    }
                });
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };
        loadData();
    }, []);

    const processDataByTreeType = (data) => {
        if (!data || Object.keys(data).length === 0 || !treeData.length) {
            console.log("No data or tree data available");
            return [];
        }

        const selectedPlotNumber = Number(selectedPlot);
        console.log("Processing plot:", selectedPlotNumber);

        // Group trees by plot code, handling both Finnish and Swedish formats
        const plotTreeTypes = _.groupBy(
            treeData.filter(tree => {
                if (!selectedPlot) return true;
                const matches = tree.plotcode === selectedPlotNumber;
                if (matches) {
                    console.log("Found matching tree:", tree);
                }
                return matches;
            }),
            'plotcode'
        );

        console.log("Tree groups found:", {
            selectedPlot: selectedPlotNumber,
            totalTrees: treeData.length,
            matchingTrees: plotTreeTypes[selectedPlotNumber]?.length || 0,
            country: plotTreeTypes[selectedPlotNumber]?.[0]?.country
        });

        return months.map((month, idx) => {
            const entry = { month };
            const yearsToProcess = selectedYear === 'all' ? years : [selectedYear];

            yearsToProcess.forEach(year => {
                if (!data[year]) return;

                // Find the specific plot data we need
                const plotData = data[year].find(p => p.plotcode === selectedPlotNumber);
                if (!plotData) {
                    console.log(`No data found for plot ${selectedPlotNumber} in year ${year}`);
                    return;
                }

                const plotTrees = plotTreeTypes[selectedPlotNumber];
                if (!plotTrees) {
                    console.log(`No tree data found for plot ${selectedPlotNumber}`);
                    return;
                }

                // Calculate metrics separately for evergreen and deciduous
                const evergreen = plotTrees.filter(t => t.treeType === 'evergreen').length;
                const deciduous = plotTrees.filter(t => t.treeType === 'deciduous').length;
                const total = evergreen + deciduous;

                if (total > 0) {
                    // Weight the metrics by the proportion of each tree type
                    const evergreenWeight = evergreen / total;
                    const deciduousWeight = deciduous / total;

                    // Add weighted metrics to the entry
                    const suffix = selectedYear === 'all' ? `_${year}` : '';
                    const metrics = ['VHAsc', 'VVAsc', 'VHDes', 'VVDes', 'B2', 'B3', 'B4', 'B8'];

                    metrics.forEach(metric => {
                        // Try both with and without month prefix
                        let value = plotData[`${idx}_${metric}`];
                        if (value === null || value === undefined) {
                            // If not found, try looking for the data with monthNumber_metric format
                            for (let monthNumber = 0; monthNumber < 12; monthNumber++) {
                                const altKey = `${monthNumber}_${metric}`;
                                if (plotData[altKey] !== null && plotData[altKey] !== undefined) {
                                    value = plotData[altKey];
                                    console.log(`Found value for ${altKey}:`, value);
                                    break;
                                }
                            }
                        }

                        if (value !== null && value !== undefined) {
                            console.log(`Processing ${metric} for month ${idx}:`, value);
                            entry[`evergreen_${metric}${suffix}`] = (entry[`evergreen_${metric}${suffix}`] || 0) +
                                (value * evergreenWeight);
                            entry[`deciduous_${metric}${suffix}`] = (entry[`deciduous_${metric}${suffix}`] || 0) +
                                (value * deciduousWeight);
                        }
                    });

                    // Calculate NDVI for each type
                    if (plotData[`${idx}_B8`] !== null && plotData[`${idx}_B4`] !== null) {
                        const ndvi = (plotData[`${idx}_B8`] - plotData[`${idx}_B4`]) /
                            (plotData[`${idx}_B8`] + plotData[`${idx}_B4`]);
                        entry[`evergreen_NDVI${suffix}`] = (entry[`evergreen_NDVI${suffix}`] || 0) +
                            (ndvi * evergreenWeight);
                        entry[`deciduous_NDVI${suffix}`] = (entry[`deciduous_NDVI${suffix}`] || 0) +
                            (ndvi * deciduousWeight);
                    }
                }
            });

        return entry;
    });
};

const views = {
    backscatter: {
        title: "Sentinel-1 Backscatter by Tree Type",
        lines: selectedYear === 'all'
            ? years.flatMap(year => [
                { key: `evergreen_VHAsc_${year}`, color: `hsl(120, ${year*10}%, 40%)`, name: `Evergreen VH ${year}` },
                { key: `deciduous_VHAsc_${year}`, color: `hsl(30, ${year*10}%, 40%)`, name: `Deciduous VH ${year}` },
                { key: `evergreen_VVAsc_${year}`, color: `hsl(120, ${year*10}%, 60%)`, name: `Evergreen VV ${year}` },
                { key: `deciduous_VVAsc_${year}`, color: `hsl(30, ${year*10}%, 60%)`, name: `Deciduous VV ${year}` }
            ])
            : [
                { key: "evergreen_VHAsc", color: "#2e7d32", name: "Evergreen VH" },
                { key: "deciduous_VHAsc", color: "#ed6c02", name: "Deciduous VH" },
                { key: "evergreen_VVAsc", color: "#1b5e20", name: "Evergreen VV" },
                { key: "deciduous_VVAsc", color: "#e65100", name: "Deciduous VV" }
            ],
        yAxisDomain: [-20, -5]
    },
    optical: {
        title: "Sentinel-2 Optical by Tree Type",
        lines: selectedYear === 'all'
            ? years.flatMap(year => [
                { key: `evergreen_B4_${year}`, color: `hsl(120, ${year*10}%, 40%)`, name: `Evergreen Red ${year}` },
                { key: `deciduous_B4_${year}`, color: `hsl(30, ${year*10}%, 40%)`, name: `Deciduous Red ${year}` },
                { key: `evergreen_B8_${year}`, color: `hsl(120, ${year*10}%, 60%)`, name: `Evergreen NIR ${year}` },
                { key: `deciduous_B8_${year}`, color: `hsl(30, ${year*10}%, 60%)`, name: `Deciduous NIR ${year}` }
            ])
            : [
                { key: "evergreen_B4", color: "#2e7d32", name: "Evergreen Red" },
                { key: "deciduous_B4", color: "#ed6c02", name: "Deciduous Red" },
                { key: "evergreen_B8", color: "#1b5e20", name: "Evergreen NIR" },
                { key: "deciduous_B8", color: "#e65100", name: "Deciduous NIR" }
            ],
        yAxisDomain: [0, 5000]
    },
    ndvi: {
        title: "Vegetation Index by Tree Type",
        lines: selectedYear === 'all'
            ? years.flatMap(year => [
                { key: `evergreen_NDVI_${year}`, color: `hsl(120, ${year*10}%, 50%)`, name: `Evergreen ${year}` },
                { key: `deciduous_NDVI_${year}`, color: `hsl(30, ${year*10}%, 50%)`, name: `Deciduous ${year}` }
            ])
            : [
                { key: "evergreen_NDVI", color: "#2e7d32", name: "Evergreen NDVI" },
                { key: "deciduous_NDVI", color: "#ed6c02", name: "Deciduous NDVI" }
            ],
        yAxisDomain: [-1, 1]
    }
};

const currentView = views[selectedView];
const processedData = processDataByTreeType(yearData);

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
                    {selectedYear === 'all' ? 'All Years' : selectedYear} {currentView.title}
                </h3>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400} className="min-h-[400px]">
                    <LineChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis
                            domain={currentView.yAxisDomain}
                            tickCount={10}
                            label={{
                                value: currentView.title === "Sentinel-1 Backscatter by Tree Type" ? 'Backscatter (dB)' : 'Value',
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
    </div>
);
};

export default TreeTypeSentinelExplorer;