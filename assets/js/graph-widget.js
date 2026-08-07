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
  var LIB_SRC = 'https://cdn.jsdelivr.net/npm/force-graph@1';

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
      // 휠 줌은 아래에서 커서 기준으로 직접 처리하므로 내장 줌은 끈다.
      .enableZoomInteraction(false)
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

    // 커서 기준 확대/축소: 내장 휠 줌은 이 환경에서 커서 위치를 무시하고
    // 특정 지점 기준으로만 동작하므로, 좌표 변환 API로 직접 구현한다.
    // 커서 아래의 그래프 지점이 확대/축소 후에도 커서 위치에 그대로 남도록
    // 줌 배율과 중심(centerAt)을 함께 보정한다.
    el.addEventListener(
      'wheel',
      function (ev) {
        ev.preventDefault();
        markInteracted();

        // 실제 캔버스 기준의 커서 좌표(테두리 오프셋까지 정확히 반영)
        var canvas = el.querySelector('canvas');
        var rect = (canvas || el).getBoundingClientRect();
        var mx = ev.clientX - rect.left;
        var my = ev.clientY - rect.top;
        var w = rect.width;
        var h = rect.height;

        // 줌 전, 커서 아래에 있는 그래프 좌표
        var gp = Graph.screen2GraphCoords(mx, my);
        if (!gp) {
          return;
        }

        var oldK = Graph.zoom();
        // deltaY > 0(아래로 스크롤) → 축소, < 0 → 확대
        var factor = Math.exp(-ev.deltaY * 0.0015);
        var newK = Math.max(0.05, Math.min(80, oldK * factor));
        if (newK === oldK) {
          return;
        }

        Graph.zoom(newK);
        // gp가 새 배율에서도 (mx, my)에 오도록 뷰 중심을 재계산한다.
        //   screen = viewportCenter + (graph - center) * k
        var cx = gp.x - (mx - w / 2) / newK;
        var cy = gp.y - (my - h / 2) / newK;
        Graph.centerAt(cx, cy);
      },
      { passive: false }
    );

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
  }

  function init() {
    var el = document.getElementById('graph-widget');
    if (!el) {
      return;
    }

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
