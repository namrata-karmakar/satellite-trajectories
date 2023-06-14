LOAD CSV WITH HEADERS FROM 'https://adb-satellite-project.s3.eu-central-1.amazonaws.com/countries.csv' AS countryRow
CREATE (c:Country { countryCode: countryRow.countryCode, name: countryRow.country })

LOAD CSV WITH HEADERS FROM 'https://adb-satellite-project.s3.eu-central-1.amazonaws.com/ground-station-locations.csv' AS groundStnRow
CREATE (g:GroundStation {
  id: groundStnRow.id,
  name: groundStnRow.groundStationCity,
  latitude: toFloat(groundStnRow.latitude),
  longitude: toFloat(groundStnRow.longitude),
  countryCode: groundStnRow.countryCode
})

LOAD CSV WITH HEADERS FROM 'https://adb-satellite-project.s3.eu-central-1.amazonaws.com/starlink-satellite-locations.csv' AS satRow
CREATE (s:StarlinkSatellite {
  noradCatId: satRow.noradCatId,
  name: satRow.name,
  latitude: toFloat(satRow.latitude),
  longitude: toFloat(satRow.longitude)
})

MATCH (c:Country), (g:GroundStation)
WHERE c.countryCode = g.countryCode
MERGE (g)-[:IN_COUNTRY]->(c)

MATCH (s:StarlinkSatellite), (g:GroundStation)
WITH s, g, point.distance(
  point({latitude: s.latitude, longitude: s.longitude}),
  point({latitude: g.latitude, longitude: g.longitude})
) AS dist
WHERE dist > 100000 AND dist < 500000
WITH s, g, dist
MERGE (s)-[:CLOSEST_TO {distance: dist}]->(g)