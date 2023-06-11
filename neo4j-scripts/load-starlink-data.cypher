LOAD CSV WITH HEADERS FROM 'https://adb-satellite-project.s3.eu-central-1.amazonaws.com/starlink-satellite-locations.csv' AS row
CREATE (s:starlinkSatellite {
  noradCatId: row.noradCatId,
  satellite: row.satellite,
  latitude: toFloat(row.latitude),
  longitude: toFloat(row.longitude)
})

LOAD CSV WITH HEADERS FROM 'https://adb-satellite-project.s3.eu-central-1.amazonaws.com/ground-station-locations.csv' AS row
CREATE (g:groundStation {
  id: row.id,
  groundStation: row.groundStation,
  latitude: toFloat(row.latitude),
  longitude: toFloat(row.longitude)
})

MATCH (s:starlinkSatellite), (g:groundStation)
WITH s, g, point.distance(
  point({latitude: s.latitude, longitude: s.longitude}),
  point({latitude: g.latitude, longitude: g.longitude})
) AS dist
ORDER BY dist
WITH s, COLLECT(g) AS closestStations, MIN(dist) AS minDist
FOREACH (cs IN closestStations[0..1] |
  MERGE (s)-[:CLOSEST_TO {distance: minDist}]->(cs)
)
