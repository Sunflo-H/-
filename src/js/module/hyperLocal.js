import kakaoMap from "./kakaoMap.js";
import kakaoSearch from "../api/kakaoSearch.js";

//* ========================================== 세권 관련 코드들 =================================================
const hyperLocal = document.querySelectorAll(".filter__category")[2];
const resetBtn_hyperLocal = hyperLocal.querySelector(".filter__btn--reset");
const applyBtn_hyperLocal = hyperLocal.querySelector(".filter__btn--apply");
const chips = hyperLocal.querySelectorAll(".filter__option-chips");
/**
 * 세권의 범위를 표현하는데 사용하는 원의 배열
 */
const circleList = [];

chips.forEach((chip) => {
  chip.addEventListener("click", (e) => {
    e.currentTarget.classList.toggle("active");
  });
});

resetBtn_hyperLocal.addEventListener("click", (e) =>
  chips.forEach((chip) => chip.classList.remove("active"))
);

applyBtn_hyperLocal.addEventListener("click", (e) => {
  kakaoMap.removeHyperLocalMarker();

  let clickedCluster = kakaoMap
    .getRoomCluster()
    ._clusters.filter((cluster) =>
      cluster
        .getClusterMarker()
        .getContent()
        .classList.contains("cluster-click")
    )[0];

  // 클러스터의 중심좌표
  const lat = clickedCluster.getCenter().Ma;
  const lng = clickedCluster.getCenter().La;

  // 활성화된 chip이 있는지 체크하여 circle을 생성할지 삭제할지 결정하는 변수
  let isActive = false;
  // 활성화된 chips 로 검색
  chips.forEach((chip) => {
    if (chip.classList.contains("active")) {
      // 검색할 키워드
      const keyword = chip.dataset.keyword;
      const markerImageName = chip.dataset.marker;

      kakaoSearch
        .search_hyperLocal(keyword, lat, lng)
        .then((data) =>
          data.forEach((item) =>
            kakaoMap.createHyperLocalMarker(item, markerImageName)
          )
        );
      isActive = true;
    }
  });

  isActive ? createRange(clickedCluster) : removeCircle();
});

/**
 * ^ 클러스터를 인자로 받아 클러스터를 기준으로 원(세권의 범위)을 생성한다.
 * @param {*} cluster 원을 생성할 클러스터
 */
function createRange(cluster) {
  let circle250 = new kakao.maps.Circle({
    center: cluster.getCenter(), // 원의 중심좌표 입니다
    radius: 250, // 미터 단위의 원의 반지름입니다
    strokeWeight: 2, // 선의 두께입니다
    strokeColor: "#75B8FA", // 선의 색깔입니다
    strokeOpacity: 1, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
    strokeStyle: "dashed", // 선의 스타일 입니다
    fillColor: "#CFE7FF", // 채우기 색깔입니다
    fillOpacity: 0.1, // 채우기 불투명도 입니다
  });
  let circle500 = new kakao.maps.Circle({
    center: cluster.getCenter(), // 원의 중심좌표 입니다
    radius: 500, // 미터 단위의 원의 반지름입니다
    strokeWeight: 2, // 선의 두께입니다
    strokeColor: "#75B8FA", // 선의 색깔입니다
    strokeOpacity: 1, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
    strokeStyle: "dashed", // 선의 스타일 입니다
    fillColor: "#CFE7FF", // 채우기 색깔입니다
    fillOpacity: 0.1, // 채우기 불투명도 입니다
  });
  let circle1000 = new kakao.maps.Circle({
    center: cluster.getCenter(), // 원의 중심좌표 입니다
    radius: 1000, // 미터 단위의 원의 반지름입니다
    strokeWeight: 2, // 선의 두께입니다
    strokeColor: "#75B8FA", // 선의 색깔입니다
    strokeOpacity: 1, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
    strokeStyle: "dashed", // 선의 스타일 입니다
    fillColor: "#CFE7FF", // 채우기 색깔입니다
    fillOpacity: 0.5, // 채우기 불투명도 입니다
  });

  // 기존 원이 있다면 지운다.
  removeCircle();

  circleList.push(circle1000);
  circleList.push(circle500);
  circleList.push(circle250);

  circleList.forEach((circle) => {
    circle.setMap(kakaoMap.map);
  });
}

function removeCircle() {
  if (circleList.length !== 0) {
    circleList.forEach((circle) => {
      circle.setMap(null);
    });
    circleList.length = 0;
  }
}
