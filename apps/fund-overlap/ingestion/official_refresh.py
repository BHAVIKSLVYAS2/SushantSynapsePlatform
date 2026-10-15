"""Publish audited official holdings and truthful national coverage, without DB writes.

The index is the single atomic commit and embeds its coverage report. The
standalone coverage.json is a report artifact; consumers should read the copy
inside official-index.json to avoid mixed generations during publication.
"""
import argparse
import datetime as dt
import hashlib
import json
import math
import os
from pathlib import Path
import re
import tempfile
import urllib.parse
import urllib.request

from official_parser import (catalogue_families, family_name, source_prefixes,
                             parse_date, parse_document, unsupported_reason, valid_isin)

ROOT = Path(__file__).resolve().parents[1]
CATALOGUE_URL = 'https://api.mfapi.in/mf'


def encoded(value):
    return (json.dumps(value, ensure_ascii=False, separators=(',', ':'), allow_nan=False) + '\n').encode()


def atomic_write(path, raw):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(dir=path.parent, suffix='.tmp')
    try:
        with os.fdopen(fd, 'wb') as handle:
            handle.write(raw)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def fetch_catalogue():
    # Catalogue identity is a separate public source, never a holdings provider.
    request = urllib.request.Request(CATALOGUE_URL, headers={'User-Agent': 'FundLens-OfficialRefresh/1.0', 'Accept': 'application/json'})
    with urllib.request.urlopen(request, timeout=45) as response:
        final = urllib.parse.urlsplit(response.geturl())
        if final.scheme != 'https' or final.hostname != 'api.mfapi.in' or final.path != '/mf':
            raise ValueError('Unexpected catalogue redirect')
        raw = response.read(30_000_001)
    if len(raw) > 30_000_000:
        raise ValueError('Catalogue exceeds byte limit')
    catalogue = json.loads(raw)
    validate_catalogue(catalogue)
    return catalogue


def validate_catalogue(catalogue):
    if not isinstance(catalogue, list) or not catalogue or len(catalogue) > 100_000:
        raise ValueError('Invalid national catalogue')
    catalogue_families(catalogue)
    codes = [str(item['schemeCode']) for item in catalogue]
    if len(set(codes)) != len(codes):
        raise ValueError('Duplicate national scheme codes')


def snapshot_path(output, entry):
    prefix = '/api/fund-overlap/'
    value = entry.get('holdingsPath', '')
    if not value.startswith(prefix) or not re.fullmatch(r'holdings/[a-z0-9-]+/\d{4}-\d{2}-\d{2}-[a-f0-9]{16}\.json', value[len(prefix):]):
        raise ValueError('Invalid published snapshot path')
    return output / value[len(prefix):]


def validate_snapshot(snapshot, entry=None):
    if not isinstance(snapshot, dict) or not re.fullmatch(r'[a-z0-9-]{3,80}', str(snapshot.get('schemeId', ''))):
        raise ValueError('Invalid snapshot identity')
    if not isinstance(snapshot.get('name'), str) or not snapshot['name'].strip():
        raise ValueError('Invalid snapshot name')
    parse_date(snapshot.get('portfolioDate'))
    source = snapshot.get('source', {})
    for field in ('url', 'indexUrl'):
        parsed_url = urllib.parse.urlsplit(source.get(field, ''))
        if parsed_url.scheme != 'https' or not parsed_url.hostname or parsed_url.username or parsed_url.password:
            raise ValueError('Snapshot has no official HTTPS source')
    if not re.fullmatch('[a-f0-9]{64}', source.get('sha256', '')):
        raise ValueError('Invalid official source digest')
    holdings = snapshot.get('holdings')
    if not isinstance(holdings, list) or not 1 <= len(holdings) <= 2000:
        raise ValueError('Invalid holdings count')
    seen, total = set(), 0
    for holding in holdings:
        isin, weight = holding.get('isin'), holding.get('weight')
        if not isinstance(isin, str) or not valid_isin(isin) or isin in seen:
            raise ValueError('Invalid or duplicate snapshot ISIN')
        if not isinstance(weight, (int, float)) or isinstance(weight, bool) or not math.isfinite(weight) or not 0 < weight <= 100:
            raise ValueError('Invalid snapshot equity weight')
        if not isinstance(holding.get('name'), str) or not holding['name'].strip():
            raise ValueError('Invalid snapshot holding name')
        seen.add(isin); total += weight
    if not 0 < total <= 100.5 or abs(total - snapshot.get('includedNavWeight', -1)) > .00001:
        raise ValueError('Snapshot coverage does not reconcile')
    if entry and any(entry.get(a) != snapshot.get(b) for a, b in [('id', 'schemeId'), ('name', 'name'), ('portfolioDate', 'portfolioDate'), ('includedNavWeight', 'includedNavWeight')]):
        raise ValueError('Snapshot does not match its published index')
    if entry and (entry.get('holdingsCount') != len(holdings) or entry.get('sourceSha256') != source['sha256']):
        raise ValueError('Snapshot metadata does not match its published index')


def read_previous(output):
    path = output / 'official-index.json'
    if not path.exists():
        return dict(funds=[], coverageReport=dict(sources=[], schemes=[]))
    index = json.loads(path.read_text(encoding='utf-8'))
    if index.get('version') != 1 or not isinstance(index.get('funds'), list):
        raise ValueError('Invalid previous official index; publication stopped')
    seen = set()
    for entry in index['funds']:
        if entry.get('id') in seen:
            raise ValueError('Duplicate previous official fund identity')
        seen.add(entry['id'])
        raw = snapshot_path(output, entry).read_bytes()
        if hashlib.sha256(raw).hexdigest() != entry.get('snapshotSha256'):
            raise ValueError('Previous snapshot digest mismatch; publication stopped')
        validate_snapshot(json.loads(raw), entry)
    return index


def fixture_document(source_dir, source, document):
    file_name = document.get('fileName') or urllib.parse.unquote(urllib.parse.urlsplit(document['url']).path.rsplit('/', 1)[-1])
    if Path(file_name).name != file_name or not file_name:
        raise ValueError('Invalid fixture filename')
    scoped = Path(source_dir) / source['id'] / file_name
    return (scoped if scoped.exists() else Path(source_dir) / file_name).read_bytes()


def parse_official(raw, source, document, catalogue, now, families=None):
    # Preserve the thoroughly audited original PPFAS adapter and shared IDs.
    if source['id'] == 'ppfas' and document['format'] == 'xlsx':
        import refresh as ppfas
        code = re.search(r'/([A-Z]+)_PPFAS_', document['url'])
        if code and code[1] in ppfas.FUNDS:
            snapshot = ppfas.parse_ppfas(raw, code[1], parse_date(document['portfolioDate']), document['url'], now)
            snapshot['source']['kind'] = 'official'
            family = family_name(snapshot['name'])
            families = families if families is not None else catalogue_families(catalogue)
            codes = sorted({item['schemeCode'] for item in families.get(family, [])})
            return dict(funds=[dict(snapshot=snapshot, schemeCodes=codes)], unsupported=[], errors=[])
    return parse_document(raw, source, document, catalogue, now, families)


def make_entry(snapshot, scheme_codes, source_id, now):
    validate_snapshot(snapshot)
    raw = encoded(snapshot)
    digest = hashlib.sha256(raw).hexdigest()
    relative = f"holdings/{snapshot['schemeId']}/{snapshot['portfolioDate']}-{digest[:16]}.json"
    entry = dict(id=snapshot['schemeId'], name=snapshot['name'], amc=snapshot['amc'], category=snapshot['category'],
                 schemeCodes=scheme_codes, portfolioDate=snapshot['portfolioDate'], includedNavWeight=snapshot['includedNavWeight'],
                 holdingsCount=len(snapshot['holdings']), holdingsPath='/api/fund-overlap/' + relative,
                 sourceSha256=snapshot['source']['sha256'], snapshotSha256=digest, provider='official', sourceId=source_id,
                 lastCheckedAt=now)
    return entry, relative, raw


def coverage_report(catalogue, sources, statuses, entries, unsupported, as_of, now, previous, catalogue_checked_at=None):
    by_code = {}
    for entry in entries:
        age = (as_of - parse_date(entry['portfolioDate'])).days
        for code in entry.get('schemeCodes', []):
            if code in by_code and by_code[code]['id'] != entry['id']:
                raise ValueError('Multiple official identities for the same national scheme code')
            by_code[code] = entry
    old_unsupported = {str(v['schemeCode']): v for v in previous.get('schemes', []) if v.get('status') == 'unsupported'}
    unsupported_codes = {str(code): result['message'] for result in unsupported for code in result.get('schemeCodes', [])}
    ownership = [(source, source_prefixes(source)) for source in sources]
    schemes = []
    for item in catalogue:
        code = int(item['schemeCode']); key = family_name(item['schemeName'])
        matches = [source for source, prefixes in ownership if any(key == p or key.startswith(p + ' ') for p in prefixes)]
        source = matches[0] if len(matches) == 1 else None
        record = dict(schemeCode=code, name=item['schemeName'], status='unavailable')
        if source:
            record['amc'] = source['amc']; record['sourceId'] = source['id']
        if code in by_code:
            entry = by_code[code]
            stale = (as_of - parse_date(entry['portfolioDate'])).days > 45 or entry.get('coverageStatus') == 'stale'
            record.update(status='stale' if stale else 'verified', officialFundId=entry['id'],
                          portfolioDate=entry['portfolioDate'], amc=entry['amc'])
            record['message'] = ('Last valid official snapshot retained; ' + entry.get('latestAttemptMessage', 'portfolio is over 45 days old.')) if stale else 'Verified official physical-equity holdings.'
            if statuses.get(entry['sourceId'], {}).get('status') in ('failed', 'partial'):
                record['message'] += (' Latest source refresh failed for this portfolio; last valid snapshot retained.'
                                      if entry.get('coverageStatus') == 'stale' else
                                      ' Other portfolios from this fund house could not be verified in the latest source refresh.')
        else:
            reason = unsupported_codes.get(str(code)) or (old_unsupported.get(str(code), {}).get('message')) or unsupported_reason(item['schemeName'])
            if reason:
                record.update(status='unsupported', message=reason)
            elif source:
                record['message'] = statuses.get(source['id'], {}).get('message', 'Official portfolio importer has not verified this scheme.')
            else:
                record['message'] = 'No unambiguous configured official fund-house mapping; holdings unavailable.'
        schemes.append(record)
    count = lambda status: sum(s['status'] == status for s in schemes)
    catalogue_checked_at = catalogue_checked_at or previous.get('catalogue', {}).get('checkedAt') or previous.get('asOf') or now
    retrieval_dates = sorted({s['lastDownloadedAt'][:10] for s in statuses.values() if s.get('lastDownloadedAt')})
    return dict(version=1, generatedAt=now, asOf=as_of.isoformat(), sourceRetrievalDates=retrieval_dates,
                catalogue=dict(publisher='MFapi', url=CATALOGUE_URL, totalPlanOptions=len(catalogue),
                               checkedAt=catalogue_checked_at,
                               note='Scheme counts include distinct plans/options and historical catalogue entries; direct/regular plans share holdings.'),
                summary=dict(fundHouses=len(sources), totalSchemes=len(schemes), verifiedSchemes=count('verified'),
                             unsupportedSchemes=count('unsupported'), unavailableSchemes=count('unavailable'), staleSchemes=count('stale'),
                             verifiedPortfolios=len(entries)),
                sources=[statuses[s['id']] for s in sources], schemes=schemes)


def refresh(output, sources, catalogue, source_dir=None, as_of=None, max_sources=None, only=None, fetch_bytes=None, discover=None, catalogue_checked_at=None):
    validate_catalogue(catalogue)
    families = catalogue_families(catalogue)
    as_of = parse_date(as_of) if as_of else dt.datetime.now(dt.timezone.utc).date()
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    if len({s['id'] for s in sources}) != len(sources):
        raise ValueError('Duplicate official source IDs')
    previous = read_previous(output)
    old = {entry['id']: entry for entry in previous['funds']}
    entries, pending, statuses, unsupported = dict(old), [], {}, []
    previous_sources = {s['id']: s for s in previous.get('coverageReport', {}).get('sources', [])}
    selected = [s for s in sources if s.get('enabled', True) and (not only or s['id'] in only)]
    if max_sources is not None:
        selected = selected[:max_sources]
    selected_ids = {s['id'] for s in selected}
    if fetch_bytes is None or discover is None:
        from official_sources import build_fetcher, discover_source
        fetch_bytes = fetch_bytes or build_fetcher(sources)
        discover = discover or discover_source
    for source in sources:
        status = dict(id=source['id'], amc=source['amc'], status='unavailable', checkedAt=now, verifiedSchemes=0)
        for field in ('automaticRenewal', 'renewalStatus'):
            if field in source:
                status[field] = source[field]
        statuses[source['id']] = status
        if source['id'] not in selected_ids:
            prior = previous_sources.get(source['id'])
            if prior:
                status.update(prior)
                status['message'] = 'Source not attempted in this bounded refresh. ' + prior.get('message', '')
            else:
                status['status'] = 'not-configured' if not source.get('enabled', True) else 'not-attempted'
                status['message'] = source.get('message') or 'Official source not verified by this refresh.'
            continue
        errors, source_entries, source_pending, source_unsupported = [], [], [], []
        seen_source_bytes = set()
        try:
            documents = source.get('documents') if source_dir and source.get('documents') else discover(source, fetch_bytes, as_of)
            if not documents:
                raise ValueError('No dated official XLS/XLSX/ZIP disclosure discovered')
            if len(documents) > 250:
                raise ValueError('Source document count exceeds portfolio limit')
            for document in documents:
                try:
                    date = parse_date(document['portfolioDate'])
                    if date > as_of:
                        raise ValueError('Future-dated official disclosure')
                    raw = fixture_document(source_dir, source, document) if source_dir else fetch_bytes(document['url'])
                    document_sha = hashlib.sha256(raw).hexdigest()
                    if document_sha in seen_source_bytes:
                        continue
                    seen_source_bytes.add(document_sha)
                    fetched_at = document.get('fetchedAt', now)
                    result = parse_official(raw, source, document, catalogue, fetched_at, families)
                    errors.extend(f"{e['worksheet']}: {e['message']}" for e in result['errors'])
                    source_unsupported.extend(result['unsupported'])
                    for parsed in result['funds']:
                        snapshot = parsed['snapshot']; prior = old.get(snapshot['schemeId'])
                        if prior and snapshot['portfolioDate'] < prior['portfolioDate']:
                            raise ValueError('Refusing to regress a published portfolio date: ' + snapshot['name'])
                        prior_snapshot = json.loads(snapshot_path(output, prior).read_bytes()) if prior else None
                        def comparable(value):
                            return dict(value, source={k: v for k, v in value['source'].items() if k != 'fetchedAt'})
                        same_content = prior_snapshot and comparable(prior_snapshot) == comparable(snapshot)
                        if prior and prior['sourceSha256'] == snapshot['source']['sha256'] and same_content:
                            entry = dict(prior, schemeCodes=parsed['schemeCodes'], lastCheckedAt=now)
                            for field in ('coverageStatus', 'latestAttemptMessage', 'latestAttemptAt'):
                                entry.pop(field, None)
                        else:
                            entry, relative, snapshot_raw = make_entry(snapshot, parsed['schemeCodes'], source['id'], now)
                            source_pending.append((output / relative, snapshot_raw))
                        if any(e['id'] == entry['id'] for e in source_entries):
                            other = next(e for e in source_entries if e['id'] == entry['id'])
                            if entry['portfolioDate'] == other['portfolioDate'] and entry['includedNavWeight'] == other['includedNavWeight'] and entry['holdingsCount'] == other['holdingsCount']:
                                existing_raw = next((r for p, r in source_pending if p == snapshot_path(output, other)), None)
                                existing_snapshot = json.loads(existing_raw) if existing_raw else json.loads(snapshot_path(output, other).read_bytes())
                                if existing_snapshot['holdings'] == snapshot['holdings']:
                                    continue
                            raise ValueError('Conflicting duplicate official fund across source documents')
                        source_entries.append(entry)
                except Exception as error:
                    errors.append(str(error))
            current_ids = {entry['id'] for entry in source_entries}
            omitted = [entry for entry in old.values() if entry.get('sourceId') == source['id'] and entry['id'] not in current_ids]
            if omitted:
                errors.append('Previously published portfolios missing from the validated latest document set: ' + ', '.join(e['name'] for e in omitted)[:500])
            for entry in source_entries:
                entries[entry['id']] = entry
            pending.extend(source_pending); unsupported.extend(source_unsupported)
            status.update(status='partial' if errors and (source_entries or source_unsupported) else 'failed' if errors else 'verified',
                          verifiedSchemes=len(source_entries), verifiedPortfolios=len(source_entries),
                          unsupportedPortfolios=len(source_unsupported), documents=len(documents))
            fetched_dates = [d['fetchedAt'] for d in documents if d.get('fetchedAt')]
            if fetched_dates:
                status['lastDownloadedAt'] = max(fetched_dates)
            dates = [entry['portfolioDate'] for entry in source_entries]
            if dates:
                status['portfolioDate'] = max(dates)
            status['message'] = ('; '.join(errors)[:1500] + ' Previous valid snapshots retained.') if errors else 'Official monthly disclosures validated.'
            if source.get('automaticRenewal') is False:
                status['message'] = source.get('renewalStatus', 'Future monthly selection requires manual verification.') + ' ' + status['message']
            if errors:
                status['errorCount'] = len(errors)
        except Exception as error:
            status.update(status='failed', message=str(error)[:1500] + ' Previous valid snapshots retained.')
        retained = [e for e in entries.values() if e.get('sourceId') == source['id']]
        refreshed_ids = {e['id'] for e in source_entries}
        if status['status'] in ('failed', 'partial'):
            for entry in retained:
                if entry['id'] not in refreshed_ids:
                    entries[entry['id']] = dict(entry, coverageStatus='stale', latestAttemptMessage=status['message'], latestAttemptAt=now)
        status['retainedPortfolios'] = len(retained)
        status['verifiedSchemes'] = sum(len(e.get('schemeCodes', [])) for e in retained)
    funds = sorted(entries.values(), key=lambda e: (e['name'].lower(), e['id']))
    report = coverage_report(catalogue, sources, statuses, funds, unsupported, as_of, now, previous.get('coverageReport', {}), catalogue_checked_at)
    generation = hashlib.sha256(encoded(dict(funds=funds, coverageReport=report))).hexdigest()
    report['generation'] = generation
    index = dict(version=1, generatedAt=now, generation=generation,
                 coverage='Verified official monthly physical-equity portfolios; see coverageReport for every national catalogue scheme.',
                 funds=funds, coverageReport=report)
    # Immutable bytes first, report second, index last: one authoritative commit.
    for path, raw in pending:
        if path.exists() and path.read_bytes() != raw:
            raise ValueError('Immutable snapshot collision')
        if not path.exists():
            atomic_write(path, raw)
    atomic_write(output / 'coverage.json', encoded(report))
    atomic_write(output / 'official-index.json', encoded(index))
    print(json.dumps(report['summary'], sort_keys=True))
    for status in report['sources']:
        if status['id'] in selected_ids:
            print(f"{status['id']}: {status['status']}; {status['verifiedSchemes']} catalogue plans verified; {status['message']}")
    return index


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'data')
    parser.add_argument('--sources', type=Path)
    parser.add_argument('--catalogue-file', type=Path)
    parser.add_argument('--source-dir', type=Path)
    parser.add_argument('--as-of', type=parse_date)
    parser.add_argument('--max-sources', type=int)
    parser.add_argument('--only', help='Comma-separated official source IDs')
    args = parser.parse_args()
    if args.max_sources is not None and args.max_sources < 1:
        parser.error('--max-sources must be positive')
    if args.source_dir and not args.catalogue_file:
        parser.error('Fixture refresh requires --catalogue-file; no implicit live catalogue request')
    from official_sources import load_sources
    sources = load_sources(args.sources)
    only = set(args.only.split(',')) if args.only else None
    if only and only - {s['id'] for s in sources}:
        parser.error('Unknown source ID in --only')
    catalogue = json.loads(args.catalogue_file.read_text(encoding='utf-8-sig')) if args.catalogue_file else fetch_catalogue()
    catalogue_checked_at = dt.datetime.fromtimestamp(args.catalogue_file.stat().st_mtime, dt.timezone.utc).isoformat() if args.catalogue_file else dt.datetime.now(dt.timezone.utc).isoformat()
    refresh(args.output, sources, catalogue, args.source_dir, args.as_of, args.max_sources, only, catalogue_checked_at=catalogue_checked_at)


if __name__ == '__main__':
    main()
