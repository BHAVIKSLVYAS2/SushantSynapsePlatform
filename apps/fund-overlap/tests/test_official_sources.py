"""Deterministic security/date/discovery checks; no network or workspace data."""
import datetime as dt
import importlib.util
import io
import json
from pathlib import Path
import socket
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('official_sources', ROOT / 'ingestion' / 'official_sources.py')
sources = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sources)
AS_OF = dt.date(2026, 10, 12)
SOURCE = dict(id='example', amc='Example Mutual Fund', adapter='generic', enabled=True,
              indexUrl='https://www.example-amc.in/disclosures', allowedHosts=['www.example-amc.in'])


class OfficialSourceTests(unittest.TestCase):
    def test_registry_has_audited_amfi_directory_and_unavailable_entries(self):
        registry = json.loads(sources.REGISTRY.read_text())
        entries = sources.load_sources()
        self.assertEqual(len(entries), registry['directoryMemberCount'])
        self.assertGreaterEqual(len(entries), 50)
        self.assertTrue(all(source['directoryEvidence']['url'] == registry['directoryUrl'] for source in entries))
        self.assertTrue(any(not source['enabled'] and source['status'] == 'unavailable' for source in entries))
        self.assertTrue(all(source['verification']['schemes'] != 'all-verified' for source in entries))

    def test_disclosure_date_formats_and_download_query_are_distinct(self):
        expected = dt.date(2026, 9, 30)
        for value in ['September_30_2026.xlsx?07102026', '2026-09-30', '30th September 2026',
                      'September 2026', 'Sep2026', '30092026', '20260930']:
            with self.subTest(value=value):
                self.assertEqual(sources.portfolio_date(value, AS_OF), expected)
        self.assertIsNone(sources.portfolio_date('September 2027', AS_OF))
        self.assertIsNone(sources.portfolio_date('Sep-26', AS_OF))
        self.assertEqual(sources.portfolio_date('30-Sep-26', AS_OF, True), expected)
        self.assertIsNone(sources.portfolio_date('unknown.xlsx', AS_OF))

    def test_latest_month_only_and_unsafe_supplementary_links_are_excluded(self):
        html = b'''<a href="/Monthly_Portfolio_August_2026.xlsx">August</a>
          <a href="/Monthly_Portfolio_September_2026.xlsx?version=2">September</a>
          <a href="https://evil.invalid/Portfolio_September_2026.xlsx">foreign</a>
          <a href="/Portfolio_September_2027.xlsx">future</a>
          <a href="/Portfolio_Overlap_September_2026.xlsx">overlap</a>
          <a href="/monthly-portfolio.xlsx">undated</a>
          <a>empty</a>'''
        docs = sources.discover_source(SOURCE, lambda url: html, AS_OF)
        self.assertEqual(len(docs), 1)
        self.assertEqual(docs[0]['portfolioDate'], '2026-09-30')
        self.assertTrue(docs[0]['url'].endswith('September_2026.xlsx?version=2'))

    def test_structured_consolidated_zip_and_document_dates(self):
        raw = json.dumps({'rows': [dict(name='Consolidated Portfolio September 2026',
                    doc='https://www.example-amc.in/files/Monthly-Portfolio.zip')]}).encode()
        docs = sources.discover_source(SOURCE, lambda url: raw, AS_OF)
        self.assertEqual(docs[0]['format'], 'zip')
        self.assertEqual(docs[0]['portfolioDate'], '2026-09-30')
        # A filename without its own date receives the date in its own JSON entry.
        raw = json.dumps({'data': [dict(uploadDate='2026-09-30',
             name='Monthly Portfolio', attachment={'url':'/files/portfolio_a.xlsx'}),
             dict(uploadDate='2026-08-31', name='Monthly Portfolio',
                  attachment={'url':'/files/portfolio_b.xlsx'})]}).encode()
        docs = sources.discover_source(SOURCE, lambda url: raw, AS_OF)
        self.assertEqual([doc['fileName'] for doc in docs], ['portfolio_a.xlsx'])

    def test_link_space_encoding_and_table_local_date(self):
        html = b'''<h2>September 2026</h2><a href="/portfolio_undated.xlsx">Download</a>
           <tr><td>September 2026</td><td><a href="/Portfolio monthly.xlsx">Download</a></td></tr>'''
        docs = sources.discover_source(SOURCE, lambda url: html, AS_OF)
        self.assertEqual(len(docs), 1)
        self.assertEqual(docs[0]['url'], 'https://www.example-amc.in/Portfolio%20monthly.xlsx')

    def test_configured_monthly_get_and_read_only_post_requests(self):
        source = dict(SOURCE, discoveryTemplates=['https://www.example-amc.in/list?year={year}&month={monthName}'],
                      discoveryRequests=[dict(url='https://www.example-amc.in/public-list',
                          data=dict(year='{year}', month='{monthName}', fundId=0))])
        calls = []

        class Fetcher:
            def __call__(self, url):
                calls.append((url, None)); return b''

            def request_bytes(self, url, data):
                calls.append((url, data))
                return b'<a href="/Portfolio_September_2026.xlsx">Monthly Portfolio</a>'
        docs = sources.discover_source(source, Fetcher(), AS_OF)
        self.assertEqual(len(docs), 1)
        self.assertIn(('https://www.example-amc.in/list?year=2026&month=September', None), calls)
        self.assertEqual(calls[-1][1], dict(year='2026', month='September', fundId=0))

    def test_form_listing_and_quoted_html_envelope(self):
        source = dict(SOURCE, quotedHtml=True, discoveryRequests=[dict(
            url='https://www.example-amc.in/public-list', encoding='form', data=dict(month='{month2}'))])
        calls = []

        class Fetcher:
            def __call__(self, url):
                return b''
            def request_bytes(self, url, data, encoding):
                calls.append((url, data, encoding))
                return repr('<a href="/Portfolio.xlsx">September 2026 Monthly Portfolio</a>').encode()
        docs = sources.discover_source(source, Fetcher(), AS_OF)
        self.assertEqual(docs[0]['portfolioDate'], '2026-09-30')
        self.assertEqual(calls[0][1:], ({'month': '09'}, 'form'))

    def test_scheme_listing_expands_only_exact_official_index_codes(self):
        source = dict(SOURCE, schemeDiscovery=dict(codeField='field_dofa_schcode', maxSchemes=3,
            urlTemplate='https://www.example-amc.in/list?scheme={schemeCode}&year={year}&month={monthName}'))
        urls = []
        def fetch(url):
            urls.append(url)
            if url == SOURCE['indexUrl']:
                return b'<script type="application/json">[{"field_dofa_schcode":"042"},{"field_dofa_schcode":"193"},{"field_dofa_schcode":"042"}]</script>'
            code = '042' if 'scheme=042' in url else '193'
            return json.dumps({'rows':[dict(name='Monthly portfolio September 2026',
                url=f'https://www.example-amc.in/Portfolio_{code}_September_2026.xlsx')]}).encode()
        docs = sources.discover_source(source, fetch, AS_OF)
        self.assertEqual(len(docs), 2)
        self.assertEqual(len(urls), 3)
        self.assertTrue(all('year=2026&month=September' in url for url in urls[1:]))
        source['schemeDiscovery']['maxSchemes'] = 1
        with self.assertRaises(sources.DiscoveryLimitError):
            sources.discover_source(source, fetch, AS_OF)

    def test_verified_official_origin_override_preserves_disclosed_url(self):
        source = dict(SOURCE, allowedHosts=SOURCE['allowedHosts'] + ['cdn.example-amc.in'],
            downloadHostOverrides={'cdn.example-amc.in':'www.example-amc.in'})
        html = b'<a href="https://cdn.example-amc.in/Monthly_Portfolio_September_2026.zip">Monthly portfolio</a>'
        doc = sources.discover_source(source, lambda url: html, AS_OF)[0]
        self.assertEqual(doc['url'], 'https://www.example-amc.in/Monthly_Portfolio_September_2026.zip')
        self.assertEqual(doc['disclosedUrl'], 'https://cdn.example-amc.in/Monthly_Portfolio_September_2026.zip')

    def test_fixed_verified_fallback_never_invents_a_new_reporting_month(self):
        source = dict(SOURCE, automaticRenewal=False, verifiedDocuments=[dict(
            url='https://www.example-amc.in/Monthly_Portfolio_September_2026.zip',
            portfolioDate='2026-09-30', format='zip', discoveryMode='verified-dated-fallback')])
        self.assertEqual(sources.discover_source(source, lambda url: b'', dt.date(2026, 8, 31)), [])
        doc = sources.discover_source(source, lambda url: b'', dt.date(2026, 11, 30))[0]
        self.assertEqual(doc['portfolioDate'], '2026-09-30')
        self.assertEqual(doc['discoveryMode'], 'verified-dated-fallback')

    def test_discovery_limits_fail_closed(self):
        with self.assertRaises(sources.DiscoveryLimitError):
            sources.discover_source(SOURCE, lambda url: b'x' * (sources.MAX_PAGE_BYTES + 1), AS_OF)
        html = ''.join(f'<a href="/Portfolio_September_2026_{i}.xlsx">monthly</a>' for i in range(501)).encode()
        with self.assertRaises(sources.DiscoveryLimitError):
            sources.discover_source(SOURCE, lambda url: html, AS_OF)

    def test_only_public_https_allowlisted_hosts(self):
        allowed = SOURCE['allowedHosts']
        for url in ['http://www.example-amc.in/a.xlsx', 'https://evil.invalid/a.xlsx',
                    'https://user:password@www.example-amc.in/a.xlsx',
                    'https://www.example-amc.in:8443/a.xlsx', 'https://127.0.0.1/a.xlsx',
                    'https://www.example-amc.in./a.xlsx', 'https://www.example-amc.in/a.xlsx#x',
                    'https://www.example-amc.in/a b.xlsx']:
            with self.subTest(url=url), self.assertRaises(ValueError):
                sources.validate_url(url, allowed)
        with patch.object(socket, 'getaddrinfo', return_value=[(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('127.0.0.1', 443))]):
            with self.assertRaises(ValueError):
                sources.validate_url('https://www.example-amc.in/file.xlsx', allowed, resolve=True)

    def test_redirect_targets_and_download_sizes_are_checked(self):
        public_dns = [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('8.8.8.8', 443))]
        guards = []

        class Response(io.BytesIO):
            headers = {'Content-Length': str(sources.MAX_BYTES + 1)}
            def geturl(self):
                return 'https://www.example-amc.in/Portfolio.xlsx'

        class Opener:
            def open(self, request, timeout):
                return Response(b'')

        def opener(guard):
            guards.append(guard); return Opener()
        with patch.object(socket, 'getaddrinfo', return_value=public_dns), patch.object(sources.urllib.request, 'build_opener', side_effect=opener):
            with self.assertRaises(ValueError):
                sources.build_fetcher([SOURCE])('https://www.example-amc.in/Portfolio.xlsx')
            with self.assertRaises(ValueError):
                guards[0].redirect_request(None, None, 302, '', {}, 'https://evil.invalid/file.xlsx')


if __name__ == '__main__':
    unittest.main()
