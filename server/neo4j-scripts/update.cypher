MATCH (s:StarlinkSatellite)-[oldRel:CLOSEST_TO]->()
DELETE oldRel

LOAD CSV WITH HEADERS FROM 'https://adb-satellite-project.s3.eu-central-1.amazonaws.com/starlink-satellite-locations.csv' AS row
MATCH (s:starlinkSatellite {noradCatId: row.noradCatId})
SET s.latitude = toFloat(row.latitude), s.longitude = toFloat(row.longitude)

MATCH (s:StarlinkSatellite), (g:GroundStation)
WITH s, g, point.distance(
  point({latitude: s.latitude, longitude: s.longitude}),
  point({latitude: g.latitude, longitude: g.longitude})
) AS dist
WHERE dist < 100000
WTIH s, g, dist
MERGE (s)-[:CLOSEST_TO {distance: dist}]->(g)