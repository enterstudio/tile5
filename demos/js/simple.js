map = new T5.Map('mapContainer', {
	renderer: 'canvas',
	padding: 'auto'
});

map.layer('tiles', 'tile', {
	generator: 'osm.cloudmade',
	renderer: DEMO.getRenderer(),
    // demo api key, register for an API key at http://dev.cloudmade.com/
    apikey: '7960daaf55f84bfdb166014d0b9f8d41'
});

map.zoom(8).center(DEMO.getHomePosition());