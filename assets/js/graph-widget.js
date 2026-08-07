/*
 * graph-widget.js — 우측 사이드바 패널에 들어가는 그래프 축소판(미니 그래프).
 *
 * - force-graph 라이브러리를 위젯이 실제로 존재할 때만 동적으로 로드합니다.
 *   (사이드바는 대부분의 페이지에 나타나므로, 필요할 때만 CDN을 불러
 *    전역 성능 부담을 줄입니다.)
 * - graph.json을 fetch해 작은 프리뷰 그래프를 렌더링합니다.
 * - 확대(휠, 커서 기준)/이동(드래그)/노드 드래그를 지원하며,
 *   사용자가 조작하기 전까지는 자동 맞춤(zoomToFit)으로 정렬합니다.
 * - 노드 클릭 시 node.id(포스트 URL)로 이동하고,
 *   별도의 확대 버튼은 전체 그래프 페이지로 이동합니다(HTML 링크로 처리).
 */
(function () {
  // 기본값. 실제 경로는 #graph-widget[data-lib-src]에서 읽어 baseurl을 반영한다.
  var LIB_SRC = '/assets/js/force-graph.min.js';

  function accentColor() {
    var styles = getComputedStyle(document.body);
    return (
      styles.getPropertyValue('--link-color').trim() ||
      styles.getPropertyValue('--btn-share-color').trim() ||
      '#1d7dfa'
    );
  }

  function linkColor() {
    var isDark =
      document.documentElement.getAttribute('data-bs-theme') === 'dark' ||
      document.documentElement.getAttribute('data-mode') === 'dark';
    return isDark ? 'rgba(200,200,200,0.22)' : 'rgba(80,80,80,0.22)';
  }

  function ensureLib(callback, onError) {
    if (typeof ForceGraph !== 'undefined') {
      callback();
      return;
    }
    // 이미 로딩 중인 스크립트가 있으면 그 load 이벤트를 재사용
    var existing = document.querySelector('script[data-force-graph]');
    if (existing) {
      existing.addEventListener('load', callback);
      existing.addEventListener('error', onError);
      return;
    }
    var s = document.createElement('script');
    s.src = LIB_SRC;
    s.setAttribute('data-force-graph', '1');
    s.onload = callback;
    s.onerror = onError;
    document.head.appendChild(s);
  }

  function render(el, data) {
    if (!data || !data.nodes || data.nodes.length === 0) {
      el.style.display = 'none';
      return;
    }

    var accent = accentColor();
    var link = linkColor();

    var Graph = ForceGraph()(el)
      .graphData(data)
      .nodeId('id')
      .nodeVal('val')
      .nodeRelSize(3)
      .nodeColor(function () {
        return accent;
      })
      .linkColor(function () {
        return link;
      })
      .linkWidth(1)
      .backgroundColor('rgba(0,0,0,0)')
      .enableNodeDrag(true)
      // 휠 줌/이동은 force-graph 내장 상호작용(커서 기준 확대)을 그대로 사용한다.
      .enableZoomInteraction(true)
      .enablePanInteraction(true)
      .onNodeClick(function (node) {
        if (node && node.id) {
          window.location.href = node.id;
        }
      });

    Graph.onNodeHover(function (node) {
      el.style.cursor = node ? 'pointer' : null;
    });

    // 사용자가 직접 확대(휠)/이동/드래그를 시작하면 자동 맞춤을 멈춰
    // 조작 중 화면이 원위치로 튕기지 않도록 한다.
    var userInteracted = false;
    function markInteracted() {
      userInteracted = true;
    }
    el.addEventListener('pointerdown', markInteracted);
    // 휠 확대/축소는 내장 줌이 처리한다. 여기서는 자동 맞춤이 다시 끼어들지
    // 않도록 "사용자가 조작했다"는 표시만 남긴다(줌 계산은 하지 않음).
    el.addEventListener('wheel', markInteracted, { passive: true });

    function resize() {
      Graph.width(el.clientWidth).height(el.clientHeight);
      // 아직 사용자가 조작하지 않았을 때만 화면에 맞춰 정렬한다.
      if (!userInteracted) {
        Graph.zoomToFit(0, 8);
      }
    }
    resize();

    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(resize).observe(el);
    } else {
      window.addEventListener('resize', resize);
    }

    // 시뮬레이션이 처음 안정될 때 한 번만 보기 좋게 자동 맞춤한다.
    Graph.onEngineStop(function () {
      if (!userInteracted) {
        Graph.zoomToFit(400, 8);
      }
    });

    // 로드 타이밍(캐시/백그라운드 탭 throttling) 보정: 여러 시점에 재정렬.
    [100, 400, 1000].forEach(function (t) {
      setTimeout(resize, t);
    });

    // 탭이 다시 보이거나 창에 포커스가 돌아올 때 재정렬(관측된 "정답" 트리거).
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        setTimeout(resize, 50);
      }
    });
    window.addEventListener('focus', function () {
      setTimeout(resize, 50);
    });
    window.addEventListener('pageshow', function () {
      setTimeout(resize, 50);
    });
  }

  function init() {
    var el = document.getElementById('graph-widget');
    if (!el) {
      return;
    }

    LIB_SRC = el.getAttribute('data-lib-src') || LIB_SRC;
    var url = el.getAttribute('data-graph-src') || '/assets/js/graph.json';

    fetch(url)
      .then(function (res) {
        if (!res.ok) {
          throw new Error('graph.json 로드 실패: ' + res.status);
        }
        return res.json();
      })
      .then(function (data) {
        ensureLib(
          function () {
            render(el, data);
          },
          function () {
            el.style.display = 'none';
          }
        );
      })
      .catch(function (err) {
        console.error(err);
        el.style.display = 'none';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
