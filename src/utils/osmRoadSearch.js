// ../../../utils/osmRoadSearch.js
import axios from "axios";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point, polygon as turfPolygon } from "@turf/helpers";

/**
 * Find a street by name inside a given barangay polygon using OpenStreetMap (Overpass API).
 *
 * @param {string} streetName - e.g. "Max Suniel St"
 * @param {Array<{latitude:number, longitude:number}>} polygonCoords - barangay boundary
 * @returns {Promise<{latitude:number, longitude:number} | null>}
 */
export async function findStreetInsidePolygon(streetName, polygonCoords) {
  try {
    if (!streetName || !polygonCoords?.length) return null;

    // 1️⃣ Convert coords into Overpass (lat lon) string
    const polyString = polygonCoords
      .map((c) => `${c.latitude} ${c.longitude}`)
      .join(" ");

    // 2️⃣ Overpass query: find roads with matching name inside polygon
    const query = `
      [out:json];
      (
        way["highway"]["name"~"${streetName}", i](poly:"${polyString}");
      );
      out center;
    `;

    const url = "https://overpass-api.de/api/interpreter";
    const res = await axios.post(url, query, {
      headers: { "Content-Type": "text/plain" },
      timeout: 10000,
    });

    if (!res.data?.elements?.length) return null;

    // 3️⃣ Build turf polygon for validation
    const turfPoly = turfPolygon([
      polygonCoords.map((c) => [c.longitude, c.latitude]),
    ]);

    // 4️⃣ Loop through ways and return the first center INSIDE polygon
    for (const item of res.data.elements) {
      if (item.type === "way" && item.center) {
        const lat = item.center.lat;
        const lon = item.center.lon;
        const pt = point([lon, lat]);

        if (booleanPointInPolygon(pt, turfPoly)) {
          return { latitude: lat, longitude: lon };
        }
      }
    }

    return null;
  } catch (err) {
    console.error("OSM road search error:", err);
    return null;
  }
}
