import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, MailWarning, ShieldCheck } from 'lucide-react';
import { PHISHING_MAILS } from '@/content/phishing';
import { Pill } from '@/components';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/utils/cn';
import { SPRING_SNAPPY } from '@/utils/motion';

/** Suspicious mail: opening it costs money or heat, ignoring it is free. */
export function PhishingMails() {
  const handled = useGameStore((s) => s.handledMails);
  const handleMail = useGameStore((s) => s.handleMail);
  const [openId, setOpenId] = useState<string | null>(null);
  const [result, setResult] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);

  const openMail = PHISHING_MAILS.find((mail) => mail.id === openId) ?? null;
  const remaining = PHISHING_MAILS.filter((mail) => !handled.includes(mail.id));

  const run = (id: string, action: 'open' | 'ignore') => {
    const outcome = handleMail(id, action);
    setResult({
      tone: action === 'open' ? 'bad' : 'ok',
      text: outcome.ok ? (outcome.message ?? '') : (outcome.error ?? ''),
    });
    setOpenId(null);
  };

  return (
    <div className="border-b border-ios-separator/20 pb-2">
      <div className="flex items-center gap-2 px-3 pb-2 pt-3">
        <MailWarning className="size-4 text-ios-orange" aria-hidden />
        <h3 className="text-[13px] font-semibold">의심 메일</h3>
        {remaining.length > 0 ? <Pill tone="orange">{remaining.length}</Pill> : null}
        {remaining.length === 0 ? <Pill tone="neutral">정리됨</Pill> : null}
      </div>

      <AnimatePresence>
        {result ? (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={SPRING_SNAPPY}
            className={cn(
              'mx-3 mb-2 flex items-start gap-2 rounded-xl px-3 py-2 text-[12px]',
              result.tone === 'ok' ? 'bg-ios-green/15 text-ios-green' : 'bg-ios-red/15 text-ios-red',
            )}
          >
            {result.tone === 'ok' ? (
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            ) : (
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            )}
            <span>{result.text}</span>
          </motion.p>
        ) : null}
      </AnimatePresence>

      {remaining.length === 0 ? (
        <p className="px-4 pb-1 text-[12px] text-ios-muted">
          남은 수상한 메일이 없습니다.
        </p>
      ) : (
        <ul className="space-y-1 px-2">
          {remaining.map((mail) => (
            <li key={mail.id}>
              <button
                type="button"
                onClick={() => setOpenId(mail.id)}
                className="w-full rounded-xl bg-ios-orange/10 px-3 py-2.5 text-left"
              >
                <span className="flex items-center gap-2">
                  <span className="truncate text-[14px] font-semibold">{mail.subject}</span>
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-ios-muted">
                  {mail.from} · {mail.preview}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {openMail ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={SPRING_SNAPPY}
            className="mx-2 overflow-hidden"
          >
            <div className="rounded-xl bg-ios-surface p-3 ring-1 ring-ios-orange/30">
              <p className="text-[12px] text-ios-muted">{openMail.from}</p>
              <p className="mt-1 text-[15px] font-semibold">{openMail.subject}</p>
              <div className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-ios-muted">
                {openMail.body.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => run(openMail.id, 'open')}
                  className="h-9 rounded-xl bg-ios-red text-[13px] font-semibold text-white"
                >
                  링크 확인
                </button>
                <button
                  type="button"
                  onClick={() => run(openMail.id, 'ignore')}
                  className="h-9 rounded-xl bg-ios-separator/20 text-[13px] font-semibold text-ios-muted"
                >
                  무시하고 삭제
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
