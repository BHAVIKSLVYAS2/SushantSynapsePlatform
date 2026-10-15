"""Fixed, audited AMC sources and bounded discovery of monthly disclosures.

An AMFI directory link is evidence of a publisher, not verified scheme coverage.
Every returned document still needs workbook-level date, identity and NAV validation.
No request URL or hostname comes from a public API caller.
"""
from __future__ import annotations

import calendar
import ast
from concurrent.futures import ThreadPoolExecutor
import datetime as dt
from html import unescape
from html.parser import HTMLParser
import ipaddress
import json
from pathlib import Path
import re
import socket
import urllib.parse
import urllib.request

REGISTRY = Path(__file__).with_name('official-sources.json')
# Align with the workbook parser's existing compressed document bound. ICICI's
# public consolidated September ZIP is 25.9 MB; index pages remain capped at 6 MB.
MAX_BYTES = 40_000_000
MAX_PAGE_BYTES = 6_000_000
MAX_DOCUMENTS = 500


class DiscoveryLimitError(ValueError):
    pass
MONTHS = {name.lower(): number for number in range(1, 13)
          for name in (calendar.month_name[number], calendar.month_abbr[number])}
MONTHS['sept'] = 9
MONTH_PATTERN = '(?:' + '|'.join(sorted(MONTHS, key=len, reverse=True)) + ')'


def validate_url(url, allowed_hosts, resolve=False):
    """Reject non-HTTPS, foreign hosts, credentials, ports and private addresses."""
    if not isinstance(url, str) or len(url) > 4096 or any(ord(c) < 32 or c.isspace() for c in url):
        raise ValueError('Invalid official source URL')
    parts = urllib.parse.urlsplit(url)
    if parts.scheme != 'https' or not parts.hostname or parts.username or parts.password:
        raise ValueError('Official sources require HTTPS without credentials')
    try:
        host = parts.hostname.encode('idna').decode('ascii').lower()
        if parts.port not in (None, 443):
            raise ValueError('Official source port is not allowed')
    except (UnicodeError, ValueError) as error:
        raise ValueError('Invalid official source authority') from error
    if host not in set(allowed_hosts) or host.endswith('.') or parts.fragment:
        raise ValueError('Source host is not in the fixed official allowlist')
    try:
        ipaddress.ip_address(host)
    except ValueError:
        pass
    else:
        raise ValueError('IP literal sources are not allowed')
    if resolve:
        addresses = socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)
        if not addresses or any(not ipaddress.ip_address(item[4][0]).is_global for item in addresses):
            raise ValueError('Official source resolved to a non-public address')
    return urllib.parse.urlunsplit(parts)


def load_sources(path=None):
    """Load the repository-owned registry, retaining unavailable AMCs for reporting."""
    registry = json.loads(Path(path or REGISTRY).read_text(encoding='utf-8'))
    if registry.get('version') != 1 or not isinstance(registry.get('sources'), list):
        raise ValueError('Unsupported official source registry')
    if not 1 <= len(registry['sources']) <= 100:
        raise ValueError('Invalid official source count')
    identifiers = set()
    for source in registry['sources']:
        identifier = source.get('id', '')
        if not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,79}', identifier) or identifier in identifiers:
            raise ValueError('Invalid or duplicate AMC identifier')
        identifiers.add(identifier)
        if not source.get('amc') or source.get('adapter') not in ('generic', 'ppfas'):
            raise ValueError('Invalid AMC source metadata')
        hosts = source.get('allowedHosts', [])
        if not isinstance(hosts, list) or len(hosts) > 8 or any(not re.fullmatch(r'[a-z0-9.-]+', h) for h in hosts):
            raise ValueError('Invalid official hostname list')
        if source.get('enabled'):
            validate_url(source['indexUrl'], hosts)
            for url in source.get('discoveryUrls', []):
                validate_url(url, hosts)
            for template in source.get('discoveryTemplates', []):
                validate_url(template.format(year=2026, month=9, month2='09', monthName='September'), hosts)
            for request in source.get('discoveryRequests', []):
                validate_url(request['url'], hosts)
            if source.get('schemeDiscovery'):
                validate_url(source['schemeDiscovery']['urlTemplate'].format(
                    schemeCode='042', year=2026, month=9, month2='09', monthName='September'), hosts)
            for disclosed_host, origin_host in source.get('downloadHostOverrides', {}).items():
                if disclosed_host not in hosts or origin_host not in hosts:
                    raise ValueError('Download origin override must use fixed official hosts')
            for doc in source.get('verifiedDocuments', []):
                validate_url(doc['url'], hosts)
    return registry['sources']


class SafeFetcher:
    """Download from the fixed registry only, checking every redirect and DNS answer."""
    def __init__(self, sources, timeout=20, max_bytes=MAX_BYTES):
        self.allowed_hosts = frozenset(host for source in sources for host in source.get('allowedHosts', []))
        self.timeout = min(max(timeout, 1), 30)
        self.max_bytes = min(max_bytes, MAX_BYTES)

    def fetch_bytes(self, url):
        return self.request_bytes(url)

    def request_bytes(self, url, data=None, encoding='json'):
        allowed_hosts = self.allowed_hosts
        if data is not None and (not isinstance(data, dict) or len(json.dumps(data)) > 4000):
            raise ValueError('Invalid configured disclosure listing request')
        if encoding not in ('json', 'form'):
            raise ValueError('Unsupported public listing encoding')

        class RedirectGuard(urllib.request.HTTPRedirectHandler):
            count = 0

            def redirect_request(self, req, fp, code, msg, headers, newurl):
                self.count += 1
                if self.count > 4:
                    raise ValueError('Too many official source redirects')
                validate_url(newurl, allowed_hosts, resolve=True)
                return super().redirect_request(req, fp, code, msg, headers, newurl)

        validate_url(url, allowed_hosts, resolve=True)
        opener = urllib.request.build_opener(RedirectGuard())
        encoded_data = (json.dumps(data).encode() if encoding == 'json' else urllib.parse.urlencode(data).encode()) if data is not None else None
        request = urllib.request.Request(url, data=encoded_data, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; FundLens/1.0; public-disclosure-verification)',
            'Accept': '*/*', 'Accept-Encoding': 'identity',
            'Content-Type': 'application/json' if encoding == 'json' else 'application/x-www-form-urlencoded'})
        with opener.open(request, timeout=self.timeout) as response:
            validate_url(response.geturl(), allowed_hosts, resolve=True)
            if response.headers.get('Content-Encoding', 'identity') != 'identity':
                raise ValueError('Compressed HTTP responses are not supported')
            length = response.headers.get('Content-Length')
            if length and int(length) > self.max_bytes:
                raise ValueError('Official disclosure exceeds byte limit')
            raw = response.read(self.max_bytes + 1)
        if len(raw) > self.max_bytes:
            raise ValueError('Official disclosure exceeds byte limit')
        return raw

    __call__ = fetch_bytes


def build_fetcher(sources):
    return SafeFetcher(sources)


def portfolio_date(value, as_of, allow_short_years=False):
    """Extract explicit reporting dates; a month/year means that month's final day."""
    text = unescape(urllib.parse.unquote(str(value).split('?', 1)[0])).lower()
    text = re.sub(r'(\d{1,2})(?:st|nd|rd|th)(?=[\s_.-])', r'\1', text)
    text = re.sub(r'[_./,\s]+', '-', text)
    if allow_short_years:
        text = re.sub(r'(' + MONTH_PATTERN + r')-(\d{2})(?!\d)',
                      lambda match: match[1] + '-20' + match[2], text)
    candidates = []

    def add(year, month, day=None):
        try:
            year, month = int(year), int(month)
            day = int(day) if day else calendar.monthrange(year, month)[1]
            candidate = dt.date(year, month, day)
            if dt.date(2010, 1, 1) <= candidate <= as_of:
                candidates.append(candidate)
        except (ValueError, TypeError):
            pass

    for match in re.finditer(r'(?<!\d)(20\d{2})-(\d{1,2})-(\d{1,2})(?!\d)', text):
        add(*match.groups())
    for match in re.finditer(r'(?<!\d)(\d{1,2})-(\d{1,2})-(20\d{2})(?!\d)', text):
        day, month, year = match.groups(); add(year, month, day)
    for match in re.finditer(r'(?<!\d)(\d{2})(\d{2})(20\d{2})(?!\d)', text):
        day, month, year = match.groups(); add(year, month, day)
    for match in re.finditer(r'(?<!\d)(20\d{2})(\d{2})(\d{2})(?!\d)', text):
        add(*match.groups())
    for match in re.finditer(r'(?<![a-z])(' + MONTH_PATTERN + r')-?(\d{1,2})-(20\d{2})(?!\d)', text):
        month, day, year = match.groups(); add(year, MONTHS[month], day)
    for match in re.finditer(r'(?<!\d)(\d{1,2})-?(' + MONTH_PATTERN + r')-?(20\d{2})(?!\d)', text):
        day, month, year = match.groups(); add(year, MONTHS[month], day)
    # Four-digit years are deliberate: ambiguous two-digit years are not inferred.
    for match in re.finditer(r'(?<![a-z])(' + MONTH_PATTERN + r')-?(20\d{2})(?!\d)', text):
        month, year = match.groups(); add(year, MONTHS[month])
    for match in re.finditer(r'(?<!\d)(20\d{2})-?(' + MONTH_PATTERN + r')(?![a-z])', text):
        year, month = match.groups(); add(year, MONTHS[month])
    for match in re.finditer(r'(?<!\d)(20\d{2})-(\d{2})(?![-\d])', text):
        add(*match.groups())
    return max(candidates) if candidates else None


class DisclosureLinks(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []
        self.active = None
        self.row_text = ''
        self.in_row = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'tr':
            self.row_text = ''
            self.in_row = True
        if tag == 'a':
            self.active = [attrs.get('href', ''), attrs.get('title', '') + ' ' + self.row_text[-160:]]
        for field in ('data-href', 'data-url'):
            if attrs.get(field):
                self.links.append((attrs[field], attrs.get('title', '')))

    def handle_data(self, data):
        if self.in_row:
            self.row_text = (self.row_text + ' ' + data)[-300:]
        if self.active:
            self.active[1] += ' ' + data

    def handle_endtag(self, tag):
        if tag == 'a' and self.active:
            self.links.append(tuple(self.active)); self.active = None
        if tag == 'tr':
            self.in_row = False
            self.row_text = ''


def _json_links(text):
    """Preserve the date/name attached to an AMC's structured download entry."""
    roots = []
    for match in re.finditer(r'<script[^>]*(?:type=["\']application/json["\']|id=["\']__NEXT_DATA__["\'])[^>]*>(.*?)</script>', text, re.S):
        try:
            roots.append(json.loads(match[1]))
        except (ValueError, TypeError):
            pass
    for match in re.finditer(r'self\.__next_f\.push\((\[.*?\])\)</script>', text, re.S):
        try:
            chunk = json.loads(match[1])
            payload = chunk[1] if len(chunk) > 1 and isinstance(chunk[1], str) else ''
            for line in payload.splitlines():
                value = line.split(':', 1)[-1]
                if value.startswith(('{', '[')):
                    try:
                        roots.append(json.loads(value))
                    except ValueError:
                        pass
        except (ValueError, TypeError):
            pass
    links = []
    visited = 0

    def walk(value, context='', depth=0):
        nonlocal visited
        visited += 1
        if visited > 100_000 or depth > 40:
            raise DiscoveryLimitError('Official structured index exceeds traversal limit')
        if isinstance(value, dict):
            context = ' '.join([context] + [str(value[key]) for key in
                ('portfolioDate', 'reportingDate', 'uploadDate', 'name', 'title', 'Title', 'Name', 'FSMonth', 'ResourceLink', 'shareTitle') if value.get(key)])[-600:]
            for child in value.values():
                walk(child, context, depth + 1)
        elif isinstance(value, list):
            for child in value:
                walk(child, context, depth + 1)
        elif isinstance(value, str) and re.search(r'\.(xlsx?|zip)(?:\?|$)', value, re.I):
            if value.startswith(('https://', '/')):
                links.append((value, context))
    for root in roots:
        walk(root)
    return links


def discover_source(source, fetch_bytes, as_of=None):
    """Discover dated spreadsheet/ZIP links; return only the latest observed month.

    Stored verified links are a bounded fallback for JS-only pages. They remain
    explicitly dated and can become stale; they never imply fresh national coverage.
    """
    as_of = as_of or dt.datetime.now(dt.timezone.utc).date()
    if not isinstance(as_of, dt.date) or not source.get('enabled', True):
        return []
    hosts = source.get('allowedHosts', [])
    requests = [(url, None, 'json') for url in list(dict.fromkeys([source['indexUrl']] + source.get('discoveryUrls', [])))]
    month_end = as_of.replace(day=1) - dt.timedelta(days=1)
    replacements = dict(year=month_end.year, month=month_end.month, month2=f'{month_end.month:02d}', monthName=calendar.month_name[month_end.month])
    for template in source.get('discoveryTemplates', []):
        requests.append((template.format(**replacements), None, 'json'))
    for request in source.get('discoveryRequests', []):
        data = {key: value.format(**replacements) if isinstance(value, str) else value for key, value in request.get('data', {}).items()}
        requests.append((request['url'], data, request.get('encoding', 'json')))
    if len(requests) > 6:
        raise ValueError('Too many configured discovery pages')
    cached_pages = {}
    scheme_discovery = source.get('schemeDiscovery')
    if scheme_discovery:
        if scheme_discovery.get('codeField') != 'field_dofa_schcode':
            raise ValueError('Unknown official scheme-code field')
        index_raw = fetch_bytes(source['indexUrl'])
        if not isinstance(index_raw, bytes) or len(index_raw) > MAX_PAGE_BYTES:
            raise DiscoveryLimitError('Official scheme index exceeds byte limit')
        cached_pages[source['indexUrl']] = index_raw
        codes = sorted(set(re.findall(r'"field_dofa_schcode"\s*:\s*"(\d{1,4})"', index_raw.decode('utf-8', errors='replace'))))
        max_schemes = min(int(scheme_discovery.get('maxSchemes', 160)), 200)
        if not codes or len(codes) > max_schemes:
            raise DiscoveryLimitError('Official scheme-code list is missing or exceeds its bound')
        extra_urls = [scheme_discovery['urlTemplate'].format(schemeCode=code, **replacements) for code in codes]
        for url in extra_urls:
            validate_url(url, hosts)
        # Exact scheme codes are read only from the configured official index.
        # The public listing is fetched with four workers and no credentials.
        def fetch_scheme(url):
            try:
                raw = fetch_bytes(url)
                if not isinstance(raw, bytes) or len(raw) > MAX_PAGE_BYTES:
                    raise DiscoveryLimitError('Official scheme listing exceeds byte limit')
                return raw
            except (OSError, ValueError) as error:
                return error
        total_bytes = len(index_raw)
        with ThreadPoolExecutor(max_workers=4) as executor:
            for url, result in zip(extra_urls, executor.map(fetch_scheme, extra_urls)):
                if isinstance(result, DiscoveryLimitError):
                    raise result
                if isinstance(result, bytes):
                    total_bytes += len(result)
                    if total_bytes > 20_000_000:
                        raise DiscoveryLimitError('Official scheme listing batch exceeds byte limit')
                cached_pages[url] = result
        requests += [(url, None, 'json') for url in extra_urls]
    candidates = []
    errors = []

    def record(doc):
        if candidates and doc['portfolioDate'] > candidates[0]['portfolioDate']:
            candidates.clear()
        if not candidates or doc['portfolioDate'] == candidates[0]['portfolioDate']:
            if not any(item['url'] == doc['url'] for item in candidates):
                candidates.append(doc)
                if len(candidates) > MAX_DOCUMENTS:
                    raise DiscoveryLimitError('Too many disclosure links for the latest month')

    for index_url, data, encoding in requests:
        validate_url(index_url, hosts)
        try:
            if index_url in cached_pages:
                raw = cached_pages[index_url]
                if isinstance(raw, Exception):
                    raise raw
            elif data is not None and hasattr(fetch_bytes, 'request_bytes'):
                raw = fetch_bytes.request_bytes(index_url, data, encoding) if encoding != 'json' else fetch_bytes.request_bytes(index_url, data)
            else:
                raw = fetch_bytes(index_url)
            if not isinstance(raw, bytes) or len(raw) > MAX_PAGE_BYTES:
                raise DiscoveryLimitError('Official index exceeds byte limit')
            text = raw.decode('utf-8-sig', errors='replace')
            if source.get('quotedHtml') and text.startswith("'") and text.endswith("'"):
                decoded_html = ast.literal_eval(text)
                if not isinstance(decoded_html, str):
                    raise ValueError('Invalid public listing HTML envelope')
                text = decoded_html
            parser = DisclosureLinks(); parser.feed(text)
            structured = _json_links(text)
            if text.lstrip().startswith(('{', '[')):
                structured += _json_links('<script type="application/json">' + text + '</script>')
            decoded = text.replace('\\/', '/').replace('\\u0026', '&').replace('\\"', '"')
            # AMC Next/JSON state often contains the official links without anchors.
            inline = re.findall(r'''(?<=["'])(?:https://|/)[^<>"'\\\r\n]{4,2048}\.(?:xlsx?|zip)(?:\?[^\s<>"'\\]{0,512})?''', decoded, re.I)
            for href, label in parser.links + structured + [(url, '') for url in inline]:
                if not isinstance(href, str) or not href:
                    continue
                url = urllib.parse.urljoin(index_url, unescape(href)).split('#', 1)[0]
                parts = urllib.parse.urlsplit(url)
                url = urllib.parse.urlunsplit((parts.scheme, parts.netloc,
                    urllib.parse.quote(parts.path, safe="/%:@()!$&'*,;=+-._~"),
                    urllib.parse.quote(parts.query, safe="=&%:;,+/?@()!$'*-._~"), ''))
                extension = re.search(r'\.(xlsx?|zip)$', urllib.parse.urlsplit(url).path, re.I)
                if not extension:
                    continue
                try:
                    validate_url(url, hosts)
                except ValueError:
                    continue
                disclosed_url = url
                origin = source.get('downloadHostOverrides', {}).get(urllib.parse.urlsplit(url).hostname)
                if origin:
                    original = urllib.parse.urlsplit(url)
                    url = urllib.parse.urlunsplit(('https', origin, original.path, original.query, ''))
                    validate_url(url, hosts)
                # Avoid unrelated financial/annual documents on mixed download pages.
                combined = url + ' ' + label
                if not re.search(source.get('documentPattern', r'portfolio|holdings?'), combined, re.I):
                    continue
                document_name = urllib.parse.unquote(Path(parts.path).name) + ' ' + label
                if re.search(r'annual[-_ ]report|financial[-_ ]statement|unaudited|riskometer|factsheet|fact[-_ ]sheet|overlap|aaum|tracking|proxy|voting|complaint|sebi[-_ ]transaction', document_name, re.I):
                    continue
                date = portfolio_date(url, as_of, source.get('allowShortYears', False)) or portfolio_date(label, as_of)
                if date:
                    doc = dict(url=url, portfolioDate=date.isoformat(),
                                           format=extension[1].lower(), label=label.strip(),
                                           fileName=Path(urllib.parse.unquote(urllib.parse.urlsplit(url).path)).name)
                    if disclosed_url != url:
                        doc['disclosedUrl'] = disclosed_url
                    record(doc)
        except (OSError, ValueError) as error:
            if isinstance(error, DiscoveryLimitError):
                raise
            errors.append(error)
    for doc in source.get('verifiedDocuments', []):
        validate_url(doc['url'], hosts)
        date = dt.date.fromisoformat(doc['portfolioDate'])
        if date <= as_of:
            record(dict(doc, fileName=doc.get('fileName') or Path(urllib.parse.urlsplit(doc['url']).path).name))
    if not candidates:
        if errors:
            raise ValueError('Official discovery failed: ' + str(errors[0])) from errors[0]
        return []
    latest = max(doc['portfolioDate'] for doc in candidates)
    deduplicated = {doc['url']: doc for doc in candidates if doc['portfolioDate'] == latest}
    return [deduplicated[url] for url in sorted(deduplicated)]
