'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import _ from 'lodash';

const AggregatedPlotsAnalysis = ({
                                     yearData,
                                     yearStdData,
                                     selectedYear = 'all',
                                     selectedView = 'backscatter',
                                     years = [2017, 2018, 2019, 2020, 2021, 2022],
                                     months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                                 }) => {
    const processAggregatedData = (data) => {
        console.log("========== START AGGREGATED PROCESSING ==========");

        if (!data || Object.keys(data).length === 0) {
            console.log("No data available for aggregation");
            return [];
        }

        // Process monthly averages across all plots
        return months.map((month, idx) => {
            console.log(`Processing month: ${month} (index: ${idx})`);
            const entry = { month };

            // If viewing all years, process each year separately
            const yearsToProcess = selectedYear === 'all' ? years : [selectedYear];
            console.log("Years to process:", yearsToProcess);

            yearsToProcess.forEach(year => {
                if (!data[year]) {
                    console.log(`No data for year ${year}`);
                    return;
                }

                const plotsData = data[year];
                console.log(`Year ${year} has ${plotsData.length} plots`);

                // Create an array of metrics we want to average
                const metrics = [
                    { name: 'VHAsc', suffix: selectedYear === 'all' ? `_${year}` : '' },
                    { name: 'VVAsc', suffix: selectedYear === 'all' ? `_${year}` : '' },
                    { name: 'VHDes', suffix: selectedYear === 'all' ? `_${year}` : '' },
                    { name: 'VVDes', suffix: selectedYear === 'all' ? `_${year}` : '' },
                    { name: 'B2', suffix: selectedYear === 'all' ? `_${year}` : '' },
                    { name: 'B3', suffix: selectedYear === 'all' ? `_${year}` : '' },
                    { name: 'B4', suffix: selectedYear === 'all' ? `_${year}` : '' },
                    { name: 'B8', suffix: selectedYear === 'all' ? `_${year}` : '' }
                ];

                // Calculate averages for each metric
                metrics.forEach(metric => {
                    const validPlots = plotsData.filter(plot => plot[`${idx}_${metric.name}`] !== null);

                    if (validPlots.length > 0) {
                        const outputKey = `${metric.name}${metric.suffix}`;
                        entry[outputKey] = _.meanBy(validPlots, plot => plot[`${idx}_${metric.name}`]);
                        entry[`${outputKey}_count`] = validPlots.length;
                    }
                });

                // Calculate NDVI from averaged B4 and B8
                const b8Key = `B8${selectedYear === 'all' ? `_${year}` : ''}`;
                const b4Key = `B4${selectedYear === 'all' ? `_${year}` : ''}`;

                if (entry[b8Key] != null && entry[b4Key] != null) {
                    const ndviKey = `NDVI${selectedYear === 'all' ? `_${year}` : ''}`;
                    entry[ndviKey] = (entry[b8Key] - entry[b4Key]) / (entry[b8Key] + entry[b4Key]);
                }
            });

            return entry;
        });
    };

    const views = {
        backscatter: {
            title: "Average Sentinel-1 Backscatter",
            lines: selectedYear === 'all'
                ? years.flatMap(year => [
                    { key: `VHAsc_${year}`, color: `hsl(${(year-2017)*30}, 70%, 50%)`, name: `VH Asc ${year}` },
                    { key: `VVAsc_${year}`, color: `hsl(${(year-2017)*30}, 70%, 70%)`, name: `VV Asc ${year}` }
                ])
                : [
                    { key: "VHAsc", color: "#8884d8", name: "VH Ascending" },
                    { key: "VVAsc", color: "#82ca9d", name: "VV Ascending" },
                    { key: "VHDes", color: "#ffc658", name: "VH Descending" },
                    { key: "VVDes", color: "#ff7300", name: "VV Descending" }
                ],
            yAxisDomain: [-20, -5]
        },
        optical: {
            title: "Average Sentinel-2 Optical",
            lines: selectedYear === 'all'
                ? years.flatMap(year => [
                    { key: `B2_${year}`, color: `hsl(${(year-2017)*30}, 70%, 40%)`, name: `Blue ${year}` },
                    { key: `B3_${year}`, color: `hsl(${(year-2017)*30}, 70%, 50%)`, name: `Green ${year}` },
                    { key: `B4_${year}`, color: `hsl(${(year-2017)*30}, 70%, 60%)`, name: `Red ${year}` },
                    { key: `B8_${year}`, color: `hsl(${(year-2017)*30}, 70%, 70%)`, name: `NIR ${year}` }
                ])
                : [
                    { key: "B2", color: "#3498db", name: "Blue (B2)" },
                    { key: "B3", color: "#2ecc71", name: "Green (B3)" },
                    { key: "B4", color: "#e74c3c", name: "Red (B4)" },
                    { key: "B8", color: "#8884d8", name: "NIR (B8)" }
                ],
            yAxisDomain: [0, 5000]
        },
        ndvi: {
            title: "Average Vegetation Index",
            lines: selectedYear === 'all'
                ? years.map(year => (
                    { key: `NDVI_${year}`, color: `hsl(${(year-2017)*30}, 70%, 50%)`, name: `NDVI ${year}` }
                ))
                : [
                    { key: "NDVI", color: "#2ecc71", name: "NDVI" }
                ],
            yAxisDomain: [-1, 1]
        }
    };

    const currentView = views[selectedView];
    const processedMeanData = processAggregatedData(yearData);
    const processedStdData = processAggregatedData(yearStdData);

    return (
        <div className="space-y-4">
            {Object.keys(yearData).length === 0 ? (
                <div className="text-center p-4">Loading data...</div>
            ) : (
                <>
                    {/* Mean Values Chart */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">
                                {selectedYear === 'all' ? 'All Years' : selectedYear} Mean {currentView.title}
                            </h3>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400} className="min-h-[400px]">
                                <LineChart data={processedMeanData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis
                                        domain={currentView.yAxisDomain}
                                        tickCount={10}
                                        label={{
                                            value: currentView.title === "Average Sentinel-1 Backscatter" ? 'Backscatter (dB)' : 'Value',
                                            angle: -90,
                                            position: 'insideLeft'
                                        }}
                                    />
                                    <Tooltip
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-white p-2 border rounded shadow">
                                                        <p className="font-semibold">{label}</p>
                                                        {payload.map((entry, index) => (
                                                            <p key={index} style={{ color: entry.color }}>
                                                                {entry.name}: {entry.value?.toFixed(2)}
                                                                {entry.payload[`${entry.dataKey}_count`] &&
                                                                    ` (n=${entry.payload[`${entry.dataKey}_count`]})`}
                                                            </p>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
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

                    {/* Standard Deviation Chart */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">
                                {selectedYear === 'all' ? 'All Years' : selectedYear} Standard Deviation {currentView.title}
                            </h3>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400} className="min-h-[400px]">
                                <LineChart data={processedStdData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis
                                        domain={['auto', 'auto']}
                                        tickCount={10}
                                        label={{
                                            value: 'Standard Deviation',
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
                </>
            )}
        </div>
    );
};

export default AggregatedPlotsAnalysis;