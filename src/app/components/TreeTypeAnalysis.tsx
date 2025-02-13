'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Papa from 'papaparse';

const treeTypeClassification = {
    // Deciduous (Broadleaf) Trees
    'Acer platanoides L.': 'deciduous',        // Norway Maple
    'Acer pseudoplatanus L.': 'deciduous',     // Sycamore Maple
    'Alnus glutinosa (L.) Gaertn.': 'deciduous', // Black Alder
    'Alnus incana (L.) Moench': 'deciduous',   // Grey Alder
    'Alnus spp.': 'deciduous',                 // Alder species
    'Betula pendula Roth': 'deciduous',        // Silver Birch
    'Betula pubescens Ehrh.': 'deciduous',     // Downy Birch
    'Betula spp.': 'deciduous',                // Birch species
    'Carpinus betulus L.': 'deciduous',        // European Hornbeam
    'Fagus sylvatica L.': 'deciduous',         // European Beech
    'Fraxinus excelsior L.': 'deciduous',      // European Ash
    'Other broadleaved': 'deciduous',          // Other broadleaf trees
    'Populus tremula L.': 'deciduous',         // European Aspen
    'Prunus avium L.': 'deciduous',            // Wild Cherry
    'Quercus spp.': 'deciduous',               // Oak species
    'Salix caprea L.': 'deciduous',            // Goat Willow
    'Salix spp.': 'deciduous',                 // Willow species
    'Sorbus aucuparia L.': 'deciduous',        // Rowan
    'Sorbus intermedia (Ehrh.) Pers.': 'deciduous', // Swedish Whitebeam
    'Sorbus spp.': 'deciduous',                // Sorbus species
    'Tilia spp.': 'deciduous',                 // Lime/Linden species
    'Ulmus spp.': 'deciduous',                 // Elm species

    // Evergreen (Coniferous) Trees
    'Juniperus spp.\n': 'evergreen',           // Juniper species
    'Larix spp.': 'deciduous',                 // Larch species (deciduous conifer)
    'Other conifers': 'evergreen',             // Other coniferous trees
    'Picea abies (L.) H.Karst.': 'evergreen',  // Norway Spruce
    'Picea spp.': 'evergreen',                 // Spruce species
    'Pinus contorta Douglas ex Loudon': 'evergreen', // Lodgepole Pine
    'Pinus mugo Turra': 'evergreen',           // Mountain Pine
    'Pinus sylvestris L.': 'evergreen',        // Scots Pine
};

const TreeTypeAnalysis = ({ onPlotSelect, selectedPlot }) => {
    const [treeData, setTreeData] = useState([]);
    const [selectedTreeType, setSelectedTreeType] = useState('all');

    useEffect(() => {
        const loadData = async () => {
            try {
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
                console.error('Error loading tree data:', error);
            }
        };
        loadData();
    }, []);

    const analyzePlotTreeTypes = (plotcode) => {
        const plotTrees = treeData.filter(tree =>
            plotcode ? tree.plotcode === plotcode : true
        );

        const typeCount = plotTrees.reduce((acc, tree) => {
            const type = tree.treeType;
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        const total = Object.values(typeCount).reduce((sum, count) => sum + count, 0);

        return {
            counts: typeCount,
            percentages: Object.entries(typeCount).reduce((acc, [type, count]) => {
                acc[type] = ((count / total) * 100).toFixed(1);
                return acc;
            }, {}),
            total
        };
    };

    const getPlotsByTreeType = (type) => {
        if (type === 'all') return new Set(treeData.map(tree => tree.plotcode));
        return new Set(treeData.filter(tree => tree.treeType === type).map(tree => tree.plotcode));
    };

    const handleTreeTypeChange = (type) => {
        setSelectedTreeType(type);
        // If the currently selected plot doesn't contain the selected tree type,
        // reset the plot selection
        const plotsWithType = getPlotsByTreeType(type);
        if (selectedPlot && !plotsWithType.has(selectedPlot)) {
            onPlotSelect(null);
        }
    };

    const analysis = selectedPlot ? analyzePlotTreeTypes(selectedPlot) : analyzePlotTreeTypes();

    return (
        <Card className="mb-4">
            <CardHeader>
                <h3 className="text-lg font-semibold">Tree Type Analysis</h3>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Tree Type Filter */}
                    <div className="flex items-center gap-4">
                        <label className="font-medium">Filter by tree type:</label>
                        <select
                            value={selectedTreeType}
                            onChange={(e) => handleTreeTypeChange(e.target.value)}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Tree Types</option>
                            <option value="evergreen">Evergreen</option>
                            <option value="deciduous">Deciduous</option>
                        </select>
                    </div>

                    {/* Analysis Results */}
                    <div className="mt-4">
                        <h4 className="font-semibold mb-2">Distribution:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(analysis.counts).map(([type, count]) => (
                                <div
                                    key={type}
                                    className="p-4 rounded-lg bg-gray-50 border border-gray-200"
                                >
                                    <div className="text-lg font-semibold capitalize">
                                        {type}
                                    </div>
                                    <div className="text-gray-600">
                                        {count} trees ({analysis.percentages[type]}%)
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 text-sm text-gray-600">
                            Total trees analyzed: {analysis.total}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default TreeTypeAnalysis;