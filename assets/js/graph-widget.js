/*
 * graph-widget.js — 우측 사이드바 패널에 들어가는 그래프 축소판(미니 그래프).
 *
 * - force-graph 라이브러리를 위젯이 실제로 존재할 때만 동적으로 로드합니다.
 *   (사이드바는 대부분의 페이지에 나타나므로, 필요할 때만 CDN을 불러
 *    전역 성능 부담을 줄입니다.)
 * - graph.json을 fetch해 작은 프리뷰 그래프를 렌더링합니다.
 * - 미니 그래프는 확대/이동 조작을 끄고 자동 맞춤(zoomToFit)만 합니다.
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
      .enableNodeDrag(false)
      .enableZoomInteraction(false)
      .enablePanInteraction(false)
      .onNodeClick(function (node) {
        if (node && node.id) {
          window.location.href = node.id;
        }
      });

    Graph.onNodeHover(function (node) {
      el.style.cursor = node ? 'pointer' : null;
    });

    function resize() {
      Graph.width(el.clientWidth).height(el.clientHeight);
      Graph.zoomToFit(0, 8);
    }
    resize();

    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(resize).observe(el);
    } else {
      window.addEventListener('resize', resize);
    }

    // 시뮬레이션이 안정되면 보기 좋게 자동 맞춤
    Graph.onEngineStop(function () {
      Graph.zoomToFit(400, 8);
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
