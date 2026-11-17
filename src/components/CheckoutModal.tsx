import React, { useEffect, useState } from 'react';
import { Check, CheckCircle2, Copy, QrCode, X } from 'lucide-react';
import type { CheckoutItem } from '../types';
import { formatBRL } from '../data/initialData';

interface CheckoutModalProps {
  item: CheckoutItem | null;
  onClose: () => void;
  onGenerateQr: (telegramHandle: string) => void;
  onConfirmPayment: (telegramHandle: string) => void;
  onCopyPix: () => void;
}

type CheckoutStep = 'form' | 'qrcode' | 'success';

const PIX_COPY_PASTE =
  '00020126580014br.gov.bcb.pix0136pixgold-ruivinha-vip-usdt-auto5204000053039865802BR5912RUIVINHA VIP6009SAO PAULO62070503***6304E2A1';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  item,
  onClose,
  onGenerateQr,
  onConfirmPayment,
  onCopyPix,
}) => {
  const [step, setStep] = useState<CheckoutStep>('form');
  const [telegramInput, setTelegramInput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (item) {
      setStep('form');
      setCopied(false);
    }
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  const normalizedHandle = `@${telegramInput.trim().replace(/^@/, '')}`;

  const handleStepOneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = telegramInput.trim().replace(/^@/, '');
    if (!cleaned) return;
    onGenerateQr(`@${cleaned}`);
    setStep('qrcode');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PIX_COPY_PASTE);
    } catch {
      // Fallback handled cleanly
    }
    setCopied(true);
    onCopyPix();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePaid = () => {
    onConfirmPayment(normalizedHandle);
    setStep('success');
  };

  const creatorPreviewMsg =
    item.kind === 'call'
      ? `Novo Pix recebido (${formatBRL(item.price)}): cliente ${normalizedHandle} comprou "${item.title}". Chame no Telegram para iniciar a videochamada.`
      : `Novo Pix recebido (${formatBRL(item.price)}): cliente ${normalizedHandle} adquiriu "${item.title}". Saldo convertido na carteira Pix Gold.`;

  const clientPreviewMsg =
    item.kind === 'call'
      ? `Pagamento confirmado! A Ruivinha VIP já foi notificada sobre "${item.title}" e vai te chamar aqui em instantes.`
      : `Obrigada pelo apoio! Seu acesso para "${item.title}" já foi liberado no site Ruivinha VIP e seu link privado está ativo.`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Checkout Pix Gold"
    >
      <div
        className="bg-obsidian-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 relative shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar checkout"
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-obsidian-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'form' && (
          <form onSubmit={handleStepOneSubmit} className="space-y-5">
            <div className="flex items-center gap-3 pr-8">
              <div className="w-11 h-11 rounded-xl bg-copper-500/15 text-copper-400 flex items-center justify-center shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-copper-400">
                  Gateway Pix Gold · Liquidação Cripto
                </p>
                <h3 className="font-display font-bold text-lg text-white truncate">
                  {item.title}
                </h3>
              </div>
            </div>

            <div className="py-3 border-y border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-400">Total a pagar via Pix</span>
              <span className="font-display font-extrabold text-xl text-white tabular-nums">
                {formatBRL(item.price)}
              </span>
            </div>

            <div>
              <label
                htmlFor="checkout-telegram-user"
                className="block text-xs font-semibold text-zinc-300 mb-1.5"
              >
                Seu @ do Telegram (Obrigatório para entrega ou chamada)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-zinc-500 text-sm">@</span>
                <input
                  id="checkout-telegram-user"
                  type="text"
                  required
                  value={telegramInput}
                  onChange={(e) => setTelegramInput(e.target.value)}
                  placeholder="seu_usuario_telegram"
                  className="w-full rounded-xl bg-obsidian-950 border border-zinc-700 pl-8 pr-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-copper-500"
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                Assim que o Pix compensar, nosso Bot te envia o acesso e notifica a Ruivinha na hora.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl ruiva-gradient text-white font-bold text-sm hover:opacity-95 transition-opacity"
            >
              Gerar QR Code Pix Instantâneo
            </button>
          </form>
        )}

        {step === 'qrcode' && (
          <div className="space-y-4 text-center">
            <div className="space-y-1 pr-6">
              <p className="text-xs font-semibold text-amber-400">
                Aguardando pagamento Pix Gold
              </p>
              <h4 className="font-display font-bold text-base text-white tabular-nums">
                {item.title} · {formatBRL(item.price)}
              </h4>
            </div>

            <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl flex items-center justify-center">
              <svg viewBox="0 0 120 120" className="w-full h-full" fill="#09090b" aria-label="QR Code Pix">
                <path d="M10 10h30v30H10V10zm5 5v20h20V15H15zm5 5h10v10H20V20z" />
                <path d="M80 10h30v30H80V10zm5 5v20h20V15H85zm5 5h10v10H90V20z" />
                <path d="M10 80h30v30H10V80zm5 5v20h20V85H15zm5 5h10v10H20V90z" />
                <rect x="48" y="12" width="6" height="6" />
                <rect x="60" y="12" width="12" height="6" />
                <rect x="48" y="24" width="12" height="6" />
                <rect x="66" y="24" width="6" height="12" />
                <rect x="12" y="48" width="12" height="6" />
                <rect x="30" y="48" width="6" height="12" />
                <rect x="48" y="48" width="24" height="24" rx="4" fill="#ea580c" />
                <rect x="80" y="48" width="12" height="6" />
                <rect x="98" y="48" width="12" height="12" />
                <rect x="12" y="66" width="12" height="6" />
                <rect x="80" y="66" width="6" height="6" />
                <rect x="48" y="80" width="6" height="12" />
                <rect x="60" y="86" width="12" height="6" />
                <rect x="80" y="80" width="18" height="6" />
                <rect x="104" y="80" width="6" height="18" />
                <rect x="48" y="102" width="18" height="6" />
                <rect x="74" y="98" width="12" height="12" />
                <rect x="92" y="104" width="18" height="6" />
              </svg>
            </div>

            <div className="text-left">
              <label htmlFor="pix-copy-paste" className="block text-xs font-medium text-zinc-400 mb-1">
                Pix Copia e Cola (Pix Gold Gateway)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="pix-copy-paste"
                  type="text"
                  readOnly
                  value={PIX_COPY_PASTE}
                  className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-300 font-mono"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3.5 py-2 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-white text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 space-y-2">
              <button
                type="button"
                onClick={handleSimulatePaid}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Simular Pagamento Aprovado (Webhook + Bot)</span>
              </button>
              <p className="text-[11px] text-zinc-500">
                Em produção, este retorno dispara automaticamente assim que o cliente paga no banco.
              </p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-display font-bold text-lg text-white">Pagamento Confirmado</h4>
              <p className="text-xs text-zinc-400">
                O conteúdo já foi destravado no site e o Bot do Telegram disparou as notificações:
              </p>
            </div>

            <div className="divide-y divide-zinc-800 border-y border-zinc-800 text-xs">
              <div className="py-3 space-y-1">
                <div className="flex items-center justify-between font-semibold text-sky-400">
                  <span>Bot → Telegram da Ruivinha (Criadora)</span>
                  <span className="text-[11px] text-zinc-500">Agora</span>
                </div>
                <p className="text-zinc-200 leading-relaxed">{creatorPreviewMsg}</p>
              </div>

              <div className="py-3 space-y-1">
                <div className="flex items-center justify-between font-semibold text-emerald-400">
                  <span>Bot → Telegram do Cliente</span>
                  <span className="text-[11px] text-zinc-500">Enviado</span>
                </div>
                <p className="text-zinc-200 leading-relaxed">{clientPreviewMsg}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl ruiva-gradient text-white font-bold text-sm hover:opacity-95 transition-opacity"
            >
              Acessar Conteúdo Liberado
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
