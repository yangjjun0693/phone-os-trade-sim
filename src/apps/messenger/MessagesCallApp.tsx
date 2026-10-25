import { useState } from 'react';
import { Phone } from 'lucide-react';
import { AppShell } from '../AppShell';
import { MessengerChat } from './MessengerChat';
import { MessengerInbox } from './MessengerInbox';

/**
 * 연락·문자 — the real-name channel. Messages arrive here instantly and leave a
 * trace. Only game threads live in this app; there is no mock inbox.
 */
export function MessagesCallApp() {
  const [openNpcId, setOpenNpcId] = useState<string | null>(null);

  return (
    <div className="relative h-full overflow-hidden">
      <AppShell title="메시지/통화" className="flex h-full flex-col">
        <div className="flex h-full min-h-0 flex-col">
          <MessengerInbox channel="phone" onOpenThread={setOpenNpcId} />

          <p className="mx-auto mt-auto flex max-w-[320px] items-start gap-2 px-4 pb-8 pt-4 text-[11px] leading-relaxed text-ios-muted">
            <Phone className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            문자는 즉시 도착하지만 기록이 남습니다. 같은 사람이 다시 연락하면 이
            대화가 이어집니다.
          </p>
        </div>
      </AppShell>

      {openNpcId ? (
        <MessengerChat channel="phone" npcId={openNpcId} onClose={() => setOpenNpcId(null)} />
      ) : null}
    </div>
  );
}
