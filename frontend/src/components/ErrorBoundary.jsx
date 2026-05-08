import { Component } from 'react';

/**
 * 단순 ErrorBoundary. 자식 트리에서 throw 가 나면 앱 전체가 unmount 되지 않고
 * fallback 만 그 자리에 그려지게.
 *
 * 사용:
 *   <ErrorBoundary fallback={<CardError name="동기 비교" />}>
 *     <PeersOrb axes={...} />
 *   </ErrorBoundary>
 *
 *   fallback 안 주면 default 카드 ("표시할 수 없어요" + 다시 시도) 가 그려짐.
 *
 * 노트:
 *  - useEffect 안에서 throw 하는 컴포넌트(PeersOrb 의 WebGL 실패) 도 잡힘.
 *  - production 에서는 console 로그 안 남김. dev 에서만 디버그용.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info);
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      const { fallback, name = '이 영역' } = this.props;
      if (fallback) {
        return typeof fallback === 'function'
          ? fallback({ error: this.state.error, reset: this.reset })
          : fallback;
      }
      return <DefaultFallback name={name} onRetry={this.reset} />;
    }
    return this.props.children;
  }
}

function DefaultFallback({ name, onRetry }) {
  return (
    <div className="card text-center py-8">
      <div className="text-[14px] font-semibold text-ink-900 mb-1">
        {name} 을 표시할 수 없어요
      </div>
      <p className="text-[12.5px] text-ink-500 break-keep mb-4">
        예상치 못한 오류가 발생했어요. 다시 시도하거나 페이지를 새로고침해
        주세요.
      </p>
      <button type="button" onClick={onRetry} className="btn-default">
        다시 시도
      </button>
    </div>
  );
}
