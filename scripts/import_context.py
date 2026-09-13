"""Explicit operator-run Earth Engine -> BigQuery importer. No mock data.

Usage: python scripts/import_context.py --project PROJECT --dataset agroman --date YYYY-MM-DD
Requires ADC and a verified Earth Engine project. Writes only to named dataset.
"""
import argparse
import datetime as dt
import json
import ee
from google.cloud import bigquery

PILOTS = [
    ('PB-LDH', 'Punjab', 'Ludhiana'), ('PB-ASR', 'Punjab', 'Amritsar'),
    ('UP-LKO', 'Uttar Pradesh', 'Lucknow'), ('UP-VNS', 'Uttar Pradesh', 'Varanasi'),
    ('MH-PUN', 'Maharashtra', 'Pune'), ('MH-NSK', 'Maharashtra', 'Nashik'),
]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--project', required=True)
    parser.add_argument('--dataset', default='agroman')
    parser.add_argument('--date', default=(dt.date.today() - dt.timedelta(days=14)).isoformat())
    args = parser.parse_args()
    day = dt.date.fromisoformat(args.date)
    if day > dt.date.today():
        parser.error('Observation date cannot be in the future')
    ee.Initialize(project=args.project)
    client = bigquery.Client(project=args.project)
    dataset = bigquery.Dataset(f'{args.project}.{args.dataset}')
    dataset.location = 'asia-south1'
    client.create_dataset(dataset, exists_ok=True)
    boundaries = ee.FeatureCollection('FAO/GAUL/2015/level2').filter(ee.Filter.eq('ADM0_NAME', 'India'))
    end = ee.Date(args.date)
    start = end.advance(-30, 'day')
    rain = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY').filterDate(start, end)
    moisture = ee.ImageCollection('NASA/SMAP/SPL4SMGP/008').filterDate(start, end).select('sm_surface')
    ph = ee.Image('OpenLandMap/SOL/SOL_PH-H2O_USDA-4C1A2A_M/v02').select('b0').multiply(0.1)
    if rain.size().getInfo() == 0 or moisture.size().getInfo() == 0:
        raise RuntimeError('Source observations unavailable for this date range; refusing to invent values')
    rows, shapes = [], []
    for district_id, state, district in PILOTS:
        matches = boundaries.filter(ee.Filter.eq('ADM1_NAME', state)).filter(ee.Filter.eq('ADM2_NAME', district))
        if matches.size().getInfo() != 1:
            raise RuntimeError(f'Boundary for {district_id} did not resolve uniquely; verify GAUL aliases before import')
        geometry = matches.geometry()
        def mean(image, band, scale):
            return image.reduceRegion(reducer=ee.Reducer.mean(), geometry=geometry, scale=scale, maxPixels=100000000).get(band).getInfo()
        p = mean(ph, 'b0', 250)
        r = mean(rain.sum(), 'precipitation', 5500)
        m = mean(moisture.mean(), 'sm_surface', 9000)
        rows.append({'districtId': district_id, 'soilPh': p, 'rainfallMm': r, 'moisture': None if m is None else m * 100, 'observedAt': args.date, 'source': 'OpenLandMap modeled surface pH; CHIRPS 30-day rainfall; SMAP 30-day surface moisture. GAUL 2015 boundaries.', 'summary': 'District means; modeled soil is not a farm laboratory test. Rainfall and moisture summarize the preceding 30 days.'})
        shapes.append({'districtId': district_id, 'geometry': json.dumps(geometry.getInfo())})
    context_schema = [bigquery.SchemaField('districtId', 'STRING'), bigquery.SchemaField('soilPh', 'FLOAT'), bigquery.SchemaField('rainfallMm', 'FLOAT'), bigquery.SchemaField('moisture', 'FLOAT'), bigquery.SchemaField('observedAt', 'DATE'), bigquery.SchemaField('source', 'STRING'), bigquery.SchemaField('summary', 'STRING')]
    # Append dated observations. Replace boundaries only within the explicitly named table.
    client.load_table_from_json(rows, f'{args.project}.{args.dataset}.district_context', job_config=bigquery.LoadJobConfig(schema=context_schema, write_disposition='WRITE_APPEND')).result()
    client.load_table_from_json(shapes, f'{args.project}.{args.dataset}.district_boundaries', job_config=bigquery.LoadJobConfig(schema=[bigquery.SchemaField('districtId', 'STRING'), bigquery.SchemaField('geometry', 'STRING')], write_disposition='WRITE_TRUNCATE')).result()
    print(f'Imported {len(rows)} real district context rows dated {args.date}. Review coverage and sources before enabling live mode.')

if __name__ == '__main__':
    main()
