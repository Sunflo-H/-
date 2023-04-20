/**
 * 발견된 문제점들
 * ! 유형.금액 필터의 초기화 버튼 미적용
 * ! 월세 정렬 기능 미적용 -> 전세랑 월세가 섞여있으니 금액으로 퉁치자
 */

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

/**
 * 로컬과 지하철 클러스터를 먼저 보여줘야해
 */

const map = kakaoMap.map;

function getUserLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject); // success, error
  });
}

//* ============================== 방 정보, 방 클러스터 관련 코드들 =================================
//* ============================================== 검색 기능 관련 코드들 ========================================================

//* ========================================== kakao Map 관련 코드들 ================================================

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
    map.setCenter(
      new kakao.maps.LatLng(data.coords.latitude, data.coords.longitude)
    );
    map.setLevel(6);
    setTimeout(() => {
      kakaoMap.displayLocalOverlay(false);
      kakaoMap.displaySubwayOverlay(true);
    }, 200);
  });
}

init();
