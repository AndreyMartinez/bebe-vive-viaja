import type { APIRoute } from 'astro';
import { site } from '../config/site';
import { manifest } from '../lib/manifest';
import { url } from '../lib/url';

export const GET: APIRoute = () => manifest({ name: site.name, shortName: 'BVV', start: url('/') });
