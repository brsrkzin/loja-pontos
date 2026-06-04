import { getRanking } from "../../lib/kicklet";

export const dynamic = "force-dynamic";

export default async function Ranking() {
  let lista = [];
  try {
    lista = await getRanking(20);
  } catch {
    lista = [];
  }
  return (
    <div>
      <h1 className="mb-6 text-3xl font-extrabold">Ranking da comunidade</h1>
      {lista.length === 0 ? (
        <p className="text-white/50">Sem dados de ranking ainda (ou Kicklet não configurado).</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-kick-panel text-white/60">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Viewer</th>
                <th className="px-4 py-3 text-right">Pontos</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((v, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="px-4 py-2 text-white/40">{i + 1}</td>
                  <td className="px-4 py-2 font-medium">{v.viewerKickUsername}</td>
                  <td className="px-4 py-2 text-right font-bold text-kick-green">
                    {(v.points || 0).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
