// 구현 기능 텍스트("제목 — 설명") 파싱/렌더링 로직. 프론트 상세 모달과 admin 미리보기가
// 같은 로직을 써야 admin에서 본 모습과 실제 사이트 모습이 어긋나지 않는다.

function splitFeature(text: string): [string, string] | null {
  const idx = text.indexOf(' — ')
  if (idx === -1) return null
  return [text.slice(0, idx), text.slice(idx + 3)]
}

const OPEN_BRACKETS = new Set(['(', '{', '['])
const CLOSE_BRACKETS = new Set([')', '}', ']'])
// "(p, q, r)" · "{success, data, error}"처럼 짧은 괄호는 통째로 보호하되, "(Kakao는 ~, Naver는 ~)"처럼
// 긴 설명형 괄호는 그 자체가 문장이라 안에서도 쉼표/마침표 기준으로 계속 끊는다
const SHORT_BRACKET_MAX_LEN = 20

// text 안에서 "보호할" 짧은 괄호 구간([시작, 끝) 인덱스)만 골라낸다
function shortBracketRanges(text: string): Array<[number, number]> {
  const stack: number[] = []
  const ranges: Array<[number, number]> = []
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (OPEN_BRACKETS.has(ch)) stack.push(i)
    else if (CLOSE_BRACKETS.has(ch)) {
      const start = stack.pop()
      if (start !== undefined && i - start - 1 <= SHORT_BRACKET_MAX_LEN) {
        ranges.push([start, i])
      }
    }
  }
  return ranges
}

function isInsideRange(ranges: Array<[number, number]>, i: number): boolean {
  return ranges.some(([s, e]) => i > s && i < e)
}

// 짧은 괄호 안의 화살표("32→16", "(p, q, r)")는 건드리지 않고, 그 밖의 " → "만 파이프라인 단계 구분으로 본다
function splitArrowSteps(text: string): string[] {
  const protectedRanges = shortBracketRanges(text)
  const steps: string[] = []
  let start = 0
  for (let i = 0; i < text.length; i++) {
    if (!isInsideRange(protectedRanges, i) && text.startsWith(' → ', i)) {
      steps.push(text.slice(start, i))
      start = i + 3
      i += 2
    }
  }
  steps.push(text.slice(start))
  return steps
}

// 짧은 괄호 밖의 쉼표/마침표에서 끊는다. 마침표는 뒤에 공백(또는 문장 끝)이 와야만 경계로 본다
// (kakao_account.profile, torch.onnx.export, 89.83% 같은 코드/숫자의 점은 보호)
function splitClauses(text: string): string[] {
  const protectedRanges = shortBracketRanges(text)
  const clauses: string[] = []
  let start = 0
  for (let i = 0; i < text.length; i++) {
    if (isInsideRange(protectedRanges, i)) continue
    const ch = text[i]
    if (ch === ',') {
      clauses.push(text.slice(start, i + 1))
      start = i + 1
    } else if (ch === '.' && (text[i + 1] === undefined || text[i + 1] === ' ')) {
      clauses.push(text.slice(start, i + 1))
      start = i + 1
    }
  }
  clauses.push(text.slice(start))
  return clauses.map((c) => c.trim()).filter(Boolean)
}

function FeatureBody({ text }: { text: string }) {
  const steps = splitArrowSteps(text)
  if (steps.length > 1) {
    return (
      <ol className="flex flex-col gap-1">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2">
            {i > 0 && <span className="flex-shrink-0 text-muted">→</span>}
            <span>{s.trim()}</span>
          </li>
        ))}
      </ol>
    )
  }

  const clauses = splitClauses(text)
  if (clauses.length > 1) {
    return (
      <div className="flex flex-col gap-1">
        {clauses.map((c, i) => (
          <p key={i}>{c}</p>
        ))}
      </div>
    )
  }

  return <p>{text}</p>
}

export default function FeatureText({
  text,
  titleClassName = 'mb-1 font-semibold text-dark',
  className,
}: {
  text: string
  titleClassName?: string
  className?: string
}) {
  const parts = splitFeature(text)
  return (
    <div className={className}>
      {parts ? (
        <>
          <p className={titleClassName}>{parts[0]}</p>
          <FeatureBody text={parts[1]} />
        </>
      ) : (
        <FeatureBody text={text} />
      )}
    </div>
  )
}
