import kakaoMap from "./module/kakaoMap.js";

/**
 * - 사용자의 위치로 지도의 중앙값을 정하는 함수
 */
function setCenterToUserLocation() {
  navigator.geolocation.getCurrentPosition((pos) => {
    kakaoMap.map.setCenter(
      new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude)
    );
    kakaoMap.map.setLevel(6);
  });
}

/**
 * - 프로그램 시작시 실행되는 초기화 함수
 */
function init() {
  kakaoMap.createLocalOverlay();
  kakaoMap.createSubwayOverlay().then(() => {
    kakaoMap.displaySubwayOverlay(true);
  });
  setCenterToUserLocation();
}

init();
