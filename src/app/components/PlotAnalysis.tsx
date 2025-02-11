'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Papa from 'papaparse';

const PlotAnalysis = () => {
    const [treeData, setTreeData] = useState([]);
    const [plotData, setPlotData] = useState([]);
    const [selectedPlot, setSelectedPlot] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [treesResponse, plotsResponse] = await Promise.all([
                    fetch('/trees_finland_and_sweden.csv'),
                    fetch('/plots_finland_and_sweden.csv')
                ]);

                const [treesText, plotsText] = await Promise.all([
                    treesResponse.text(),
                    plotsResponse.text()
                ]);

                Papa.parse(treesText, {
                    header: true,
                    dynamicTyping: true,
                    complete: (results) => setTreeData(results.data)
                });

                Papa.parse(plotsText, {
                    header: true,
                    dynamicTyping: true,
                    complete: (results) => setPlotData(results.data)
                });
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };
        loadData();
    }, []);

    const analyzePlot = (plotcode) => {
        const plotTrees = treeData.filter(tree => tree.plotcode === plotcode);
        const speciesCounts = plotTrees.reduce((acc, tree) => {
            acc[tree.taxonname] = (acc[tree.taxonname] || 0) + 1;
            return acc;
        }, {});

        return {
            total: plotTrees.length,
            species: Object.entries(speciesCounts).sort((a, b) => b[1] - a[1])
        };
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-4 mb-4">
                <select
                    onChange={(e) => setSelectedPlot(parseInt(e.target.value))}
                    className="px-4 py-2 rounded border"
                >
                    <option value="">Select Plot</option>
                    {plotData.map(plot => (
                        <option key={plot.plotcode} value={plot.plotcode}>
                            Plot {plot.plotcode} ({plot.country})
                        </option>
                    ))}
                </select>
            </div>

            {selectedPlot && (
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Plot {selectedPlot} Analysis</h3>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const analysis = analyzePlot(selectedPlot);
                            return (
                                <div>
                                    <p>Total trees: {analysis.total}</p>
                                    <h4 className="font-semibold mt-2">Species Composition:</h4>
                                    <ul className="list-disc pl-5">
                                        {analysis.species.map(([species, count]) => (
                                            <li key={species}>
                                                {species}: {count} trees ({((count/analysis.total)*100).toFixed(1)}%)
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default PlotAnalysis;