// import { getOneRoomData } from "./oneroom.js";

const filter = document.querySelectorAll(".filter__select");
// console.log(filter);
// const size = filter;
// const sizeSelect = size.querySelector(".filter__select");
// const sizeOption = size.querySelector(".filter__option-table");
// const sizeOptionItem = size.querySelectorAll(".filter__option");

const map = new kakao.maps.Map(document.getElementById("map"), {
  center: new kakao.maps.LatLng(37.53886742395844, 126.98678427911392),
  level: 8, // 지도의 확대 레벨
});

kakao.maps.event.addListener(map, "click", function (mouseEvent) {
  console.log(mouseEvent.latLng); // true
  console.log(map.getLevel());
});

// 마우스 휠에 따라 함수 실행?
// 지도 렙에 따라 함수 실행?
// 지도 렙은 마우스 휠에 따라 바뀌어 => 지도 렙 감지 or 마우스 휠 감지
/**
 *^ 역 주변 매물의 위치를 클러스터로 나타낸다.
 */
async function getOneRoomCluster(subway) {
  if (map.getLevel() > 6) {
    let oneroomList = await getOneRoomData(subway); // 프로미스 배열이 있음, await 안쓰면 프로미스 안에 프로미스배열이 있음
    Promise.all(oneroomList).then((oneroomList) => {
      let coordList = [];
      oneroomList.forEach((oneroom) => {
        coordList.push(oneroom.item.random_location.split(","));
      });
      createCluster(coordList);
    });
  }
}
// getOneRoomCluster("군자역");

/**
 * 좌표 리스트를 받아 클러스터를 생성
 * @param {*} coords
 */
function createCluster(coords) {
  let clusterer = new kakao.maps.MarkerClusterer({
    map: map, // 마커들을 클러스터로 관리하고 표시할 지도 객체
    averageCenter: true, // 클러스터에 포함된 마커들의 평균 위치를 클러스터 마커 위치로 설정
    minLevel: 3, // 클러스터 할 최소 지도 레벨
    gridSize: 60,
    minClusterSize: 2, // Number : 클러스터링 할 최소 마커 수 (default: 2)
    styles: [
      {
        width: "53px",
        height: "52px",
        background: "#3c5cff",
        color: "#fff",
        textAlign: "center",
        lineHeight: "54px",
        borderRadius: "50%",
        border: "1px solid #4c3aff",
        opacity: "0.85",
      },
    ],
  });

  var markers = coords.map(function (position, i) {
    return new kakao.maps.Marker({
      position: new kakao.maps.LatLng(position[0], position[1]),
    });
  });

  clusterer.setTexts((size) => {
    var text = "";

    if (size > 100) text = "100+";
    else text = size;

    return text;
  });
  clusterer.addMarkers(markers);
}

function getSubwayCluster() {}
