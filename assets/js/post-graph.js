/*
 * post-graph.js — Force-Directed Graph 렌더러.
 *
 * 이 파일은 정적 자산(assets)으로 그대로 제공되며 HTML 압축(compress_html)의
 * 영향을 받지 않으므로, 인라인 스크립트에서 발생하던 "// 주석이 한 줄로 합쳐져
 * 이후 코드를 통째로 주석 처리"하는 문제(Unexpected end of input)가 없습니다.
 *
 * - CDN force-graph(HTML5 Canvas 2D)로 렌더링
 * - #post-graph 컨테이너의 data-graph-src 속성에서 graph.json 경로를 읽음
 * - 노드 클릭 시 node.id(포스트 URL)로 이동
 * - ResizeObserver로 컨테이너 크기에 맞춰 반응형 리사이즈
 */
(function () {
  function themeColors() {
    var styles = getComputedStyle(document.body);
    var text = styles.getPropertyValue('--text-color').trim() || '#333';
    var accent =
      styles.getPropertyValue('--link-color').trim() ||
      styles.getPropertyValue('--btn-share-color').trim() ||
      '#1d7dfa';
    var isDark =
      document.documentElement.getAttribute('data-bs-theme') === 'dark' ||
      document.documentElement.getAttribute('data-mode') === 'dark';
    return {
      text: text,
      node: accent,
      link: isDark ? 'rgba(200,200,200,0.25)' : 'rgba(80,80,80,0.25)'
    };
  }

  function initGraph(container, data) {
    if (!data || !data.nodes || data.nodes.length === 0) {
      container.innerHTML =
        '<div class="post-graph__empty">표시할 포스트가 없습니다.</div>';
      return;
    }

    var colors = themeColors();

    var Graph = ForceGraph()(container)
      .graphData(data)
      .nodeId('id')
      .nodeLabel('name')
      .nodeRelSize(4)
      .nodeVal('val')
      .linkColor(function () {
        return colors.link;
      })
      .linkWidth(1)
      .backgroundColor('rgba(0,0,0,0)')
      .onNodeClick(function (node) {
        // 노드 클릭 시 해당 포스트 URL(node.id)로 이동
        if (node && node.id) {
          window.location.href = node.id;
        }
      })
      .nodeCanvasObject(function (node, ctx, globalScale) {
        var radius = Math.sqrt(node.val || 1) * 3;

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = colors.node;
        ctx.fill();

        // 충분히 확대되었을 때만 라벨을 그려 가독성을 유지
        if (globalScale >= 1.2) {
          var label = node.name || node.id;
          var fontSize = 12 / globalScale;
          ctx.font = fontSize + 'px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = colors.text;
          ctx.fillText(label, node.x, node.y + radius + 1);
        }
      })
      .nodePointerAreaPaint(function (node, color, ctx) {
        var radius = Math.sqrt(node.val || 1) * 3;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 2, 0, 2 * Math.PI, false);
        ctx.fill();
      });

    // 마우스 오버 시 커서를 포인터로 변경
    Graph.onNodeHover(function (node) {
      container.style.cursor = node ? 'pointer' : null;
    });

    // 사용자가 직접 확대/이동/드래그를 시작하면 자동 정렬을 멈춘다.
    var userInteracted = false;
    function markInteracted() {
      userInteracted = true;
    }
    container.addEventListener('pointerdown', markInteracted);
    container.addEventListener('wheel', markInteracted, { passive: true });

    // 컨테이너 크기에 맞춰 반응형 리사이즈 + 화면에 맞춰 정렬.
    // 로드 직후에는 캔버스 크기/레이아웃이 아직 확정되지 않아 초기 배치가
    // 어긋날 수 있으므로, 크기를 갱신하고 (사용자가 아직 조작하지 않았다면)
    // 전체가 보이도록 다시 맞춘다.
    function resize() {
      Graph.width(container.clientWidth).height(container.clientHeight);
    }
    function fit() {
      resize();
      if (!userInteracted) {
        Graph.zoomToFit(300, 20);
      }
    }
    resize();

    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(resize).observe(container);
    } else {
      window.addEventListener('resize', resize);
    }

    // 시뮬레이션이 안정되면 한 번 맞춘다.
    Graph.onEngineStop(function () {
      fit();
    });

    // 로드 타이밍(캐시/백그라운드 탭 throttling) 보정을 위해 여러 시점에 재정렬.
    [100, 400, 1000].forEach(function (t) {
      setTimeout(fit, t);
    });

    // 탭이 다시 보이거나 창에 포커스가 돌아올 때 재정렬(관측된 "정답" 트리거).
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        setTimeout(fit, 50);
      }
    });
    window.addEventListener('focus', function () {
      setTimeout(fit, 50);
    });
    window.addEventListener('pageshow', function () {
      setTimeout(fit, 50);
    });
  }

  function init() {
    var container = document.getElementById('post-graph');
    if (!container) {
      return;
    }

    // force-graph 스크립트가 아직 평가되지 않았을 수 있으므로(로드 순서/캐시
    // 타이밍에 따라) ForceGraph가 준비될 때까지 잠깐 재시도한다.
    if (typeof ForceGraph === 'undefined') {
      if (init._tries === undefined) {
        init._tries = 0;
      }
      if (init._tries < 100) {
        init._tries++;
        setTimeout(init, 50);
      } else {
        container.innerHTML =
          '<div class="post-graph__empty">그래프 라이브러리를 불러오지 못했습니다.</div>';
      }
      return;
    }

    var dataUrl =
      container.getAttribute('data-graph-src') || '/assets/js/graph.json';

    fetch(dataUrl)
      .then(function (res) {
        if (!res.ok) {
          throw new Error('graph.json 로드 실패: ' + res.status);
        }
        return res.json();
      })
      .then(function (data) {
        initGraph(container, data);
      })
      .catch(function (err) {
        console.error(err);
        container.innerHTML =
          '<div class="post-graph__empty">그래프 데이터를 불러오지 못했습니다.</div>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
