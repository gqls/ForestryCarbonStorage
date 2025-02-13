// Importing plot data
var plotData2 = [
    {plotcode: "1013901", country: "Finland", surveydate1: "1986-09-11", surveydate2: "1995-08-02", longitude: 24.1602326383978, latitude: 67.0164661885414, management2: 0},
    {plotcode: "1013903", country: "Finland", surveydate1: "1986-09-11", surveydate2: "1995-08-02", longitude: 24.1488494570158, latitude: 67.0054218254972, management2: null},
    {plotcode: "1014301", country: "Finland", surveydate1: "1986-09-12", surveydate2: "1995-08-11", longitude: 24.8813102085421, latitude: 67.0411937799842, management2: 0},
    {plotcode: "1014302", country: "Finland", surveydate1: "1986-09-12", surveydate2: "1995-08-11", longitude: 24.8923257088473, latitude: 67.051180229725, management2: 0},
    {plotcode: "1014701", country: "Finland", surveydate1: "1986-06-28", surveydate2: "1995-08-08", longitude: 25.5995313409067, latitude: 67.031001716209, management2: 0},
    {plotcode: "1014702", country: "Finland", surveydate1: "1986-06-28", surveydate2: "1995-08-08", longitude: 25.6246834708474, latitude: 67.0540931449452, management2: 0}
];



// Convert plot data to a FeatureCollection
var features = plotData.map(function(plot) {
    return ee.Feature(ee.Geometry.Point([plot.longitude, plot.latitude]), {
        plotcode: plot.plotcode,
        country: plot.country,
        surveydate1: plot.surveydate1,
        surveydate2: plot.surveydate2,
        management2: plot.management2
    });
});

var featureCollection = ee.FeatureCollection(features);

// Add the points to the map
Map.centerObject(featureCollection, 6); // Adjust zoom level as needed
Map.addLayer(featureCollection, {color: 'red'}, 'Plot Locations');

// Print to console for verification
print('FeatureCollection:', featureCollection);