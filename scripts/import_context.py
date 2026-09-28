"""Export verified Earth Engine observations as a Cloudflare D1 seed script.

Usage:
  python scripts/import_context.py --project PROJECT --date YYYY-MM-DD
  npx wrangler d1 execute agroman --remote --file scripts/generated/context-YYYY-MM-DD.sql --config worker/wrangler.jsonc

The export is local and reviewable. It never invents values and does not write to
the live database by itself.
"""

import argparse
import datetime as dt
import json
from pathlib import Path

import ee


PILOTS = [
    ("PB-LDH", "Punjab", "Ludhiana"),
    ("PB-ASR", "Punjab", "Amritsar"),
    ("UP-LKO", "Uttar Pradesh", "Lucknow"),
    ("UP-VNS", "Uttar Pradesh", "Varanasi"),
    ("MH-PUN", "Maharashtra", "Pune"),
    ("MH-NSK", "Maharashtra", "Nashik"),
]


def sql_text(value):
    return "NULL" if value is None else "'" + str(value).replace("'", "''") + "'"


def sql_number(value):
    return "NULL" if value is None else format(float(value), ".12g")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", required=True)
    parser.add_argument(
        "--date", default=(dt.date.today() - dt.timedelta(days=14)).isoformat()
    )
    parser.add_argument("--output")
    args = parser.parse_args()

    day = dt.date.fromisoformat(args.date)
    if day > dt.date.today():
        parser.error("Observation date cannot be in the future")

    output = Path(args.output or f"scripts/generated/context-{args.date}.sql")
    output.parent.mkdir(parents=True, exist_ok=True)
    ee.Initialize(project=args.project)

    boundaries = ee.FeatureCollection("FAO/GAUL/2015/level2").filter(
        ee.Filter.eq("ADM0_NAME", "India")
    )
    end = ee.Date(args.date)
    start = end.advance(-30, "day")
    rain = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY").filterDate(start, end)
    moisture = (
        ee.ImageCollection("NASA/SMAP/SPL4SMGP/008")
        .filterDate(start, end)
        .select("sm_surface")
    )
    ph = (
        ee.Image("OpenLandMap/SOL/SOL_PH-H2O_USDA-4C1A2A_M/v02")
        .select("b0")
        .multiply(0.1)
    )
    if rain.size().getInfo() == 0 or moisture.size().getInfo() == 0:
        raise RuntimeError(
            "Source observations unavailable for this date range; refusing to invent values"
        )

    source = (
        "OpenLandMap modeled surface pH; CHIRPS 30-day rainfall; SMAP 30-day "
        "surface moisture. GAUL 2015 boundaries."
    )
    summary = (
        "District means; modeled soil is not a farm laboratory test. Rainfall and "
        "moisture summarize the preceding 30 days."
    )
    statements = [
        "-- Review this generated file before applying it to D1.",
        "BEGIN TRANSACTION;",
    ]

    for district_id, state, district in PILOTS:
        matches = boundaries.filter(ee.Filter.eq("ADM1_NAME", state)).filter(
            ee.Filter.eq("ADM2_NAME", district)
        )
        if matches.size().getInfo() != 1:
            raise RuntimeError(
                f"Boundary for {district_id} did not resolve uniquely; verify GAUL aliases before import"
            )
        geometry = matches.geometry()

        def mean(image, band, scale):
            return (
                image.reduceRegion(
                    reducer=ee.Reducer.mean(),
                    geometry=geometry,
                    scale=scale,
                    maxPixels=100_000_000,
                )
                .get(band)
                .getInfo()
            )

        soil_ph = mean(ph, "b0", 250)
        rainfall_mm = mean(rain.sum(), "precipitation", 5500)
        moisture_value = mean(moisture.mean(), "sm_surface", 9000)
        moisture_percent = None if moisture_value is None else moisture_value * 100
        geometry_json = json.dumps(
            geometry.getInfo(), separators=(",", ":"), ensure_ascii=True
        )
        statements.extend(
            [
                "INSERT INTO district_context "
                "(district_id, soil_ph, rainfall_mm, moisture, observed_at, source, summary) "
                f"VALUES ({sql_text(district_id)}, {sql_number(soil_ph)}, "
                f"{sql_number(rainfall_mm)}, {sql_number(moisture_percent)}, "
                f"{sql_text(args.date)}, {sql_text(source)}, {sql_text(summary)}) "
                "ON CONFLICT(district_id) DO UPDATE SET "
                "soil_ph=excluded.soil_ph, rainfall_mm=excluded.rainfall_mm, "
                "moisture=excluded.moisture, observed_at=excluded.observed_at, "
                "source=excluded.source, summary=excluded.summary;",
                "INSERT INTO district_boundaries (district_id, geometry_json) "
                f"VALUES ({sql_text(district_id)}, {sql_text(geometry_json)}) "
                "ON CONFLICT(district_id) DO UPDATE SET geometry_json=excluded.geometry_json;",
            ]
        )

    statements.append("COMMIT;")
    output.write_text("\n".join(statements) + "\n", encoding="utf-8")
    print(
        f"Exported {len(PILOTS)} real district rows dated {args.date} to {output}. "
        "Review the SQL before applying it to D1."
    )


if __name__ == "__main__":
    main()
