'use client';

import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import _ from 'lodash';

const TreeDataProvider = ({ children }) => {
    const [yearData, setYearData] = useState({});
    const [treeData, setTreeData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const years = [2017, 2018, 2019, 2020];

// Helper function to calculate standard deviation
    const calculateStdDev = (values) => {
        const mean = _.mean(values);
        const squareDiffs = values.map(value => {
            const diff = value - mean;
            return diff * diff;
        });
        const avgSquareDiff = _.mean(squareDiffs);
        return Math.sqrt(avgSquareDiff);
    };

    const calculateNDVI = (nir, red) => {
        if (null === nir || null === red) return 0;
        return (nir - red) / (nir + red);
    }

    const processYearData = (data) => {
        // Group data by month (assuming VHAsc and VVAsc columns are prefixed with month numbers)
        const monthlyData = {};

        // Get all column names
        const columns = Object.keys(data[0] || {});

        // Find columns for each parameter type
        const vhColumns = columns.filter(col => col.endsWith('_VHAsc'));
        const vvColumns = columns.filter(col => col.endsWith('_VVAsc'));
        const ndviColumns = columns.filter(col => col.endsWith('_NDVI'));
        const b4Columns = columns.filter(col => col.endsWith('_B4'));
        const b5Columns = columns.filter(col => col.endsWith('_B5')); // Red Edge
        const b8Columns = columns.filter(col => col.endsWith('_B8')); // NIR near ir
        const b11Columns = columns.filter(col => col.endsWith('_B11')); // SWIR
        const b12Columns = columns.filter(col => col.endsWith('_B12')); // SWIR2

        // Sort them by month number
        const sortByMonth = (a, b) => parseInt(a.split('_')[0]) - parseInt(b.split('_')[0]);
        vhColumns.sort(sortByMonth);
        vvColumns.sort(sortByMonth);
        ndviColumns.sort(sortByMonth);
        b4Columns.sort(sortByMonth);
        b5Columns.sort(sortByMonth);
        b8Columns.sort(sortByMonth);
        b11Columns.sort(sortByMonth);
        b12Columns.sort(sortByMonth);

        // Process each row
        data.forEach(row => {
            vhColumns.forEach((vhCol, index) => {
                const month = index;
                const vvCol = vvColumns[index];
                const ndviCol = ndviColumns[index];
                const b4Col = b4Columns[index];
                const b5Col = b5Columns[index];
                const b8Col = b8Columns[index];
                const b11Col = b11Columns[index];
                const b12Col = b12Columns[index];

                if (!monthlyData[month]) {
                    monthlyData[month] = [];
                }

                let ndvi = calculateNDVI(row[b8Col], row[b4Col]);

                monthlyData[month].push({
                    // Basic plot information
                    plotcode: row.plotcode,
                    longitude: row.longitude_generalised,
                    latitude: row.latitude_generalised,

                    // Environmental parameters
                    wai: row.wai,
                    sgdd: row.sgdd,

                    // Radar backscatter parameters
                    vhAsc: row[vhCol],
                    vvAsc: row[vvCol],
                    vhvvRatio: row[vhCol] - row[vvCol],

                    // Optical parameters
                    ndvi: ndvi,
                    redEdge: row[b5Col],
                    red: row[b4Col],
                    swir: row[b11Col],
                    swir2: row[b12Col],

                    // Survey dates if available
                    surveydate1: row.surveydate1,
                    surveydate2: row.surveydate2,

                    // Years
                    year1: row.year1,
                    year2: row.year2
                });
            });
        });

        // Calculate monthly averages
        const monthlyAverages = {};
        Object.entries(monthlyData).forEach(([month, measurements]) => {
            monthlyAverages[month] = {
                // Radar parameters
                vhAsc: _.meanBy(measurements, 'vhAsc'),
                vvAsc: _.meanBy(measurements, 'vvAsc'),
                vhvvRatio: _.meanBy(measurements, 'vhvvRatio'),

                // Optical parameters
                ndvi: _.meanBy(measurements, 'ndvi'),
                redEdge: _.meanBy(measurements, 'redEdge'),
                red: _.meanBy(measurements, 'red'),
                swir: _.meanBy(measurements, 'swir'),
                swir2: _.meanBy(measurements, 'swir2'),

                // Environmental parameters
                wai: _.meanBy(measurements, 'wai'),
                sgdd: _.meanBy(measurements, 'sgdd'),

                // Keep track of number of measurements
                count: measurements.length,

                // Calculate standard deviations
                vhAsc_std: _.round(calculateStdDev(measurements.map(m => m.vhAsc)), 3),
                vvAsc_std: _.round(calculateStdDev(measurements.map(m => m.vvAsc)), 3),
                ndvi_std: _.round(calculateStdDev(measurements.map(m => m.ndvi)), 3)
            };
        });

        return monthlyAverages;
    };


    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Load Sentinel data
                const yearDataObj = {};
                for (const year of years) {
                    try {
                        const meanResponse = await fetch(`/features_${year}_mean.csv`);
                        if (!meanResponse.ok) {
                            throw new Error(`Failed to fetch data for year ${year}`);
                        }
                        const meanText = await meanResponse.text();

                        // Parse CSV
                        const results = await new Promise((resolve, reject) => {
                            Papa.parse(meanText, {
                                header: true,
                                dynamicTyping: true,
                                skipEmptyLines: true,
                                complete: (results) => {
                                    if (results.errors.length > 0) {
                                        console.warn(`CSV parsing warnings for ${year}:`, results.errors);
                                    }
                                    resolve(results);
                                },
                                error: (error) => reject(error)
                            });
                        });

                        if (results.data.length === 0) {
                            throw new Error(`No data found for year ${year}`);
                        }

                        // Process the data
                        const processedData = processYearData(results.data);
                        yearDataObj[year] = processedData;

                        console.log(`Processed data for ${year}:`, processedData);

                    } catch (yearError) {
                        console.error(`Error processing year ${year}:`, yearError);
                        setError(yearError);
                        return;
                    }
                }

                setYearData(yearDataObj);

                // Load tree data with similar robust parsing
                const treesResponse = await fetch('/trees_finland_and_sweden_parsed.csv');
                if (!treesResponse.ok) {
                    throw new Error('Failed to fetch tree data');
                }
                const treesText = await treesResponse.text();

                const treeResults = await new Promise((resolve, reject) => {
                    Papa.parse(treesText, {
                        header: true,
                        dynamicTyping: true,
                        skipEmptyLines: true,
                        complete: (results) => resolve(results),
                        error: (error) => reject(error)
                    });
                });

                if (treeResults.data.length === 0) {
                    throw new Error('No tree data found');
                }

                const enrichedTreeData = treeResults.data
                    .filter(tree => tree.plotcode && tree.taxonname)
                    .map(tree => ({
                        ...tree,
                        plotcode: Number(tree.plotcode),
                        treeType: tree.treeType || 'unknown',
                        originalTaxonname: tree.taxonname
                    }));

                setTreeData(enrichedTreeData);

            } catch (error) {
                console.error('Error loading data:', error);
                setError(error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-4">
                    <div className="animate-pulse">
                        Loading tree data...
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    {error.message || 'An error occurred while loading the data'}
                </AlertDescription>
            </Alert>
        );
    }

    // Pass the data as regular props
    return React.cloneElement(children, { yearData, treeData });
};

export default TreeDataProvider;