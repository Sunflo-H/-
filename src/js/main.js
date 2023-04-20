import kakaoMap from "./module/kakaoMap.js";
import filter from "./module/filter.js";
import { createRoomSection } from "./module/oneroom.js";

/**
 * !설명
 * 지역, 지하철은 customOverlay로 만들었다. 방은 cluster로 만들었다.
 *
 * !지도 이용 순서
 * 1. init()함수로 지역, 지하철 오버레이를 생성한다.
 * 2. 지하철 오버레이를 클릭하면 방 클러스터가 생성된다.
 * 3. 방을 리스트로 보여주며, 모든 방에 대해 필터적용, 각 방에 대한 세권찾기
 *
 *
 * 역세권 거리
 * 반경 250m, 500m, 1km
 */

function getUserLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject); // success, error
  });
}

/**
 * ^ 프로그램 시작시 실행되는 초기화 함수
 * ^ 처음부터 실행되어야할 함수들을 모았다.
 */
function init() {
  createRoomSection(null);
  kakaoMap.createLocalOverlay();
  kakaoMap.createSubwayOverlay();
  filter.createFilterOptionContent_price("전체");
  getUserLocation().then((data) => {
    kakaoMap.map.setCenter(
      new kakao.maps.LatLng(data.coords.latitude, data.coords.longitude)
    );
    kakaoMap.map.setLevel(6);
    setTimeout(() => {
      kakaoMap.displayLocalOverlay(false);
      kakaoMap.displaySubwayOverlay(true);
    }, 200);
  });
}

init();
