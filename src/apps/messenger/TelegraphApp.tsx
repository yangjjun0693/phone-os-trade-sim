import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { AppShell } from '../AppShell';
import { MessengerChat } from './MessengerChat';
import { MessengerInbox } from './MessengerInbox';

/**
 * Telegraph — the anonymous channel. Everything here is game state: one thread
 * per person, continued across the whole run.
 */
export function TelegraphApp() {
  const [openNpcId, setOpenNpcId] = useState<string | null>(null);

  return (
    <div className="relative h-full overflow-hidden">
      <AppShell title="Telegraph" className="flex h-full flex-col">
        <div className="flex h-full min-h-0 flex-col">
          <MessengerInbox channel="telegraph" onOpenThread={setOpenNpcId} />

          <p className="mx-auto mt-auto flex max-w-[320px] items-start gap-2 px-4 pb-8 pt-4 text-[11px] leading-relaxed text-ios-muted">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            익명 앱은 흔적이 적지만 답장이 늦고, 상대가 다른 앱으로 옮겨가자고 하면
            받아줄 수도 있습니다. 게임 안의 허구 서비스입니다.
          </p>
        </div>
      </AppShell>

      {openNpcId ? (
        <MessengerChat
          channel="telegraph"
          npcId={openNpcId}
          onClose={() => setOpenNpcId(null)}
        />
      ) : null}
    </div>
  );
}
