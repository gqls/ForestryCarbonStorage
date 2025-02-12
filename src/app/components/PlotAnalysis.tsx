'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Papa from 'papaparse';

const PlotAnalysis = ({ onPlotSelect }) => {
    const [treeData, setTreeData] = useState([]);
    const [plotData, setPlotData] = useState([]);
    const [selectedPlot, setSelectedPlot] = useState(null);
    const defaultPlot = 66;
    const selectAllPlotsString = 'all';

    useEffect(() => {
        const loadData = async () => {
            console.log("plot analysis: loading plot and tree data . . .");
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
                    complete: (results) => {
                        console.log("plot analysis: parsed the tree data, rows:", results.data.length);
                        setTreeData(results.data);
                    }
                });

                Papa.parse(plotsText, {
                    header: true,
                    dynamicTyping: true,
                    complete: (results) => {
                        console.log("parsed the plots data, rows:", results.data.length);
                        setPlotData(results.data);
                    }
                });
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };
        loadData();
    }, []);

    const handlePlotChange = (plotcode) => {
        console.log("plot analysis: plot selection changed to:", plotcode);
        console.log("Plot selection changed:", {
            plotcode,
            type: typeof plotcode,
            isAll: plotcode === selectAllPlotsString
        });
        if (plotcode === selectAllPlotsString) {
            setSelectedPlot(null);
            onPlotSelect(null);
        } else {
            const plot = parseInt(plotcode);
            setSelectedPlot(plot);
            onPlotSelect(plot);
        }

    };

    const analyzePlot = (plotcode) => {
        // if plotcode is null/undefined or 'all', analyse all plots
        const plotTrees = (plotcode && plotcode !== selectAllPlotsString) ?
            treeData.filter(tree => tree.plotcode === plotcode) :
            treeData;

        const speciesCounts = plotTrees.reduce((acc, tree) => {
            if (tree.taxonname) {
                acc[tree.taxonname] = (acc[tree.taxonname] || 0) + 1;
            }
            return acc;
        }, {});

        // add average trees per plot for all view
        const numPlots = !plotcode || plotcode === selectAllPlotsString ?
            new Set(plotTrees.map(tree => tree.plotcode)).size :
            1;

        return {
            total: plotTrees.length,
            numPlots: numPlots,
            treesPerPlot: (plotTrees.length / numPlots).toFixed(1),
            species: Object.entries(speciesCounts).sort((a, b) => b[1] - a[1])
        };
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-4 mb-4">
                <select
                    onChange={(e) => handlePlotChange(e.target.value)}
                    className="px-4 py-2 rounded border"
                >
                    <option value={selectAllPlotsString}>Select Plot</option>
                    <option key='all' value='all'>All Plots</option>
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
                            const plotInfo = plotData.find(p => p.plotcode === selectedPlot);
                            return (
                                <div>
                                    <div className="mb-4">
                                        {plotInfo ? (
                                            <div className="mb-4">
                                                <p>Country: {plotInfo.country}</p>
                                                <p>Survey dates: {plotInfo.surveydate1} to {plotInfo.surveydate2}</p>
                                                <p>Location: {plotInfo.latitude_generalised.toFixed(4)}°N, {plotInfo.longitude_generalised.toFixed(4)}°E</p>
                                            </div>
                                        ) : (
                                            <p>Showing data for all plots</p>
                                        )}
                                    </div>
                                    <p>Total trees: {analysis.total}</p>
                                    {!selectedPlot && <p>Average trees per plot: {analysis.treesPerPlot} (across {analysis.numPlots} plots)</p>}
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