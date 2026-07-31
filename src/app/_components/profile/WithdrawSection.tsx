'use client'

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useToast } from "@/hooks/use-toast";
import useIsLoginStore from "@/store/loginStore";
import {
  clearProfileCache,
  destroyMyServiceData,
  fetchWithdrawalPreview,
  isUnauthorizedError,
  withdrawAccount,
  type WithdrawalPreview,
} from "@/lib/auth";

/**
 * 회원 탈퇴.
 *
 * 탈퇴는 두 번의 호출이고 **순서가 곧 정합성**이다.
 *   1) FMP 개인정보 파기 (인증이 살아 있어야 서버가 본인 확인을 한다)
 *   2) auth-server 계정 탈퇴 (응답 Set-Cookie 로 세션이 끊긴다)
 * 뒤집으면 인증이 먼저 끊겨 게시글의 전화번호가 주인 없이 남는다. 그래서 1단계가 실패하면
 * 2단계는 아예 호출하지 않는다.
 *
 * 두 API 모두 멱등이라 중간에 실패해도 재시도가 안전하다. 대신 "무엇이 처리됐고 무엇이 남았는지"
 * 를 사실대로 보여줘야 한다 — 되돌릴 수 없는 작업에서 상태를 숨기면 이용자는 확인할 방법이 없다.
 */

/** 미리보기 건수를 사람이 읽는 문장으로. 지워지는 방식이 다른 항목(제보)은 그 사실을 함께 적는다. */
const PREVIEW_ROWS: Array<{
  key: keyof Omit<WithdrawalPreview, "total">;
  label: string;
  note?: string;
}> = [
  { key: "posts", label: "실종 신고 게시글", note: "전화번호·실종 장소·설명이 함께 삭제됩니다" },
  { key: "postImages", label: "게시글에 올린 사진" },
  { key: "sightings", label: "내가 남긴 목격 제보", note: "위치는 보호자의 단서라 남고, 이름·메모·사진만 삭제됩니다" },
  { key: "flyers", label: "전단지 부착 위치" },
  { key: "bookmarks", label: "즐겨찾기" },
  { key: "abandonedSubscriptions", label: "관심 지역 구독" },
  { key: "notifications", label: "받은 알림" },
  { key: "reviews", label: "내가 쓴 후기" },
];

export default function WithdrawSection() {
  const router = useRouter();
  const { toast } = useToast();
  // 프로필 화면 자체에는 인증 가드가 없다. 로그아웃 상태에서 탈퇴 버튼이 보이면 안 되므로 여기서 막는다.
  const isLogin = useIsLoginStore((state) => state.isLogin);
  const setLogout = useIsLoginStore((state) => state.setLogout);

  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<WithdrawalPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  // 1단계(개인정보 파기)까지 끝났는지. 재시도 시 남은 단계만 밟고, 이용자에게도 진행 상황을 그대로 알린다.
  const [dataDestroyed, setDataDestroyed] = useState(false);

  const loadPreview = useCallback(async () => {
    setIsPreviewLoading(true);
    setPreviewError(null);
    try {
      setPreview(await fetchWithdrawalPreview());
    } catch (error) {
      setPreview(null);
      if (isUnauthorizedError(error)) {
        // 401 은 전역 로그아웃 이벤트를 태우고, 그 순간 이 섹션 자체가 사라진다(isLogin=false).
        // 화면에만 적으면 사용자는 아무 설명도 못 본 채 끝나므로 토스트로도 남긴다.
        setPreviewError("로그인이 만료되었습니다. 다시 로그인한 뒤 진행해 주세요.");
        toast({
          variant: "destructive",
          title: "로그인이 만료되었습니다",
          description: "다시 로그인한 뒤 탈퇴를 진행해 주세요.",
        });
      } else {
        setPreviewError("삭제될 데이터를 불러오지 못했습니다. 다시 시도해 주세요.");
      }
    } finally {
      setIsPreviewLoading(false);
    }
  }, [toast]);

  // 파기가 진행 중일 때는 X·ESC·바깥 클릭 모두 막는다(전부 이 콜백을 거친다).
  // 되돌릴 수 없는 요청이 날아간 상태에서 화면이 사라지면 결과를 알 방법이 없다.
  const handleOpenChange = (next: boolean) => {
    if (isPending) return;
    setOpen(next);
    if (next) {
      setAgreed(false);
      setFailure(null);
      // 1단계가 이미 끝난 재진입이면 미리보기는 의미가 없다(전부 0). 남은 건 계정 탈퇴뿐.
      if (!dataDestroyed) loadPreview();
    }
  };

  const handleWithdraw = async () => {
    setIsPending(true);
    setFailure(null);

    // 1단계 성공 여부는 이 렌더에서 바로 알아야 해서 지역 변수로 들고 간다(state 반영은 다음 렌더).
    let destroyed = dataDestroyed;
    try {
      if (!destroyed) {
        await destroyMyServiceData();
        destroyed = true;
        setDataDestroyed(true);
      }
      await withdrawAccount();
    } catch (error) {
      const expired = isUnauthorizedError(error);
      // 어디까지 처리됐는지를 그대로 알린다. 되돌릴 수 없는 작업에서 "실패했습니다" 한 줄만 주면
      // 이용자는 데이터가 지워졌는지 아닌지 확인할 방법이 없다.
      const message = !destroyed
        ? expired
          ? "로그인이 만료되어 탈퇴를 진행하지 못했습니다. 계정과 데이터는 그대로입니다. 다시 로그인한 뒤 시도해 주세요."
          : "데이터 삭제에 실패했습니다. 계정과 데이터는 그대로 남아 있습니다. 잠시 후 다시 시도해 주세요."
        : expired
          ? "데이터 삭제는 완료되었지만 계정 탈퇴는 남아 있습니다. 다시 로그인한 뒤 한 번 더 진행해 주세요."
          : "데이터 삭제는 완료되었지만 계정 탈퇴에 실패했습니다. '다시 시도'를 눌러 주세요. 남은 단계만 다시 진행합니다.";
      setFailure(message);
      // 401 이면 전역 로그아웃 이벤트로 이 섹션이 통째로 사라지므로, 다이얼로그 밖에도 남겨야 한다.
      toast({
        variant: "destructive",
        title: destroyed ? "탈퇴가 끝나지 않았습니다" : "탈퇴하지 못했습니다",
        description: message,
      });
      setIsPending(false);
      return;
    }

    // 성공 — 쿠키는 이미 서버 응답이 만료시켰다(JS 로는 못 지운다). 로컬에 남은 흔적만 정리한다.
    clearProfileCache();
    setLogout();
    setIsPending(false);
    setOpen(false);
    toast({
      title: "탈퇴가 완료되었습니다",
      description: "그동안 이용해 주셔서 감사합니다.",
    });
    router.push("/");
  };

  if (!isLogin) return null;

  const rows = preview
    ? PREVIEW_ROWS.filter((row) => preview[row.key] > 0)
    : [];
  // 무엇이 지워지는지 모르는 채로 확정하게 두지 않는다.
  const confirmDisabled =
    isPending || !agreed || (!dataDestroyed && (isPreviewLoading || preview === null));

  return (
    <section className="mt-4 w-full border-t pt-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-muted-foreground">회원 탈퇴</span>
          <span className="text-xs text-muted-foreground">
            탈퇴하면 작성한 게시글과 사진이 삭제되고 카카오 로그인 연동이 해제됩니다. 되돌릴 수 없습니다.
          </span>
        </div>
        <Button
          variant="outline"
          className="h-8 self-start px-3 text-xs text-muted-foreground sm:self-auto"
          onClick={() => handleOpenChange(true)}
        >
          회원 탈퇴
        </Button>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>정말 탈퇴하시겠습니까?</DialogTitle>
            <DialogDescription>
              탈퇴하면 아래 데이터가 삭제되고 카카오 로그인 연동이 해제됩니다.{" "}
              <b className="text-foreground">삭제된 데이터는 복구할 수 없습니다.</b>
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[46vh] overflow-y-auto text-sm">
            {dataDestroyed ? (
              <p className="rounded-md border p-3 text-xs leading-relaxed text-muted-foreground">
                데이터 삭제는 이미 완료되었습니다. 남은 단계는 계정 탈퇴뿐이며, 아래 버튼으로 이어서
                진행할 수 있습니다.
              </p>
            ) : isPreviewLoading ? (
              <p className="text-xs text-muted-foreground">삭제될 데이터를 확인하는 중입니다…</p>
            ) : previewError ? (
              <div className="flex flex-col items-start gap-2">
                <p className="text-xs text-destructive">{previewError}</p>
                <Button variant="outline" className="h-8 px-3 text-xs" onClick={loadPreview}>
                  다시 불러오기
                </Button>
              </div>
            ) : preview && preview.total > 0 ? (
              <ul className="divide-y rounded-md border">
                {rows.map((row) => (
                  <li key={row.key} className="flex items-start justify-between gap-3 px-3 py-2">
                    <span className="flex flex-col">
                      <span className="text-xs text-foreground">{row.label}</span>
                      {row.note && (
                        <span className="text-[11px] leading-relaxed text-muted-foreground">
                          {row.note}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-foreground">
                      {preview[row.key].toLocaleString()}건
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">삭제할 데이터가 없습니다.</p>
            )}

            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              같은 카카오 계정으로 이용 중인 다른 서비스가 있으면 그 연결은 유지되며, 남은 연결이
              없을 때 카카오 연결이 해제됩니다. 삭제된 게시글은 데이터베이스에 삭제 표시와 함께
              남지만 전화번호·장소·설명 등 개인정보는 지워집니다.
            </p>

            {failure && (
              <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs leading-relaxed text-destructive">
                {failure}
              </p>
            )}
          </div>

          <label
            htmlFor="withdraw-agree"
            className="flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-muted-foreground"
          >
            <input
              id="withdraw-agree"
              type="checkbox"
              checked={agreed}
              disabled={isPending}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            위 내용을 확인했으며, 삭제된 데이터는 복구할 수 없다는 점에 동의합니다.
          </label>

          <DialogFooter className="justify-end gap-2">
            <Button variant="outline" disabled={isPending} onClick={() => handleOpenChange(false)}>
              취소
            </Button>
            <Button variant="destructive" disabled={confirmDisabled} onClick={handleWithdraw}>
              {isPending ? "처리 중…" : failure ? "다시 시도" : "탈퇴하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
