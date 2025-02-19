'use client';

import { useState } from 'react';
import SentinelExplorer from './components/SentinelExplorer';
import TreeTypeSentinelExplorer from './components/TreeTypeSentinelExplorer';
import PlotAnalysis from './components/PlotAnalysis';
import SpeciesNDVIPatterns from "@/app/components/SpeciesNDVIPatterns";

export default function Home() {
	const [selectedPlot, setSelectedPlot] = useState('1014301');

	return (
		<div className="space-y-4">
			{/* Plot selection UI */}
			<PlotAnalysis
				selectedPlot={selectedPlot}
				onPlotSelect={setSelectedPlot}
			/>

			{/* Visualizations that use the selected plot */}
			<SentinelExplorer selectedPlot={selectedPlot} />
			{/*<TreeTypeSentinelExplorer selectedPlot={selectedPlot} />*/}
			<SpeciesNDVIPatterns />
		</div>
	);
}