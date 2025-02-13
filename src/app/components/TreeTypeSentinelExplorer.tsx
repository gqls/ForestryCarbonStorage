'use client';

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
    //const years = [2017, 2018, 2019, 2020, 2021, 2022];
    const years = [2017, 2018];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
                const treesResponse = await fetch('/trees_finland_and_sweden.csv');
                const treesText = await treesResponse.text();
                Papa.parse(treesText, {
                    header: true,
                    dynamicTyping: true,
                    complete: (results) => {
                        const enrichedData = results.data.map(tree => ({
                            ...tree,
                            treeType: treeTypeClassification[tree.taxonname] || 'unknown'
                        }));
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
            return [];
        }

        // Get tree types for the selected plot
        const plotTreeTypes = _.groupBy(
            treeData.filter(tree =>
                selectedPlot ? tree.plotcode === selectedPlot : true
            ),
            'plotcode'
        );

        return months.map((month, idx) => {
            const entry = { month };

            const yearsToProcess = selectedYear === 'all' ? years : [selectedYear];

            yearsToProcess.forEach(year => {
                if (!data[year]) return;

                // Process data for each plot
                const plotsData = data[year];
                plotsData.forEach(plotData => {
                    const plotTrees = plotTreeTypes[plotData.plotcode];
                    if (!plotTrees) return;

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
                            const value = plotData[`${idx}_${metric}`];
                            if (value !== null) {
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