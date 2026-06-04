import "./globals.css";

export const metadata = {
  title: "Loja de Pontos",
  description: "Troque seus pontos por prêmios",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <nav className="border-b border-white/10 bg-kick-panel">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <a href="/" className="text-lg font-extrabold">
              <span className="text-kick-green">●</span> Loja de Pontos
            </a>
            <div className="flex gap-4 text-sm">
              <a href="/" className="hover:text-kick-green">Loja</a>
              <a href="/ranking" className="hover:text-kick-green">Ranking</a>
              <a href="/minhas-trocas" className="hover:text-kick-green">Minhas trocas</a>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-10 text-center text-xs text-white/30">
          Pontos acumulados assistindo à live no Kick. Feito com Kicklet.
        </footer>
      </body>
    </html>
  );
}
