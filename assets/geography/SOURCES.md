# Geographic assets

OpenStreetMap © contributors, ODbL 1.0: https://www.openstreetmap.org/copyright . Snapshot 2026-10-08, Overpass endpoint https://overpass-api.de/api/interpreter .

Queries: roads/water/landuse bbox56.67,60.29,57.005,60.94; building footprints bbox56.70,60.39,56.96,60.86. 49780 footprints after removing small sheds; 14576 road/rail/airport ways; 943 water polygons. Full source IDs retained. Data was simplified by coordinate rounding to0.2m; building heights absent in OSM estimated from level count, then typology.

Elevation: AWS Terrain Tiles, Terrarium, zoom10 tiles683..685/313..315. https://registry.opendata.aws/terrain-tiles/ and https://github.com/tilezen/joerd . Public tiled elevation is decoded directly from RGB (R*256+G+B/256-32768), downsampled2× and bilinearly sampled; relative elevation datum245m. This is real DEM, not a random hill generator. Buildings/vegetation within source DEM can introduce local artefacts. Water surfaces are flattened; bank surface is locally graded for rendering.

Historical ordinary houses, street firstappearance and urban extents are illustrative reconstructions, not cadastral surveys for each date. Modern road centerlines and modern building footprints are measured OSM geography. Named monument poses reference OSM extents; lost monument footprints and azimuths are approximate documentary placements. No feature in the historical forest is cleared merely because a future landmark will later exist.


Rendering correction notes: 34 isolated DEM samples with implausible local discontinuities were median corrected. Named plots are locally graded, and the airport field uses its OSM aerodrome elevation 233m MSL. Terrain LOD interiors are disjoint. Date-aware water masks use approximately11m regional and1.7m central sampling to prevent coarse DEM facets occluding the measured water outline. River arrival and ordinary historical parcels are illustrative staging.

Central multipolygon/building-part repair, snapshot 2026-10-12T17:46:51Z: see [COMPLEX-BUILDINGS-SOURCES.md](COMPLEX-BUILDINGS-SOURCES.md). The original 2026-10-08 base remains in use outside that additive repair.
