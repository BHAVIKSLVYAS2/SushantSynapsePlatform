"""Seed a scheduled refresh from its last successful audited public artifact."""
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
import re

from official_refresh import ROOT, atomic_write, encoded, read_previous, validate_snapshot


def timestamp(value):
    result = dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
    if result.tzinfo is None:
        raise ValueError('Publication timestamp must identify its timezone')
    return result


def restore_artifact(source, output):
    source, output = Path(source).resolve(), Path(output).resolve()
    if source == output:
        raise ValueError('Recovery source and output must differ')
    candidate = read_previous(source)
    if not candidate['funds']:
        return False
    report = candidate.get('coverageReport', {})
    generation = hashlib.sha256(encoded(dict(funds=candidate['funds'], coverageReport={k: v for k, v in report.items() if k != 'generation'}))).hexdigest()
    if candidate.get('generation') != generation or report.get('generation') != generation:
        raise ValueError('Recovery publication and coverage generations do not reconcile')
    current = read_previous(output)
    if current['funds']:
        if timestamp(candidate['generatedAt']) <= timestamp(current['generatedAt']):
            return False
        indexed = {entry['id']: entry for entry in candidate['funds']}
        if any(entry['id'] not in indexed or indexed[entry['id']]['portfolioDate'] < entry['portfolioDate'] for entry in current['funds']):
            return False
    pending, size = [], 0
    for path in (source / 'holdings').glob('*/*.json'):
        relative = path.relative_to(source)
        if not re.fullmatch(r'holdings/[a-z0-9-]{1,80}/\d{4}-\d{2}-\d{2}-[a-f0-9]{16}\.json', relative.as_posix()):
            raise ValueError('Recovery artifact contains an invalid snapshot path')
        if not path.resolve().is_relative_to(source):
            raise ValueError('Recovery snapshot leaves the artifact directory')
        raw = path.read_bytes(); size += len(raw)
        if len(pending) >= 25000 or size > 250_000_000:
            raise ValueError('Recovery artifact exceeds public reference limits')
        snapshot = json.loads(raw)
        validate_snapshot(snapshot)
        if snapshot['schemeId'] != relative.parts[1] or not path.name.endswith('-' + hashlib.sha256(raw).hexdigest()[:16] + '.json') or not path.name.startswith(snapshot['portfolioDate'] + '-'):
            raise ValueError('Recovery snapshot filename does not match its identity or digest')
        target = output / relative
        if target.exists() and target.read_bytes() != raw:
            raise ValueError('Recovery would overwrite a conflicting immutable snapshot')
        pending.append((target, raw))
    # Validate the entire artifact before restoring a single file. Keep older
    # public versions so their shared URLs survive subsequent scheduled runs.
    for target, raw in pending:
        if not target.exists():
            atomic_write(target, raw)
    atomic_write(output / 'coverage.json', encoded(report))
    atomic_write(output / 'official-index.json', encoded(candidate))
    return True


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--from-artifact', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=ROOT / 'data')
    args = parser.parse_args()
    print('Restored newer validated public references.' if restore_artifact(args.from_artifact, args.output) else 'Repository references retained; artifact has no non-regressing newer publication.')
