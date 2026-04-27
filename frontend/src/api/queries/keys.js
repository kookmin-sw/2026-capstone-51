/**
 * react-query 의 queryKey 팩토리.
 * 모든 도메인 훅이 이 객체에서 키를 가져온다 — 중복 정의 / 오타 방지.
 *
 * 사용:
 *   useQuery({ queryKey: qk.experiences.one(id), ... })
 *   queryClient.invalidateQueries({ queryKey: qk.experiences.all() })
 */
export const qk = {
  me: () => ['me'],
  dashboard: () => ['users', 'me', 'dashboard'],
  stats: (groupBy) => ['users', 'me', 'stats', groupBy],
  experiences: {
    all: () => ['experiences'],
    one: (id) => ['experiences', id],
  },
  certificates: {
    all: () => ['certificates'],
  },
  essays: {
    all: () => ['essays'],
    one: (id) => ['essays', id],
  },
};
