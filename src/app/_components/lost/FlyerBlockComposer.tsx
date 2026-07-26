"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import {
  ALWAYS_ON_BLOCKS,
  BLOCK_LABELS,
  canToggleBlock,
  type FlyerBlockId,
  type FlyerComposition,
} from "@/app/_components/lost/FlyerPrintDialog";
import { cn } from "@/lib/utils";

interface Props {
  composition: FlyerComposition;
  onChange: (next: FlyerComposition) => void;
}

/**
 * 전단지에 들어갈 블록을 고르고 순서를 바꾸는 패널.
 *
 * 캔버스 에디터나 드래그앤드롭 대신 체크박스 + 위/아래 버튼만 쓴다 — 터치에서 드래그는
 * 조작이 까다롭고, 자유 배치가 가능해지는 순간 "절대 안 깨진다"는 보장이 흔들리기 쉬워진다.
 * 사진은 남는 공간을 흡수하는 유일한 유연 블록이라 항상 맨 위에 고정하고 순서 대상에서 뺀다.
 *
 * canToggleBlock 은 DOM 을 재지 않고 FlyerPrintDialog 의 297mm 산수(compositionFits)만으로
 * 켤 수 있는지 판단한다 — 그래서 사용자는 애초에 시트를 넘치게 만드는 조합을 구성할 수 없다.
 */
export default function FlyerBlockComposer({ composition, onChange }: Props) {
  const { enabled, order } = composition;

  const toggle = (id: FlyerBlockId) => {
    if (ALWAYS_ON_BLOCKS[id]) return;
    if (!enabled[id] && !canToggleBlock(enabled, id)) return;
    onChange({ ...composition, enabled: { ...enabled, [id]: !enabled[id] } });
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...composition, order: next });
  };

  return (
    <div className="space-y-1.5">
      <BlockRow
        id="photo"
        label={BLOCK_LABELS.photo}
        checked={enabled.photo}
        disabledReason={
          !enabled.photo && !canToggleBlock(enabled, "photo")
            ? "다른 블록을 먼저 꺼야 켤 수 있어요"
            : null
        }
        onToggle={() => toggle("photo")}
        pinnedNote="항상 맨 위"
      />
      {order.map((id, index) => (
        <BlockRow
          key={id}
          id={id}
          label={BLOCK_LABELS[id]}
          checked={enabled[id]}
          alwaysOnReason={ALWAYS_ON_BLOCKS[id] ?? null}
          disabledReason={
            !ALWAYS_ON_BLOCKS[id] && !enabled[id] && !canToggleBlock(enabled, id)
              ? "공간이 부족해요 — 다른 블록을 먼저 꺼보세요"
              : null
          }
          onToggle={() => toggle(id)}
          onMoveUp={() => move(index, -1)}
          onMoveDown={() => move(index, 1)}
          moveUpDisabled={index === 0}
          moveDownDisabled={index === order.length - 1}
        />
      ))}
    </div>
  );
}

function BlockRow({
  id,
  label,
  checked,
  alwaysOnReason,
  disabledReason,
  pinnedNote,
  onToggle,
  onMoveUp,
  onMoveDown,
  moveUpDisabled,
  moveDownDisabled,
}: {
  id: string;
  label: string;
  checked: boolean;
  alwaysOnReason?: string | null;
  disabledReason?: string | null;
  pinnedNote?: string;
  onToggle: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  moveUpDisabled?: boolean;
  moveDownDisabled?: boolean;
}) {
  const inputId = `flyer-block-${id}`;
  const reasonId = `${inputId}-reason`;
  const isLocked = Boolean(alwaysOnReason);
  const isBlocked = Boolean(disabledReason) && !checked;
  const reasonText = alwaysOnReason ?? disabledReason ?? null;

  return (
    <div className="flex items-center gap-2 rounded-md border border-input bg-background px-2.5 py-2">
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        disabled={isLocked || isBlocked}
        onChange={onToggle}
        aria-describedby={reasonText ? reasonId : undefined}
        className={cn(
          "h-4 w-4 shrink-0 rounded-sm border-input text-gray-900",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      />
      <label htmlFor={inputId} className="min-w-0 flex-1 cursor-pointer">
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        {reasonText && (
          <span id={reasonId} className="block text-[11px] text-gray-500">
            {reasonText}
          </span>
        )}
      </label>
      {pinnedNote ? (
        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
          {pinnedNote}
        </span>
      ) : (
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={moveUpDisabled}
            aria-label={`${label} 위로 이동`}
            className="flex h-7 w-7 items-center justify-center rounded-sm border border-input text-gray-600 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronUp size={14} aria-hidden />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={moveDownDisabled}
            aria-label={`${label} 아래로 이동`}
            className="flex h-7 w-7 items-center justify-center rounded-sm border border-input text-gray-600 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronDown size={14} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
