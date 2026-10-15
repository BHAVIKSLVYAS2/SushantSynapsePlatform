import contextlib
import datetime as dt
import hashlib
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'ingestion'))
import restore_official
import official_refresh
from test_official_ingestion import SOURCE, DOCUMENT, CATALOGUE, DATE, workbook


class RecoveryTests(unittest.TestCase):
    def publish(self, directory):
        with contextlib.redirect_stdout(io.StringIO()):
            return official_refresh.refresh(directory, [SOURCE], CATALOGUE, as_of=DATE,
                fetch_bytes=lambda url: workbook(), discover=lambda *args: [DOCUMENT])

    def test_cross_run_recovery_restores_valid_snapshots_before_the_coverage_pointer(self):
        with tempfile.TemporaryDirectory() as temporary:
            source, output = Path(temporary) / 'artifact', Path(temporary) / 'next-run'
            index = self.publish(source)
            self.assertTrue(restore_official.restore_artifact(source, output))
            self.assertEqual(official_refresh.read_previous(output)['generation'], index['generation'])
            self.assertEqual(json.loads((output / 'coverage.json').read_bytes())['generation'], index['generation'])
            self.assertFalse(restore_official.restore_artifact(source, output))
            def offline(url):
                raise OSError('Official publisher unavailable')
            with contextlib.redirect_stdout(io.StringIO()):
                next_run = official_refresh.refresh(output, [SOURCE], CATALOGUE, as_of=DATE,
                    fetch_bytes=offline, discover=lambda *args: [DOCUMENT])
            self.assertEqual(next_run['funds'][0]['holdingsPath'], index['funds'][0]['holdingsPath'])
            self.assertEqual(next_run['funds'][0]['coverageStatus'], 'stale')

    def test_bad_digest_or_generation_cannot_replace_the_next_run_library(self):
        with tempfile.TemporaryDirectory() as temporary:
            source, output = Path(temporary) / 'artifact', Path(temporary) / 'next-run'
            index = self.publish(source)
            index['coverageReport']['summary']['verifiedSchemes'] += 1
            (source / 'official-index.json').write_text(json.dumps(index))
            with self.assertRaisesRegex(ValueError, 'generation'): restore_official.restore_artifact(source, output)
            self.assertFalse(output.exists())
            self.publish(source)
            entry = official_refresh.read_previous(source)['funds'][0]
            official_refresh.snapshot_path(source, entry).write_bytes(b'{}')
            with self.assertRaises(ValueError): restore_official.restore_artifact(source, output)
            self.assertFalse(output.exists())

    def test_recovery_preserves_historical_urls_and_rejects_unstructured_bytes(self):
        with tempfile.TemporaryDirectory() as temporary:
            source, output = Path(temporary) / 'artifact', Path(temporary) / 'next-run'
            index = self.publish(source)
            entry = index['funds'][0]
            snapshot = json.loads(official_refresh.snapshot_path(source, entry).read_bytes())
            snapshot['portfolioDate'] = '2026-08-31'
            raw = official_refresh.encoded(snapshot)
            archive = source / 'holdings' / entry['id'] / ('2026-08-31-' + hashlib.sha256(raw).hexdigest()[:16] + '.json')
            archive.write_bytes(raw)
            self.assertTrue(restore_official.restore_artifact(source, output))
            self.assertEqual((output / archive.relative_to(source)).read_bytes(), raw)


if __name__ == '__main__':
    unittest.main()
