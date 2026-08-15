import dns from 'node:dns/promises';
import net from 'node:net';

function isPrivateIp(address) {
  if (net.isIPv4(address)) {
    const [a, b] = address.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
  const ip = address.toLowerCase();
  return ip === '::1' || ip === '::' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe8') || ip.startsWith('fe9') || ip.startsWith('fea') || ip.startsWith('feb') || ip.startsWith('::ffff:127.') || ip.startsWith('::ffff:10.') || ip.startsWith('::ffff:192.168.');
}

export async function assertAllowedExternalUrl(rawUrl, allowedHosts) {
  const url = new URL(rawUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new Error('External URL must be plain HTTPS');
  const hostname = url.hostname.toLowerCase();
  if (!allowedHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))) throw new Error('External hostname is not allowlisted');
  const addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) throw new Error('External hostname resolved to a blocked address');
  return url;
}
