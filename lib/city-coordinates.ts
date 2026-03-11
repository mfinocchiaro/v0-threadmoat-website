/**
 * Static geocoding lookup for cities appearing in the startup database.
 * Key format: "City|Country" (case-sensitive, matching extractCity() output).
 * Values: [longitude, latitude]
 */
export const CITY_COORDINATES: Record<string, [number, number]> = {
  // United States — major hubs
  "San Francisco|United States": [-122.4194, 37.7749],
  "San Francisco|USA": [-122.4194, 37.7749],
  "San Francisco Bay Area|United States": [-122.4194, 37.7749],
  "New York|United States": [-74.006, 40.7128],
  "New York City|United States": [-74.006, 40.7128],
  "Boston|United States": [-71.0589, 42.3601],
  "Los Angeles|United States": [-118.2437, 34.0522],
  "Los Angeles|USA": [-118.2437, 34.0522],
  "Cambridge|United States": [-71.1097, 42.3736],
  "Austin|United States": [-97.7431, 30.2672],
  "Atlanta|United States": [-84.388, 33.749],
  "Redwood City|United States": [-122.2361, 37.4852],
  "Seattle|United States": [-122.3321, 47.6062],
  "Palo Alto|United States": [-122.1430, 37.4419],
  "San Jose|United States": [-121.8863, 37.3382],
  "Chicago|United States": [-87.6298, 41.8781],
  "Chicago IL|United States": [-87.6298, 41.8781],
  "Mountain View|United States": [-122.0838, 37.3861],
  "Berkeley|United States": [-122.2727, 37.8716],
  "Denver|United States": [-104.9903, 39.7392],
  "Miami|United States": [-80.1918, 25.7617],
  "Pittsburgh|United States": [-79.9959, 40.4406],
  "Irvine|United States": [-117.7712, 33.6846],
  "San Mateo|United States": [-122.3255, 37.5630],
  "Rochester|United States": [-77.6109, 43.1566],
  "Somerville|United States": [-71.0995, 42.3876],
  "Houston|United States": [-95.3698, 29.7604],
  "Houston|USA": [-95.3698, 29.7604],
  "Portland|United States": [-122.6765, 45.5231],
  "Santa Clara|United States": [-121.9552, 37.3541],
  "Oakland|United States": [-122.2712, 37.8044],
  "Arlington|United States": [-77.091, 38.8799],
  "Brooklyn|United States": [-73.9442, 40.6782],
  "Newark|United States": [-74.1724, 40.7357],
  "Detroit|United States": [-83.0458, 42.3314],
  "Philadelphia|United States": [-75.1652, 39.9526],
  "Champaign|United States": [-88.2434, 40.1164],
  "Tustin|United States": [-117.8264, 33.7458],
  "San Diego|United States": [-117.1611, 32.7157],
  "Chatsworth|United States": [-118.6065, 34.2573],
  "Santa Monica|United States": [-118.4912, 34.0195],
  "Culver City|United States": [-118.3965, 33.9817],
  "Brea|United States": [-117.9001, 33.9167],
  "Burlington|United States": [-71.1956, 42.5048],
  "Salt Lake City|United States": [-111.891, 40.7608],
  "Washington|United States": [-77.0369, 38.9072],
  "Charlottesville|United States": [-78.4767, 38.0293],
  "Malibu|United States": [-118.7798, 34.0259],
  "Columbus|United States": [-82.9988, 39.9612],
  "Jersey City|United States": [-74.0431, 40.7178],
  "Los Altos|United States": [-122.1141, 37.3852],
  "Los Altos|USA": [-122.1141, 37.3852],
  "Wilmington|United States": [-75.5398, 39.7391],
  "Pleasonton|United States": [-121.8747, 37.6604],
  "Chula Vista|United States": [-117.0842, 32.6401],
  "Folsom|United States": [-121.1761, 38.6780],
  "Kent|United States": [-122.2348, 47.3809],
  "Northampton|United States": [-72.6354, 42.3192],
  "Tysons|United States": [-77.2311, 38.9187],
  "Durham|United States": [-78.8986, 35.994],
  "Naples|United States": [-81.7948, 26.142],
  "St. Joseph|United States": [-94.8467, 39.7687],
  "California|United States": [-119.4179, 36.7783],
  "Charleston|United States": [-79.9311, 32.7765],
  "Raleigh|United States": [-78.6382, 35.7796],
  "Franklin|United States": [-86.8689, 35.9251],
  "Boulder|United States": [-105.2705, 40.015],
  "Warrenville|United States": [-88.1734, 41.8183],
  "Des Moines|United States": [-93.6091, 41.5868],
  "Sunnyvale|United States": [-122.0363, 37.3688],
  "Dayton|United States": [-84.1916, 39.7589],
  "Daytona Beach|United States": [-81.0228, 29.2108],
  "Hollywood|United States": [-118.3287, 34.0928],
  "Dallas|United States": [-96.797, 32.7767],
  "Akron|United States": [-81.5190, 41.0814],
  "New London|United States": [-72.0995, 41.3557],
  "Los Gatos|United States": [-121.9624, 37.2358],
  "Concord|USA": [-122.0311, 37.978],
  "Bethlehem|United States": [-75.3785, 40.6259],
  "Phoenix|United States": [-112.074, 33.4484],
  "Hazlet|United States": [-74.1738, 40.4157],
  "Inglewood|United States": [-118.3531, 33.9617],
  "Cleveland|United States": [-81.6944, 41.4993],
  "Albuquerque|United States": [-106.6504, 35.0844],
  "Delaware|United States": [-75.5277, 38.9108],
  "Minneaopolis|United States": [-93.265, 44.9778],
  "Nowhere|United States": [-98.5795, 39.8283], // geographic center of US

  // United Kingdom
  "London|United Kingdom": [-0.1278, 51.5074],
  "Greater London|United Kingdom": [-0.1278, 51.5074],
  "Cambridge|United Kingdom": [0.1218, 52.2053],
  "Oxford|United Kingdom": [-1.2577, 51.752],
  "Sheffield|United Kingdom": [-1.4701, 53.3811],
  "Bristol|United Kingdom": [-2.5879, 51.4545],
  "Belfast|United Kingdom": [-5.9301, 54.5973],
  "Nottingham|United Kingdom": [-1.1581, 52.9548],
  "Rotherham|United Kingdom": [-1.3568, 53.4326],
  "Cranfield|United Kingdom": [-0.6257, 52.0733],
  "Cheshire|United Kingdom": [-2.5928, 53.2326],
  "Leamington Spa|United Kingdom": [-1.5364, 52.2852],
  "Birmingham|United Kingdom": [-1.8904, 52.4862],
  "Bradford|United Kingdom": [-1.7594, 53.7960],
  "Hessle|United Kingdom": [-0.4365, 53.7217],
  "Newcastle upon Tyle|United Kingdom": [-1.6178, 54.9783],
  "Suffolk|United Kingdom": [1.0, 52.19],
  "Bicester|United Kingdom": [-1.1535, 51.9004],
  "Altrincham|United Kingdom": [-2.3543, 53.3878],
  "Leicester|United Kingdom": [-1.1398, 52.6369],

  // Germany
  "Berlin|Germany": [13.405, 52.52],
  "Munich|Germany": [11.582, 48.1351],
  "Stuttgart|Germany": [9.1829, 48.7758],
  "Mannheim|Germany": [8.4660, 49.4875],
  "Darmstadt|Germany": [8.6512, 49.8728],
  "Frankfurt|Germany": [8.6821, 50.1109],
  "Cologne|Germany": [6.9603, 50.9375],
  "Hamburg|Germany": [9.9937, 53.5511],
  "Dortmund|Germany": [7.4653, 51.5136],
  "Paderborn|Germany": [8.7544, 51.7189],
  "Pfaffenhofen an der Ilm|Germany": [11.5108, 48.5283],
  "Weiden in der Oberpfalz|Germany": [12.1628, 49.6769],
  "Cottbus|Germany": [14.3340, 51.7563],
  "Karlsruhe|Germany": [8.4037, 49.0069],
  "Landshut|Germany": [12.1522, 48.5370],
  "Ulm|Germany": [9.9872, 48.4011],
  "Regensburg|Germany": [12.0958, 49.0134],
  "Mainz|Germany": [8.2473, 49.9929],

  // France
  "Paris|France": [2.3522, 48.8566],
  "Toulouse|France": [1.4442, 43.6047],
  "Puteaux|France": [2.2389, 48.8848],
  "Lyon|France": [4.8357, 45.764],
  "Boulogne-Billancourt|France": [2.2399, 48.8396],
  "Talence|France": [-0.5857, 44.8053],

  // Canada
  "Toronto|Canada": [-79.3832, 43.6532],
  "Montreal|Canada": [-73.5673, 45.5017],
  "Montréal|Canada": [-73.5673, 45.5017],
  "Vancouver|Canada": [-123.1216, 49.2827],
  "Kitchener|Canada": [-80.4834, 43.4516],
  "St. John's|Canada": [-52.7126, 47.5615],
  "Longueuil|Canada": [-73.5181, 45.5312],
  "Edmonton|Canada": [-113.4938, 53.5461],
  "New Westminster|Canada": [-122.9109, 49.2057],

  // Israel
  "Tel Aviv|Israel": [34.7818, 32.0853],
  "Tel Aviv-Yafo|Israel": [34.7818, 32.0853],
  "Haifa|Israel": [34.9896, 32.794],
  "Ramat Gan|Israel": [34.8113, 32.068],

  // Switzerland
  "Zürich|Switzerland": [8.5417, 47.3769],
  "Zurich|Switzerland": [8.5417, 47.3769],
  "Lausanne|Switzerland": [6.6323, 46.5197],
  "Solothurn|Switzerland": [7.5369, 47.2088],

  // Austria
  "Vienna|Austria": [16.3738, 48.2082],

  // Sweden
  "Stockholm|Sweden": [18.0686, 59.3293],

  // Finland
  "Helsinki|Finland": [24.9384, 60.1699],
  "Tampere|Finland": [23.7610, 61.4978],
  "Espoo|Finland": [24.6559, 60.2055],

  // Norway
  "Oslo|Norway": [10.7522, 59.9139],
  "Fornebu|Norway": [10.6024, 59.8977],
  "Bærum|Norway": [10.5347, 59.8942],
  "Lysaker|Norway": [10.6373, 59.9127],
  "Holmestrand|Norway": [10.1122, 59.4906],

  // Denmark
  "Copenhagen|Denmark": [12.5683, 55.6761],
  "Aarhus|Denmark": [10.2039, 56.1629],

  // Hungary
  "Budapest|Hungary": [19.0402, 47.4979],

  // Portugal
  "Porto|Portugal": [-8.611, 41.1579],

  // Belgium
  "Brussels|Belgium": [4.3517, 50.8503],
  "Ghent|Belgium": [3.7174, 51.0543],
  "Leuven|Belgium": [4.7005, 50.8798],
  "Antwerp|Belgium": [4.4025, 51.2194],

  // Estonia
  "Tallinn|Estonia": [24.7536, 59.437],

  // Slovakia
  "Bratislava|Slovakia": [17.1077, 48.1486],

  // Japan
  "Tokyo|Japan": [139.6917, 35.6895],

  // Spain
  "Bilbao|Spain": [-2.9253, 43.263],
  "Madrid|Spain": [-3.7038, 40.4168],
  "Madrid and remote|Spain": [-3.7038, 40.4168],
  "Barcelona|Spain": [2.1734, 41.3851],

  // Australia
  "Sydney|Australia": [151.2093, -33.8688],
  "Newcastle|Australia": [151.7817, -32.9283],
  "Shellharbour|Australia": [150.8708, -34.5808],
  "Melbourne|Australia": [144.9631, -37.8136],

  // India
  "Bengaluru|India": [77.5946, 12.9716],
  "Chennai|India": [80.2707, 13.0827],
  "Indore|India": [75.8577, 22.7196],
  "Hyderabad|India": [78.4867, 17.385],
  "Maharashtra|India": [75.7139, 19.7515],
  "Pune|India": [73.8567, 18.5204],
  "Raipur|India": [81.6296, 21.2514],

  // Singapore
  "Singapore|Singapore": [103.8198, 1.3521],

  // Netherlands
  "Eindhoven|Netherlands": [5.4697, 51.4416],

  // Italy
  "Milan|Italy": [9.19, 45.4642],
  "Milano|Italy": [9.19, 45.4642],
  "Rome|Italy": [12.4964, 41.9028],
  "Pont-Saint-Martin|Italy": [7.7937, 45.5983],
  "Cagliari|Italy": [9.12, 39.2238],

  // Ireland
  "Dublin|Ireland": [-6.2603, 53.3498],

  // South Korea
  "Seoul|South Korea": [126.978, 37.5665],

  // Poland
  "Wrocław|Poland": [17.0385, 51.1079],
  "Warsaw|Poland": [21.0122, 52.2297],

  // Romania
  "Bucharest|Romania": [26.1025, 44.4268],

  // Lithuania
  "Vilnius|Lithuania": [25.2798, 54.6872],

  // Latvia
  "Riga|Latvia": [24.1052, 56.9496],

  // Czech Republic
  "Prague|Czech Republic": [14.4378, 50.0755],

  // China
  "Beijing|China": [116.4074, 39.9042],

  // South Africa
  "Cape Town|South Africa": [18.4241, -33.9249],

  // Nigeria
  "Lagos|Nigeria": [3.3792, 6.5244],

  // UAE
  "Dubai|United Arab Emirates": [55.2708, 25.2048],
  "Dubai|UAE": [55.2708, 25.2048],

  // Turkey
  "Istanbul|Turkey": [28.9784, 41.0082],

  // Iceland
  "Reykjavík|Iceland": [-21.9426, 64.1466],

  // Cyprus
  "Limassol|Cyprus": [33.0333, 34.6833],

  // Armenia
  "Yerevan|Armenia": [44.5209, 40.1792],

  // New Zealand
  "Auckland|New Zealand": [174.7633, -36.8485],
  "Albany|New Zealand": [174.806, -36.7310],
}
