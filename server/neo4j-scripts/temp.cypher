MATCH (n)
RETURN n

MATCH (n)
DETACH DELETE n

MATCH (:Satellite)-[r:CLOSEST_TO]->(:GroundStation)
DELETE r

MATCH (n:starlinkSatellite {noradCatId: '55574'}) 
RETURN n

MATCH (n:GroundStation {name: 'Lockport, New York'}) 
RETURN n

CREATE (s: Satellite {
  noradCatId: 53150,
  satellite: "STARLINK-4038           ",
  latitude: 17.563359598139744,
  longitude: -120.66547282076296
})
RETURN s

CREATE (g: GroundStation {
  id: 1,
  groundStation: "Baxley, Georgia",
  latitude: 31.7773202,
  longitude: -82.3490533
})
RETURN g

CREATE (g: GroundStation {
  id: 2,
  groundStation: "Fairbanks, Alaska",
  latitude: 64.837845,
  longitude: -147.716675
})
RETURN g

MATCH (s:Satellite), (g:GroundStation)
WITH s, g, point.distance(
  point({latitude: s.latitude, longitude: s.longitude}),
  point({latitude: g.latitude, longitude: g.longitude})
) AS dist
ORDER BY dist
WITH s, COLLECT(g) AS closestStations, MIN(dist) AS minDist
FOREACH (cs IN closestStations[0..1] |
  MERGE (s)-[:CLOSEST_TO {distance: minDist}]->(cs)
)

MATCH (s:Satellite {noradCatId: 53150})
SET s.latitude = 63.01223, s.longitude = -143.3426

MATCH (s:Satellite {noradCatId: 53150})
SET s.latitude =  17.563359598139744, s.longitude = -120.66547282076296

MATCH p=()-[:CLOSEST_TO|IN_COUNTRY]->() RETURN p;





MATCH (s:Satellite)-[oldRel:CLOSEST_TO]->()
DELETE oldRel

MATCH (s:Satellite), (g:GroundStation)
WITH s, g, point.distance(
  point({latitude: s.latitude, longitude: s.longitude}),
  point({latitude: g.latitude, longitude: g.longitude})
) AS dist
WHERE dist > 100000 AND dist < 500000
ORDER BY dist
WTIH s, g, dist
MERGE (s)-[:CLOSEST_TO {distance: dist}]->(g)

WITH s, COLLECT(g) AS closestStations, MIN(dist) AS minDist
FOREACH (cs IN closestStations[0..1] |
  MERGE (s)-[:CLOSEST_TO {distance: minDist}]->(cs)
)


MATCH (s:StarlinkSatellite), (g:GroundStation)
WITH s, g, point.distance(
  point({latitude: s.latitude, longitude: s.longitude}),
  point({latitude: g.latitude, longitude: g.longitude})
) AS dist
WHERE dist > 100000 AND dist < 500000
WITH s, g, dist
MERGE (s)-[:CLOSEST_TO {distance: dist}]->(g)


MATCH (c:Country {name: 'Fiji'})-[r1:IN_COUNTRY]-(g:GroundStation)-[r2:CLOSEST_TO]-(s:StarlinkSatellite)
RETURN c, g, s, r1, r2;