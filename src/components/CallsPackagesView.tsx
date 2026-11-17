import React from 'react';
import { ArrowRight, Video, Zap } from 'lucide-react';
import type { CallPackage } from '../types';
import { formatBRL } from '../data/initialData';

interface CallsPackagesViewProps {
  packages: CallPackage[];
  onSelectPackage: (packageId: string) => void;
}

export const CallsPackagesView: React.FC<CallsPackagesViewProps> = ({
  packages,
  onSelectPackage,
}) => {
  return (
    <section className="pt-6 space-y-6">
      <div className="bg-obsidian-900 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-copper-400">
            <Zap className="w-4 h-4" />
            <span>Atendimento &amp; Entrega Automática · Pix Gold → Cripto</span>
          </div>
          <h2 className="font-display font-bold text-lg sm:text-xl text-white">
            Videochamadas Privadas &amp; Packs Especiais
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Ao pagar o QR Code Pix, nosso Bot no Telegram avisa a Ruivinha na mesma hora para iniciar sua chamada ou envia o link do pacote direto no seu privado.
          </p>
        </div>

        <div className="text-xs font-medium text-emerald-400 whitespace-nowrap shrink-0 flex items-center gap-1.5">
          <Video className="w-4 h-4" />
          <span>Confirmação em segundos</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {packages.map((item) => (
          <article
            key={item.id}
            className={`bg-obsidian-900 border rounded-2xl p-6 flex flex-col justify-between gap-6 ${
              item.highlight ? 'border-copper-500/60' : 'border-zinc-800/80'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className={`text-xs font-semibold ${
                    item.type === 'call' ? 'text-rosegold-400' : 'text-copper-400'
                  }`}
                >
                  {item.categoryLabel}
                </span>
                <span className="font-display font-extrabold text-xl text-white tabular-nums whitespace-nowrap shrink-0">
                  {formatBRL(item.price)}
                </span>
              </div>

              <h3 className="font-display font-bold text-lg text-white">{item.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{item.description}</p>
            </div>

            <button
              type="button"
              onClick={() => onSelectPackage(item.id)}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
                item.highlight
                  ? 'ruiva-gradient text-white hover:opacity-95'
                  : 'bg-obsidian-800 hover:bg-obsidian-700 text-white border border-zinc-700/80'
              }`}
            >
              <span>{item.type === 'call' ? 'Agendar & Pagar via Pix' : 'Comprar Pack via Pix'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
};
