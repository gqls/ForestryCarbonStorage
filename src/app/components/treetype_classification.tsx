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
    'Juniperus spp.': 'evergreen',           // Juniper species
    'Larix spp.': 'deciduous',                 // Larch species (deciduous conifer)
    'Other conifers': 'evergreen',             // Other coniferous trees
    'Picea abies (L.) H.Karst.': 'evergreen',  // Norway Spruce
    'Picea spp.': 'evergreen',                 // Spruce species
    'Pinus contorta Douglas ex Loudon': 'evergreen', // Lodgepole Pine
    'Pinus mugo Turra': 'evergreen',           // Mountain Pine
    'Pinus sylvestris L.': 'evergreen',        // Scots Pine
};

// Function to get tree type
const getTreeType = (taxonname) => {
    return treeTypeClassification[taxonname] || 'unknown';
};

// Function to enrich tree data with type information
const enrichTreeData = (treeData) => {
    return treeData.map(tree => ({
        ...tree,
        treeType: getTreeType(tree.taxonname)
    }));
};

// Function to analyze plot composition by tree type
const analyzePlotTreeTypes = (trees) => {
    const typeCount = trees.reduce((acc, tree) => {
        const type = getTreeType(tree.taxonname);
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    const total = Object.values(typeCount).reduce((sum, count) => sum + count, 0);

    return {
        counts: typeCount,
        percentages: Object.entries(typeCount).reduce((acc, [type, count]) => {
            acc[type] = ((count / total) * 100).toFixed(1);
            return acc;
        }, {})
    };
};

export { treeTypeClassification, getTreeType, enrichTreeData, analyzePlotTreeTypes };