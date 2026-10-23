import type { APIRoute } from 'astro';
import { manifest } from '../../../lib/manifest';
import { url } from '../../../lib/url';
import { getViajes, type Viaje } from '../../../lib/viajes';

export async function getStaticPaths() {
  const { all } = await getViajes();
  return all.map((v) => ({ params: { slug: v.id }, props: { viaje: v } }));
}

export const GET: APIRoute = ({ props }) => {
  const { viaje } = props as { viaje: Viaje };
  const d = viaje.data;
  return manifest({ name: `${d.title} & ${d.titleAccent} · BVV`, shortName: d.titleAccent, start: url(`/viajes/${viaje.id}/`) });
};
