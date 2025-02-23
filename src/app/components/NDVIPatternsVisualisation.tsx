import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const NDVIPatternsVisualisation = () => {
    const speciesColors = {
        "Picea abies (L.) H.Karst.": "#2E8B57",
        "Pinus sylvestris L.": "#228B22",
        "Betula pubescens Ehrh.": "#90EE90",
        "Betula pendula Roth": "#98FB98",
        "Populus tremula L.": "#3CB371",
        "Salix caprea L.": "#32CD32",
        "Alnus incana (L.) Moench": "#006400",
        "Alnus glutinosa (L.) Gaertn.": "#008000",
        "Sorbus aucuparia L.": "#556B2F",
        "Pinus contorta Douglas ex Loudon": "#8FBC8F",
        "Acer platanoides L.": "#66CDAA",
        "Fraxinus excelsior L.": "#9ACD32"
    };

    const ndviData = [
        // ... your data remains unchanged ...
    ];

    const speciesGroups = {
        "Conifers": ["Picea abies (L.) H.Karst.", "Pinus sylvestris L.", "Pinus contorta Douglas ex Loudon"],
        "Broadleaves": [
            "Betula pubescens Ehrh.", "Betula pendula Roth", "Populus tremula L.",
            "Salix caprea L.", "Alnus incana (L.) Moench", "Alnus glutinosa (L.) Gaertn.",
            "Sorbus aucuparia L.", "Acer platanoides L.", "Fraxinus excelsior L."
        ]
    };

    const [selectedGroup, setSelectedGroup] = useState("Conifers");

    const getSpeciesForGroup = () => speciesGroups[selectedGroup];

    return (
        <Card className="w-full max-w-7xl mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">NDVI Seasonal Patterns by Tree Species</CardTitle>
                <div className="flex gap-4 mt-4">
                    {Object.keys(speciesGroups).map(group => (
                        <button
                            key={group}
                            onClick={() => setSelectedGroup(group)}
                            className={`px-4 py-2 rounded transition-colors duration-200 ${
                                selectedGroup === group
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {group}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                {/* Remove this line as it's just debugging output */}
                {/* <p>{getSpeciesForGroup()}</p> */}
                <div className="w-full h-[400px] mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={ndviData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="month"
                                label={{ value: 'Month', position: 'bottom', offset: 0 }}
                            />
                            <YAxis
                                domain={[0, 1]}
                                label={{ value: 'NDVI', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '5px' }}
                            />
                            <Legend
                                verticalAlign="top"
                                height={36}
                            />
                            {getSpeciesForGroup().map(species => (
                                <Line
                                    key={species}
                                    type="monotone"
                                    dataKey={species}
                                    stroke={speciesColors[species]}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 8 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export default NDVIPatternsVisualisation;