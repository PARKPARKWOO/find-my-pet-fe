/**
 * 법률 문서(개인정보 처리방침·이용약관) 전용 조판 프리미티브.
 *
 * 두 문서가 각자 클래스를 들고 있으면 한쪽만 고쳐지면서 조항 간격과 표 모양이 어긋난다.
 * 법률 문서는 "읽히는 것" 자체가 요건이라 본문 폭·조항 번호·표 스크롤 규칙을 여기서만 정한다.
 *
 * 상호작용이 없으므로 전부 서버 컴포넌트로 둔다.
 */

export function LegalSection({
  id,
  no,
  title,
  children,
}: {
  id: string;
  no: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    // scroll-mt: 목차 앵커로 점프했을 때 제목이 화면 최상단에 붙어 잘리는 것을 막는다.
    <section id={id} className="mt-10 scroll-mt-20">
      <h2 className="text-lg font-bold">
        제{no}조 {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export function LegalBullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

/** 한 조 안에서 항을 나눌 때 쓰는 소제목. 조 제목(h2)보다 작지만 본문과는 확실히 구분한다. */
export function LegalSubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="pt-2 font-semibold text-foreground">{children}</h3>;
}

/**
 * 표는 좁은 화면에서 셀이 한 글자씩 접히는 대신 가로로 스크롤되게 한다.
 * min-w 를 주지 않으면 모바일에서 읽을 수 없는 형태가 되므로 컬럼 수에 맞춰 넘긴다.
 */
export function LegalTable({
  head,
  rows,
  minWidth = 560,
}: {
  head: string[];
  rows: React.ReactNode[][];
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-xs" style={{ minWidth }}>
        <thead className="bg-gray-50 text-foreground">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t align-top">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 leading-relaxed">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LegalExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2"
    >
      {children}
    </a>
  );
}

export function LegalToc({ items }: { items: Array<{ id: string; label: string }> }) {
  return (
    <nav aria-label="목차" className="mt-8 rounded-lg border p-4">
      <p className="text-sm font-semibold text-foreground">목차</p>
      <ul className="mt-2 grid gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
        {items.map((t) => (
          <li key={t.id}>
            <a href={`#${t.id}`} className="underline underline-offset-2">
              {t.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
